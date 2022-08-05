import * as React from "react";
import type {
	LinksFunction,
	LoaderArgs,
	MetaFunction,
} from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import {
	Link,
	Links,
	LiveReload,
	Meta,
	NavLink,
	Outlet,
	Scripts,
	ScrollRestoration,
	useCatch,
	useLoaderData,
	useMatches,
} from "@remix-run/react";
import cn from "classnames";

import styles from "~/styles/app.css";

export let meta: MetaFunction = () => ({
	charset: "utf-8",
	title: "Remix Chat",
	viewport: "width=device-width,initial-scale=1",
	"color-scheme": "dark light",
});

export let links: LinksFunction = () => [{ rel: "stylesheet", href: styles }];

export async function loader({
	context: { sessionStorage },
	request,
}: LoaderArgs) {
	let session = await sessionStorage.getSession(request.headers.get("Cookie"));
	let user = session.get("user");

	return json({ loggedIn: !!user });
}

export default function App() {
	return (
		<Document>
			<Layout>
				<Outlet />
			</Layout>
		</Document>
	);
}

export function ErrorBoundary({ error }: { error: Error }) {
	console.error(error);
	return (
		<Document title="Error!">
			<Layout>
				<section className="bg-white dark:bg-gray-900">
					<div className="mx-auto max-w-screen-xl py-8 px-4 lg:py-16 lg:px-6">
						<div className="mx-auto max-w-screen-sm text-center">
							<h1 className="text-primary-600 dark:text-primary-500 mb-4 text-7xl font-extrabold tracking-tight lg:text-9xl">
								Oops, something went wrong!
							</h1>
							<p className="mb-4 text-lg font-light text-gray-500 dark:text-gray-400">
								Sorry, something unexpected happened.
							</p>
							<Link
								to="/"
								className="bg-primary-600 hover:bg-primary-800 focus:ring-primary-300 dark:focus:ring-primary-900 my-4 inline-flex rounded-lg px-5 py-2.5 text-center text-sm font-medium text-white focus:outline-none focus:ring-4"
							>
								Back to Homepage
							</Link>
						</div>
					</div>
				</section>
			</Layout>
		</Document>
	);
}

export function CatchBoundary() {
	let caught = useCatch();

	let message;
	switch (caught.status) {
		case 401:
			message =
				"Oops! Looks like you tried to visit a page that you do not have access to.";
			break;
		case 404:
			message =
				"Oops! Looks like you tried to visit a page that does not exist.";
			break;

		default:
			throw new Error(caught.data || caught.statusText);
	}

	return (
		<Document title={`${caught.status} ${caught.statusText}`}>
			<Layout>
				<section className="bg-white dark:bg-gray-900">
					<div className="mx-auto max-w-screen-xl py-8 px-4 lg:py-16 lg:px-6">
						<div className="mx-auto max-w-screen-sm text-center">
							<h1 className="text-primary-600 dark:text-primary-500 mb-4 text-7xl font-extrabold tracking-tight lg:text-9xl">
								{caught.status}: {caught.statusText}
							</h1>
							{message && (
								<p className="mb-4 text-lg font-light text-gray-500 dark:text-gray-400">
									{message}
								</p>
							)}
							<Link
								to="/"
								className="bg-primary-600 hover:bg-primary-800 focus:ring-primary-300 dark:focus:ring-primary-900 my-4 inline-flex rounded-lg px-5 py-2.5 text-center text-sm font-medium text-gray-900 focus:outline-none focus:ring-4 dark:text-white"
							>
								Back to Homepage
							</Link>
						</div>
					</div>
				</section>
			</Layout>
		</Document>
	);
}

function Document({
	children,
	title,
}: {
	children: React.ReactNode;
	title?: string;
}) {
	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width,initial-scale=1" />
				{title ? <title>{title}</title> : null}
				<Meta />
				<Links />
			</head>
			<body>
				{children}
				<ScrollRestoration />
				<Scripts />
				{process.env.NODE_ENV === "development" && <LiveReload />}
			</body>
		</html>
	);
}

