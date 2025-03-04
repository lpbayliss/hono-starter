import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { compress } from 'hono/compress';
import { logger as honoLogger } from 'hono/logger';
import { poweredBy } from 'hono/powered-by';

import logger from '~/lib/logger.js';
import { health } from '~/routes/index.js';
import env from '~/lib/env.js';
import { auth } from '~/lib/auth.js';
import { trpc } from '~/trpc/index.js';

const app = new Hono();

app.use(poweredBy());
app.use(honoLogger((str, ...rest) => logger.info(str, ...rest)));
app.use(compress());

app.on(['POST', 'GET'], '/api/auth/*', c => {
  return auth.handler(c.req.raw);
});

app.route('/api/health', health);

app.use('/api/trpc/*', trpc);

const startServer = () => {
  serve(
    {
      fetch: app.fetch,
      port: env.PORT,
    },
    info => {
      console.log(`Server is running on http://localhost:${info.port}`);
    },
  );
};

export default app;
export { startServer };
