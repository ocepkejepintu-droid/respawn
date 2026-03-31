import { httpBatchLink } from '@trpc/client';
import { appRouter } from '@/server/root';

// This is a server-side caller for tRPC
// In production, you'd want to properly set up the context
export const serverCaller = appRouter.createCaller({
  user: null, // In production, get from session
});
