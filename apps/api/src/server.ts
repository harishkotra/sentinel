import './env.js';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import pinoHttp from 'pino-http';
import securityRoutes from './routes/security.js';
import { setupTelemetry } from './otel.js';
import { ensureSchema } from './db.js';

setupTelemetry();

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));
const httpLogger = (pinoHttp as unknown as { default?: () => express.RequestHandler; (): express.RequestHandler }).default ?? (pinoHttp as unknown as () => express.RequestHandler);
app.use(httpLogger());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'sentinel-api' });
});

app.use('/api/security', securityRoutes);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const message = err instanceof Error ? err.message : 'Unknown error';
  res.status(400).json({ error: message });
});

const port = Number(process.env.PORT ?? 8080);

async function start() {
  await ensureSchema();
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Sentinel API listening on :${port}`);
  });
}

start().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start Sentinel API', error);
  process.exit(1);
});