function Layout({ children }: { children: React.ReactNode }) {
	const { loggedIn } = useRootLoaderData() || {};
	const [menuOpen, setMenuOpen] = React.useState(false);
	const closeMenu = () => setMenuOpen(false);

	return (
		<>
			<form id="logout-form" method="post" action="/logout" />
			<form id="new-chat-form" method="post" action="/new-chat" />

			<header>
				<nav className="border-gray-200 bg-white px-4 py-2.5 dark:bg-gray-800 lg:px-6">
					<div className="mx-auto flex max-w-screen-xl flex-wrap items-center justify-between">
						<NavLink to="/" className="flex items-center">
							<span className="self-center whitespace-nowrap text-xl font-semibold text-gray-900 dark:text-white">
								Remix Chat
							</span>
						</NavLink>
						<div className="flex w-auto flex-1 items-center justify-end lg:order-2 lg:w-[unset] lg:flex-[unset]">
							{loggedIn ? (
								<>
									<button
										form="new-chat-form"
										className="bg-primary-700 hover:bg-primary-800 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 mr-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium text-gray-900 focus:outline-none focus:ring-4 dark:text-white lg:px-5 lg:py-2.5"
									>
										+ Chat
									</button>
									<button
										form="logout-form"
										className="bg-primary-700 hover:bg-primary-800 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 mr-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium text-gray-900 focus:outline-none focus:ring-4 dark:text-white lg:px-5 lg:py-2.5"
									>
										Logout
									</button>
								</>
							) : (
								<>
									<NavLink
										to="/login"
										className="bg-primary-700 hover:bg-primary-800 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 mr-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium text-gray-900 focus:outline-none focus:ring-4 dark:text-white lg:px-5 lg:py-2.5"
									>
										Log in
									</NavLink>
									<NavLink
										to="/signup"
										className="bg-primary-700 hover:bg-primary-800 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 mr-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium text-gray-900 focus:outline-none focus:ring-4 dark:text-white lg:px-5 lg:py-2.5"
									>
										Get started
									</NavLink>
								</>
							)}
							<button
								type="button"
								className="ml-1 inline-flex items-center rounded-lg p-2 text-sm text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600 lg:hidden"
								aria-controls="mobile-menu"
								aria-expanded={menuOpen ? "true" : "false"}
								onClick={() => setMenuOpen(!menuOpen)}
							>
								<span className="sr-only">Open main menu</span>
								<svg
									className="h-6 w-6"
									fill="currentColor"
									viewBox="0 0 20 20"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path
										fillRule="evenodd"
										d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
										clipRule="evenodd"
									></path>
								</svg>
								<svg
									className="hidden h-6 w-6"
									fill="currentColor"
									viewBox="0 0 20 20"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path
										fillRule="evenodd"
										d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
										clipRule="evenodd"
									></path>
								</svg>
							</button>
						</div>
						<div
							className={cn(
								"w-full items-end justify-between lg:order-1 lg:flex lg:flex-1",
								{ hidden: !menuOpen }
							)}
							id="mobile-menu"
						>
							<ul className="mt-4 flex flex-col font-medium lg:mt-0 lg:flex-1 lg:flex-row lg:justify-end">
								<li>
									<NavLink
										end
										to="/"
										className="bg-primary-700 lg:text-primary-700 bg-primary-700 hover:bg-primary-800 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 mr-2 block whitespace-nowrap rounded-lg px-4 py-2 pr-4 pl-3 text-sm font-medium text-gray-900 focus:outline-none focus:ring-4 dark:text-white lg:bg-transparent lg:p-0 lg:px-5 lg:py-2.5"
										onClick={closeMenu}
									>
										Home
									</NavLink>
								</li>
							</ul>
						</div>
					</div>
				</nav>
			</header>

			{children}
		</>
	);
}

const useRootLoaderReturnType = () => useLoaderData<typeof loader>();
type LoaderData = ReturnType<typeof useRootLoaderReturnType>;
function useRootLoaderData() {
	let rootMatch = useMatches().find((match) => match.id === "root");
	return rootMatch ? (rootMatch.data as LoaderData) : undefined;
}
