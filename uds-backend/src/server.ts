import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { apiRouter } from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

async function bootstrap() {
  console.log('[Bootstrap] Starting UDS backend...');
  await connectDB();
  const app = express();
  // Configure and enable CORS explicitly for preflights (including Authorization header)
  const corsOptions: cors.CorsOptions = {
    origin: true, // reflect request origin; replace with specific URL in production
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Authorization'],
    credentials: false,
    optionsSuccessStatus: 204
  };
  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));
  app.use(express.json()); 
  app.use(morgan('dev'));

  app.get('/health', (_req, res) => res.json({ success: true, message: 'OK' }));
  app.use('/api/v1', apiRouter);
  app.use(errorHandler);

  app.listen(env.PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${env.PORT}`);
  });
}

bootstrap().catch(err => {
  console.error('Failed to start server', err);
  process.exit(1);
});
