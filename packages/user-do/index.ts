import { json } from "@remix-run/cloudflare";

interface User {
	hashedPassword: string;
	id: string;
	username: string;
}

export interface UserBody {
	id: string;
	username: string;
}

export interface SignupBody {
	password: string;
	username: string;
}

export interface LoginBody {
	password: string;
	username: string;
}

export default class UserDurableObject {
	private user: User | undefined;

	constructor(private state: DurableObjectState) {
		this.state.blockConcurrencyWhile(async () => {
			this.user = await this.state.storage.get<User | undefined>("user");
		});
	}

	async fetch(request: Request) {
		let url = new URL(request.url);
		let user = this.user;
		let id = this.state.id.toString();

		try {
			switch (url.pathname) {
				case "/signup": {
					if (user) {
						return json(null, { status: 405 });
					}
					let body = await request.json<SignupBody>();
					if (!body || !body.password || !body.username) {
						return json(null, { status: 400 });
					}
					let hashedPassword = await hash(body.password);
					user = {
						hashedPassword,
						id,
						username: body.username,
					};
					break;
				}
				case "/login": {
					if (!user) {
						return json(null, { status: 405 });
					}
					let body = await request.json<LoginBody>();
					if (!body || !body.password || !body.username) {
						return json(null, { status: 400 });
					}
					if (!(await compare(user.hashedPassword, body.password))) {
						return json(null, { status: 401 });
					}
					break;
				}
				case "/delete": {
					user = undefined;
					break;
				}
				case "/":
					break;
				default:
					return json(null, { status: 404 });
			}
		} catch (e: any) {
			console.log(e.message);
			console.log(e.stack);
			return json(null, { status: 500 });
		}

		this.user = user;
		if (user) {
			this.state.storage.put("user", user);
		} else {
			this.state.storage.delete("user");
		}

		return json<UserBody | null>(
			user
				? {
						id: user.id,
						username: user.username,
				  }
				: null,
			user ? 200 : 404
		);
	}
}

/*-----------------------------------------------------------------------
 * https://gist.github.com/chrisveness/770ee96945ec12ac84f134bf538d89fb
 *-----------------------------------------------------------------------*/

/**
 * Returns PBKDF2 derived key from supplied password.
 *
 * Stored key can subsequently be used to verify that a password matches the original password used
 * to derive the key, using pbkdf2Verify().
 *
 * @param   {String} password - Password to be hashed using key derivation function.
 * @param   {Number} [iterations=1e6] - Number of iterations of HMAC function to apply.
 * @returns {String} Derived key as base64 string.
 *
 * @example
 *   const key = await pbkdf2('pāşšŵōřđ'); // eg 'djAxBRKXWNWPyXgpKWHld8SWJA9CQFmLyMbNet7Rle5RLKJAkBCllLfM6tPFa7bAis0lSTiB'
 */
async function hash(password: string) {
	let iterations = 100000;
	const pwUtf8 = new TextEncoder().encode(password); // encode pw as UTF-8
	const pwKey = await crypto.subtle.importKey("raw", pwUtf8, "PBKDF2", false, [
		"deriveBits",
	]); // create pw key

	const saltUint8 = crypto.getRandomValues(new Uint8Array(16)); // get random salt

	const params = {
		name: "PBKDF2",
		hash: "SHA-256",
		salt: saltUint8,
		iterations: iterations,
	}; // pbkdf2 params
	const keyBuffer = await crypto.subtle.deriveBits(params, pwKey, 256); // derive key

	const keyArray = Array.from(new Uint8Array(keyBuffer)); // key as byte array

	const saltArray = Array.from(new Uint8Array(saltUint8)); // salt as byte array

	const iterHex = ("000000" + iterations.toString(16)).slice(-6); // iter’n count as hex
	const iterArray = iterHex.match(/.{2}/g)!.map((byte) => parseInt(byte, 16)); // iter’ns as byte array

	const compositeArray = ([] as number[]).concat(
		saltArray,
		iterArray,
		keyArray
	); // combined array
	const compositeStr = compositeArray
		.map((byte) => String.fromCharCode(byte))
		.join(""); // combined as string
	const compositeBase64 = btoa("v01" + compositeStr); // encode as base64

	return compositeBase64; // return composite key
}

/**
 * Verifies whether the supplied password matches the password previously used to generate the key.
 *
 * @param   {String}  key - Key previously generated with pbkdf2().
 * @param   {String}  password - Password to be matched against previously derived key.
 * @returns {boolean} Whether password matches key.
 *
 * @example
 *   const match = await pbkdf2Verify(key, 'pāşšŵōřđ'); // true
 */
async function compare(key: string, password: string) {
	let compositeStr = null; // composite key is salt, iteration count, and derived key
	try {
		compositeStr = atob(key);
	} catch (e) {
		throw new Error("Invalid key");
	} // decode from base64

	const version = compositeStr.slice(0, 3); //  3 bytes
	const saltStr = compositeStr.slice(3, 19); // 16 bytes (128 bits)
	const iterStr = compositeStr.slice(19, 22); //  3 bytes
	const keyStr = compositeStr.slice(22, 54); // 32 bytes (256 bits)

	if (version != "v01") throw new Error("Invalid key");

	// -- recover salt & iterations from stored (composite) key

	const saltUint8 = new Uint8Array(
		saltStr.match(/./g)!.map((ch) => ch.charCodeAt(0))
	); // salt as Uint8Array
	// note: cannot use TextEncoder().encode(saltStr) as it generates UTF-8

	const iterHex = iterStr
		.match(/./g)!
		.map((ch) => ch.charCodeAt(0).toString(16))
		.join(""); // iter’n count as hex
	const iterations = parseInt(iterHex, 16); // iter’ns

	// -- generate new key from stored salt & iterations and supplied password

	const pwUtf8 = new TextEncoder().encode(password); // encode pw as UTF-8
	const pwKey = await crypto.subtle.importKey("raw", pwUtf8, "PBKDF2", false, [
		"deriveBits",
	]); // create pw key

	const params = {
		name: "PBKDF2",
		hash: "SHA-256",
		salt: saltUint8,
		iterations: iterations,
	}; // pbkdf params
	const keyBuffer = await crypto.subtle.deriveBits(params, pwKey, 256); // derive key
	const keyArray = Array.from(new Uint8Array(keyBuffer)); // key as byte array
	const keyStrNew = keyArray.map((byte) => String.fromCharCode(byte)).join(""); // key as string

	return keyStrNew == keyStr; // test if newly generated key matches stored key
}
