import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';
import { appRouter } from '@/server/root';

const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: async () => {
      const token = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
      });

      return {
        user: token?.sub
          ? {
              id: token.sub,
              email: typeof token.email === 'string' ? token.email : '',
              name: typeof token.name === 'string' ? token.name : undefined,
            }
          : null,
      };
    },
  });

export { handler as GET, handler as POST };
