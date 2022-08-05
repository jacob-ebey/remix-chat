import * as React from "react";
import type { LoaderArgs } from "@remix-run/cloudflare";
import { json, redirect } from "@remix-run/cloudflare";
import { useLoaderData, useParams } from "@remix-run/react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import type { UserBody } from "user-do";

export async function loader({
	context: { sessionStorage },
	request,
}: LoaderArgs) {
	let session = await sessionStorage.getSession(request.headers.get("Cookie"));
	let user = session.get("user") as UserBody;
	if (!user) {
		return redirect("/login");
	}

	return json({
		username: user.username,
	});
}

export default function ChatRoom() {
	let { username } = useLoaderData<typeof loader>();
	let { roomId } = useParams();

	let wsHref = React.useMemo(() => {
		if (typeof document === "undefined") return null;
		let protocol = location.protocol === "https:" ? "wss:" : "ws:";
		return protocol + "//" + location.host + "/api/room/" + roomId;
	}, [roomId]);

	let { readyState, lastMessage, sendJsonMessage } = useWebSocket(wsHref);

	React.useEffect(() => {
		if (readyState === ReadyState.OPEN) {
			sendJsonMessage({ name: username });
		}
	}, [readyState, sendJsonMessage, username]);

	let [socketReady, setSocketReady] = React.useState(false);
	let [messages, setMessages] = React.useState<
		(
			| { type: "event"; text: string }
			| { type: "message"; text: string; from: string }
		)[]
	>([]);
	React.useEffect(() => {
		let lastMessageJson: undefined | any;
		try {
			if (lastMessage?.data) {
				lastMessageJson = JSON.parse(lastMessage.data);
			}
		} catch (err) {
			console.error("Failed to parse last message", err);
		}
		if (lastMessageJson?.ready === true) {
			React.startTransition(() => {
				setSocketReady(true);
				setMessages((messages) => [
					{ type: "event", text: "Welcome to the chat!" },
					...messages,
				]);
			});
		} else if (lastMessageJson?.joined) {
			if (lastMessageJson.joined !== username) {
				setMessages((messages) => [
					{ type: "event", text: `${lastMessageJson.joined} joined.` },
					...messages,
				]);
			}
		} else if (lastMessageJson?.quit) {
			setMessages((messages) => [
				{ type: "event", text: `${lastMessageJson.quit} left.` },
				...messages,
			]);
		} else if (lastMessageJson?.error) {
			setMessages((messages) => [
				{ type: "event", text: lastMessageJson.error },
				...messages,
			]);
		} else if (lastMessageJson?.message && lastMessageJson.name) {
			setMessages((messages) => [
				{
					type: "message",
					text: `${lastMessageJson.message}`,
					from: lastMessageJson.name,
				},
				...messages,
			]);
		}
	}, [lastMessage, setMessages, username]);

	let readyToSendMessages = socketReady && readyState === ReadyState.OPEN;

	let messageInputRef = React.useRef<HTMLInputElement>(null);

	let handleSendMessage = (event: React.FormEvent) => {
		event.preventDefault();
		if (messageInputRef.current) {
			let message = messageInputRef.current.value;
			messageInputRef.current.value = "";
			sendJsonMessage({ message });
		}
	};

	return (
		<div className="p:2 mx-auto flex max-w-4xl flex-1 flex-col justify-between sm:p-6">
			<div className="mb-2 px-4 pt-4">
				<form className="relative flex" onSubmit={handleSendMessage}>
					<input
						ref={messageInputRef}
						disabled={!readyToSendMessages}
						type="text"
						placeholder="Write your message!"
						className="w-full bg-gray-200  py-3 text-gray-600 placeholder-gray-600 focus:placeholder-gray-400 focus:outline-none"
					/>
					<div className="inset-y-0 right-0 hidden items-center sm:flex">
						<button
							type="submit"
							className="inline-flex items-center justify-center bg-blue-500 px-4 py-3 text-white transition duration-500 ease-in-out hover:bg-blue-400 focus:outline-none"
						>
							<span className="font-bold">Send</span>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 20 20"
								fill="currentColor"
								className="ml-2 h-6 w-6 rotate-90 transform"
							>
								<path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
							</svg>
						</button>
					</div>
				</form>
			</div>
			<div
				id="messages"
				className="scrollbar-thumb-blue scrollbar-thumb-rounded scrollbar-track-blue-lighter scrollbar-w-2 scrolling-touch flex flex-col space-y-4 p-3"
			>
				{messages.map((message, idx) => {
					let key = `${idx}-${message.type}-${message.text}-${
						(message as any).from || ""
					}`;
					switch (message.type) {
						case "event":
							return (
								<div key={key} className="chat-message">
									<div className="flex items-end">
										<div className="order-2 mx-2 flex max-w-xs flex-col items-start space-y-2 text-xs">
											<div>
												<span className="inline-block rounded-lg rounded-bl-none bg-gray-300 px-4 py-2 text-gray-600">
													{message.text}
												</span>
											</div>
										</div>
										<svg
											aria-label="Bot"
											className="order-1 h-6 w-6 rounded-full"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
											strokeWidth="2"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												d="M13 10V3L4 14h7v7l9-11h-7z"
											/>
										</svg>
									</div>
								</div>
							);
						case "message":
							if (message.from === username) {
								return (
									<div className="chat-message" key={key}>
										<div className="flex items-end justify-end">
											<div className="order-1 mx-2 flex max-w-xs flex-col items-end space-y-2 text-xs">
												<div>
													<span className="inline-block rounded-lg rounded-br-none bg-blue-600 px-4 py-2 text-base text-white ">
														{message.text}
													</span>
												</div>
											</div>
											<div className="order-1 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white">
												{message.from.charAt(0)}
											</div>
										</div>
									</div>
								);
							}
							return (
								<div className="chat-message" key={key}>
									<div className="flex items-end">
										<div className="order-2 mx-2 flex max-w-xs flex-col items-start space-y-2 text-xs">
											<div>
												<div className="text-sm">{message.from}</div>
												<span className="inline-block rounded-lg rounded-bl-none bg-gray-300 px-4 py-2 text-base text-gray-600">
													{message.text}
												</span>
											</div>
										</div>
										<div className="order-1 flex h-6 w-6 items-center justify-center rounded-full bg-gray-300 text-gray-600">
											{message.from.charAt(0)}
										</div>
									</div>
								</div>
							);
						default:
							return null;
					}
				})}
			</div>
		</div>
	);
}
