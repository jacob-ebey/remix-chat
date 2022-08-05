import type { ActionArgs } from "@remix-run/cloudflare";
import { json, redirect } from "@remix-run/cloudflare";
import { Link, useActionData } from "@remix-run/react";
import { TextInput, Label, Checkbox } from "flowbite-react";

export async function action({
	context: { env, sessionStorage },
	request,
}: ActionArgs) {
	let formData = new URLSearchParams(await request.text());
	let values: { username?: string } = {};
	let errors: {
		global?: string;
		username?: string;
		password?: string;
		confirmPassword?: string;
	} = {};

	let username = formData.get("username");
	if (!username) {
		errors.username = "Username is required.";
	} else if (!(username = username.trim()) || username.length < 3) {
		errors.username = "Username must be at least 3 characters.";
	}
	let password = formData.get("password");
	if (!password) {
		errors.password = "Password is required.";
	} else if (password.length < 6) {
		errors.password = "Password must be at least 6 characters.";
	}
	let confirmPassword = formData.get("confirmPassword");
	if (!confirmPassword) {
		errors.confirmPassword = "Please confirm your password.";
	} else if (password && confirmPassword !== password) {
		errors.confirmPassword = "Passwords do not match.";
	}

	values.username = username || undefined;

	if (Object.keys(errors).length > 0) {
		return json({ errors, values }, 400);
	}

	username = username!;
	password = password!;

	let userId = env.USER.idFromName(username);
	let userDO = env.USER.get(userId);
	let userResponse = await userDO.fetch("https://.../signup", {
		method: "post",
		body: JSON.stringify({
			username,
			password,
		}),
	});
	let user = await userResponse.json();

	if (!user) {
		switch (userResponse.status) {
			case 405:
				errors.username = "Username is already taken.";
				break;
			default:
				errors.global = "Failed to sign up.";
				break;
		}
		return json({ errors, values }, userResponse.status);
	}

	let session = await sessionStorage.getSession();
	session.set("user", user);

	return redirect("/", {
		headers: {
			"Set-Cookie": await sessionStorage.commitSession(session),
		},
	});
}

export default function Signup() {
	let { errors, values } = useActionData<typeof action>() || {};

	return (
		<section className="bg-gray-50 dark:bg-gray-900">
			<div className="mx-auto flex flex-col items-center justify-center px-6 py-8 md:h-screen lg:py-0">
				<Link
					to="/"
					className="mb-6 flex items-center text-2xl font-semibold text-gray-900 dark:text-white"
				>
					Remix Chat
				</Link>
				<div className="w-full rounded-lg bg-white shadow dark:border dark:border-gray-700 dark:bg-gray-800 sm:max-w-md md:mt-0 xl:p-0">
					<div className="space-y-4 p-6 sm:p-8 md:space-y-6">
						<h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 dark:text-white md:text-2xl">
							Create an account
						</h1>
						<form className="space-y-4 md:space-y-6" method="post">
							{errors?.global && (
								<p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
									{errors.global}
								</p>
							)}
							<div>
								<div className="mb-2 block">
									<Label htmlFor="username" value="Username" />
								</div>
								<TextInput
									autoCapitalize="off"
									autoComplete="username"
									type="text"
									name="username"
									id="username"
									placeholder="your-username"
									required
									helperText={errors?.username}
									defaultValue={values?.username}
								/>
							</div>
							<div>
								<div className="mb-2 block">
									<Label htmlFor="password" value="Password" />
								</div>
								<TextInput
									type="password"
									autoComplete="new-password"
									name="password"
									id="password"
									placeholder="••••••••"
									required
									helperText={errors?.password}
								/>
							</div>
							<div>
								<div className="mb-2 block">
									<Label htmlFor="confirmPassword" value="Confirm password" />
								</div>
								<TextInput
									type="password"
									autoComplete="new-password"
									name="confirmPassword"
									id="confirmPassword"
									placeholder="••••••••"
									required
									helperText={errors?.confirmPassword}
								/>
							</div>
							<div className="flex items-center gap-2">
								<Checkbox id="accept" required />
								<Label htmlFor="accept">
									I agree to the{" "}
									<Link
										to="/terms-and-conditions"
										className="text-blue-600 hover:underline dark:text-blue-500"
									>
										terms and conditions
									</Link>
								</Label>
							</div>
							<button
								type="submit"
								className="bg-primary-600 hover:bg-primary-700 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 w-full rounded-lg px-5 py-2.5 text-center text-sm font-medium text-white focus:outline-none focus:ring-4"
							>
								Create an account
							</button>
							<p className="text-sm font-light text-gray-500 dark:text-gray-400">
								Already have an account?{" "}
								<Link
									to="/login"
									className="text-primary-600 dark:text-primary-500 font-medium hover:underline"
								>
									Login here
								</Link>
							</p>
						</form>
					</div>
				</div>
			</div>
		</section>
	);
}
