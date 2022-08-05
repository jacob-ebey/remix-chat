declare module "__STATIC_CONTENT_MANIFEST" {
	const manifestJSON: string;
	export default manifestJSON;
}

declare var process: {
	env: { NODE_ENV: "development" | "production" };
};
