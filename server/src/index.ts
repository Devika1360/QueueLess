import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import queueRoutes from './routes/queueRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

// All API routes under /api
app.use('/api', queueRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve React frontend in production
const distPath = path.join(__dirname, '../../dist');
app.use(express.static(distPath));
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`\n  🚀  QueueLess API Server running at http://localhost:${PORT}`);
  console.log(`  📦  Connected to MySQL database: ${process.env.MYSQL_DATABASE || 'queueless'}\n`);
});
