import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { ensureWorkspaceForSupabaseToken, getWorkspaceSnapshot, syncService, syncWorkspaceSnapshot } from "./supabase";
import { z } from "zod";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  workspace: router({
    bootstrap: publicProcedure.query(({ ctx }) => ensureWorkspaceForSupabaseToken(ctx.req.headers.authorization)),
    snapshot: publicProcedure.query(async ({ ctx }) => {
      const workspace = await ensureWorkspaceForSupabaseToken(ctx.req.headers.authorization);
      return { ...workspace, snapshot: await getWorkspaceSnapshot(workspace.workspaceId) };
    }),
    sync: publicProcedure.input(z.object({ state: z.any() })).mutation(async ({ ctx, input }) => {
      const workspace = await ensureWorkspaceForSupabaseToken(ctx.req.headers.authorization);
      return syncWorkspaceSnapshot(workspace.workspaceId, input.state);
    }),
    syncService: publicProcedure.input(z.object({ service: z.any() })).mutation(async ({ ctx, input }) => {
      const workspace = await ensureWorkspaceForSupabaseToken(ctx.req.headers.authorization);
      return syncService(workspace.workspaceId, input.service);
    }),
  }),

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
