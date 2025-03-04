import { initTRPC } from '@trpc/server';
import { z } from 'zod';

const t = initTRPC.create();

const publicProcedure = t.procedure;
const router = t.router;

export const appRouter = router({
  hello: publicProcedure.input(z.string().nullish()).query(({ input }) => {
    return `Hello ${input ?? 'World'}!`;
  }),
  ticker: publicProcedure.subscription(async function* ({ ctx }) {
    while (true) {
      yield { data: 'tick' };
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }),
});

export type AppRouter = typeof appRouter;
