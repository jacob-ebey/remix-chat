import type { ActionArgs } from "@remix-run/cloudflare";
import { redirect } from "@remix-run/cloudflare";

export async function action({
	context: { env, sessionStorage },
	request,
}: ActionArgs) {
	let session = await sessionStorage.getSession(request.headers.get("Cookie"));
	let user = session.get("user");
	if (!user) {
		return redirect("/login");
	}

	let id = env.CHAT_ROOM.newUniqueId();
	return redirect(`/chat/${id.toString()}`);
}

export function loader() {
	return redirect("/");
}

export default () => null;
