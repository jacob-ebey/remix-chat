import type { LoaderArgs } from "@remix-run/cloudflare";

export async function loader({
	context: { env, sessionStorage },
	params: { roomId },
	request,
}: LoaderArgs) {
	let session = await sessionStorage.getSession(request.headers.get("Cookie"));
	let user = session.get("user");
	if (!user) {
		return new Response(null, { status: 401 });
	}

	let id = env.CHAT_ROOM.idFromString(roomId!);
	let stub = env.CHAT_ROOM.get(id);

	return stub.fetch("https://.../websocket", request);
}
