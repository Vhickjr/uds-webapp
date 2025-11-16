import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { apiRouter } from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

async function bootstrap() {
  await connectDB();
  const app = express();
  app.use(cors());
  app.use(express.json()); 
  app.use(morgan('dev'));

  app.get('/health', (_req, res) => res.json({ success: true, message: 'OK' }));
  app.use('/api/v1', apiRouter);
  app.use(errorHandler);

  app.listen(env.PORT, () => {
    console.log(`[Server] Listening on port ${env.PORT}`);
  });
}

bootstrap().catch(err => {
  console.error('Failed to start server', err);
  process.exit(1);
});
