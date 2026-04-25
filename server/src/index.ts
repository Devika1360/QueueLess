import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import queueRoutes from './routes/queueRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// All routes are under /api
app.use('/api', queueRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n  🚀  QueueLess API Server running at http://localhost:${PORT}`);
  console.log(`  📦  Connected to MySQL database: ${process.env.MYSQL_DATABASE || 'queueless'}\n`);
});
