/**
 * tRPC Configuration
 * 
 * This is a placeholder implementation. Replace with your actual tRPC setup.
 * The router expects:
 * - createTRPCRouter: Factory for creating routers
 * - protectedProcedure: Procedure that requires authentication
 * - publicProcedure: Procedure that doesn't require authentication
 */

import { initTRPC, TRPCError } from '@trpc/server';
import { z } from 'zod';

// ============================================================================
// Context
// ============================================================================

export interface Context {
  user: {
    id: string;
    email: string;
    name?: string;
  } | null;
}

// ============================================================================
// Initialization
// ============================================================================

const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof z.ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

// ============================================================================
// Routers & Procedures
// ============================================================================

export const createTRPCRouter = t.router;
export const mergeRouters = t.mergeRouters;

// Middleware
const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

// Procedures
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(isAuthed);
