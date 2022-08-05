import type { ActionArgs } from "@remix-run/cloudflare";
import { redirect } from "@remix-run/cloudflare";

export async function action({
	context: { sessionStorage },
	request,
}: ActionArgs) {
	let session = await sessionStorage.getSession(request.headers.get("Cookie"));

	return redirect("/", {
		headers: {
			"Set-Cookie": await sessionStorage.destroySession(session),
		},
	});
}

export function loader() {
	return redirect("/");
}

export default () => null;
