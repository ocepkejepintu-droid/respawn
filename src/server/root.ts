import { apifyRouter } from './routers/apify';
import { audienceRouter } from './routers/audience';
import { billingRouter } from './routers/billing';
import { briefingRouter } from './routers/briefing';
import { competitorsRouter } from './routers/competitors';
import { optimizeRouter } from './routers/optimize';
import { createTRPCRouter } from './trpc';

export const appRouter = createTRPCRouter({
  apify: apifyRouter,
  briefing: briefingRouter,
  competitors: competitorsRouter,
  optimize: optimizeRouter,
  audience: audienceRouter,
  billing: billingRouter,
});

export type AppRouter = typeof appRouter;
