import type { LoaderArgs } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { Link, useLoaderData } from "@remix-run/react";

export async function loader({
	context: { sessionStorage },
	request,
}: LoaderArgs) {
	let session = await sessionStorage.getSession(request.headers.get("Cookie"));
	let user = session.get("user");

	return json({ user });
}

export default function Index() {
	let { user } = useLoaderData<typeof loader>();

	return (
		<>
			<section className="bg-white dark:bg-gray-900">
				<div className="mx-auto max-w-screen-xl py-16 px-4 text-center lg:py-32 lg:px-12">
					<h1 className="mb-4 text-4xl font-extrabold leading-none tracking-tight text-gray-900 dark:text-white md:text-5xl lg:text-6xl">
						Welcome to Remix Chat
					</h1>
					<p className="mb-8 text-lg font-normal text-gray-500 dark:text-gray-400 sm:px-16 lg:text-xl xl:px-48">
						A chat application build on top of{" "}
						<a
							href="https://remix.run"
							className="underline"
							target="_blank"
							rel="noopener noreferrer"
						>
							Remix
						</a>{" "}
						and{" "}
						<a
							href="https://cloudflare.com"
							className="underline"
							target="_blank"
							rel="noopener noreferrer"
						>
							Cloudflare
						</a>
						.
					</p>
					{user ? (
						<div className="mb-8 flex flex-col space-y-4 sm:flex-row sm:justify-center sm:space-y-0 sm:space-x-4 lg:mb-16">
							<button
								form="logout-form"
								className="bg-primary-700 hover:bg-primary-800 focus:ring-primary-300 dark:focus:ring-primary-900 inline-flex items-center justify-center rounded-lg py-3 px-5 text-center text-base font-medium text-gray-900 focus:ring-4 dark:text-white"
							>
								Logout
							</button>
							<button
								form="new-chat-form"
								className="inline-flex items-center justify-center rounded-lg border border-gray-300 py-3 px-5 text-center text-base font-medium text-gray-900 hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 dark:border-gray-700 dark:text-white dark:hover:bg-gray-700 dark:focus:ring-gray-800"
							>
								New Chat
							</button>
						</div>
					) : (
						<div className="mb-8 flex flex-col space-y-4 sm:flex-row sm:justify-center sm:space-y-0 sm:space-x-4 lg:mb-16">
							<Link
								to="/login"
								className="bg-primary-700 hover:bg-primary-800 focus:ring-primary-300 dark:focus:ring-primary-900 inline-flex items-center justify-center rounded-lg py-3 px-5 text-center text-base font-medium text-gray-900 focus:ring-4 dark:text-white"
							>
								Log in
							</Link>
							<Link
								to="/signup"
								className="inline-flex items-center justify-center rounded-lg border border-gray-300 py-3 px-5 text-center text-base font-medium text-gray-900 hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 dark:border-gray-700 dark:text-white dark:hover:bg-gray-700 dark:focus:ring-gray-800"
							>
								Get Started
							</Link>
						</div>
					)}
				</div>
			</section>
			<section className="bg-white dark:bg-gray-900">
				<div className="mx-auto max-w-screen-xl py-8 px-4 sm:py-16 lg:px-6">
					<h2 className="mb-8 text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">
						Frequently asked questions
					</h2>
					<div className="grid border-t border-gray-200 pt-8 text-left dark:border-gray-700 md:grid-cols-2 md:gap-16">
						<div>
							<div className="mb-10">
								<h3 className="mb-4 flex items-center text-lg font-medium text-gray-900 dark:text-white">
									<FAQIcon />
									Where is this hosted?
								</h3>
								<p className="text-gray-500 dark:text-gray-400">
									This is hosted on{" "}
									<a
										href="https://cloudflare.com"
										target="_blank"
										rel="noopener noreferrer"
										className="underline"
									>
										Cloudflare
									</a>{" "}
									utilizing{" "}
									<a
										href="https://workers.cloudflare.com"
										target="_blank"
										rel="noopener noreferrer"
										className="underline"
									>
										Workers
									</a>
									, and{" "}
									<a
										href="https://developers.cloudflare.com/workers/runtime-apis/durable-objects"
										target="_blank"
										rel="noopener noreferrer"
										className="underline"
									>
										Durable Objects
									</a>
									.
								</p>
							</div>
						</div>
						<div>
							<div className="mb-10">
								<h3 className="mb-4 flex items-center text-lg font-medium text-gray-900 dark:text-white">
									<svg
										className="mr-2 h-5 w-5 flex-shrink-0 text-gray-500 dark:text-gray-400"
										fill="currentColor"
										viewBox="0 0 20 20"
										xmlns="http://www.w3.org/2000/svg"
									>
										<path
											fillRule="evenodd"
											d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
											clipRule="evenodd"
										/>
									</svg>
									What region does this run in?
								</h3>
								<p className="text-gray-500 dark:text-gray-400">
									Thanks to Cloudflare compute at edge the entire application is
									running in a data center within a few milliseconds from your
									current location.
								</p>
							</div>
						</div>
					</div>
				</div>
			</section>
		</>
	);
}

function FAQIcon() {
	return (
		<svg
			className="mr-2 h-5 w-5 flex-shrink-0 text-gray-500 dark:text-gray-400"
			fill="currentColor"
			viewBox="0 0 20 20"
		>
			<path
				fillRule="evenodd"
				d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
				clipRule="evenodd"
			/>
		</svg>
	);
}
