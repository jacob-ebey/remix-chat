import { getAssetFromKV } from "@cloudflare/kv-asset-handler";
import type { Env } from "cloudflare-env";
import type { AppLoadContext } from "@remix-run/cloudflare";
import {
	createRequestHandler,
	createCookieSessionStorage,
} from "@remix-run/cloudflare";
import * as build from "remix-app";
import manifestJSON from "__STATIC_CONTENT_MANIFEST";

export { default as ChatRoomDurableObject } from "chat-room-do";
export { default as RateLimiterDurableObject } from "rate-limiter-do";
export { default as UserDurableObject } from "user-do";

let assetManifest = JSON.parse(manifestJSON);
let handleRemixRequest = createRequestHandler(build, "development");

export default {
	async fetch(
		request: Request,
		env: Env,
		ctx: ExecutionContext
	): Promise<Response> {
		try {
			let url = new URL(request.url);
			let ttl = url.pathname.startsWith("/build/")
				? 60 * 60 * 24 * 365 // 1 year
				: 60 * 5; // 5 minutes
			return await getAssetFromKV(
				{
					request,
					waitUntil(promise) {
						return ctx.waitUntil(promise);
					},
				},
				{
					ASSET_NAMESPACE: env.__STATIC_CONTENT,
					ASSET_MANIFEST: assetManifest,
					cacheControl: {
						browserTTL: ttl,
						edgeTTL: ttl,
					},
				}
			);
		} catch (error) {}

		try {
			let sessionStorage = createCookieSessionStorage({
				cookie: {
					httpOnly: true,
					name: "_session",
					path: "/",
					secrets: [env.SESSION_SECRET],
				},
			});

			let loadContext: AppLoadContext = {
				env,
				sessionStorage,
			};
			return await handleRemixRequest(request, loadContext);
		} catch (error) {
			console.log(error);
			return new Response("An unexpected error occurred", { status: 500 });
		}
	},
};
