// https://github.com/oven-sh/bun/issues/6738#issuecomment-2124871365

import { resolve } from "node:path";
import type { ServerBuild } from "@remix-run/server-runtime";
import { createRequestHandler } from "@remix-run/server-runtime";
import type { Serve } from "bun";

// in test mode this may not exist yet and tsc complains
//eslint-disable-next-line
//@ts-ignore
const build = await import("./build/server/index.js");

const remix = createRequestHandler(
	build as unknown as ServerBuild,
	Bun.env.NODE_ENV,
);

export default {
	port: Bun.env.PORT || 3000,
	async fetch(request) {
		const { pathname } = new URL(request.url);

		// TODO: infer somehow so this list doesn't need to be maintained
		if (
			pathname.startsWith("/assets") ||
			pathname.startsWith("/static-assets") ||
			pathname === "/app.webmanifest" ||
			pathname === "/favicon.ico" ||
			pathname === "/robots.txt" ||
			pathname === "/sw.js"
		) {
			const file = Bun.file(
				resolve(__dirname, "./build/client/", `.${pathname}`),
			);
			if (await file.exists())
				return new Response(file, {
					headers: new Headers([["Cache-Control", "public, max-age=31536000"]]),
				});
		}

		// Only if a file its not a static file we will send it to remix
		return remix(request);
	},
} satisfies Serve;
