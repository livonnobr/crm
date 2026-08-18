import { createHTTPHandler } from "@trpc/server/adapters/standalone";
import type { IncomingMessage, ServerResponse } from "node:http";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createContext({ req, res }: { req: IncomingMessage; res: ServerResponse }): TrpcContext {
  return {
    req: req as TrpcContext["req"],
    res: res as TrpcContext["res"],
    user: null,
  };
}

const handler = createHTTPHandler({
  router: appRouter,
  createContext,
  basePath: "/api/trpc/",
});

export default function trpcHandler(req: IncomingMessage, res: ServerResponse) {
  return handler(req, res);
}
