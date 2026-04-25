import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../db.js';
import { requireAdmin } from '../middleware/authMiddleware.js';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = Router();

// ═══════════════════════════════════════════════════════════
// AUTH ROUTES
// ═══════════════════════════════════════════════════════════

/** POST /api/auth/register — Customer signup (name, email, password → MySQL) */
router.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: 'Name, email, and password are required' });
      return;
    }

    if (password.length < 4) {
      res.status(400).json({ success: false, message: 'Password must be at least 4 characters' });
      return;
    }

    // Check if email already exists
    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      res.status(409).json({ success: false, message: 'An account with this email already exists' });
      return;
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert into MySQL
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, email, passwordHash, 'customer']
    );

    const user = { id: result.insertId, name, email, role: 'customer' };

    res.json({ success: true, user });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
});

/** POST /api/auth/login — Login (checks admin .env first, then MySQL customers) */
router.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required' });
      return;
    }

    // Check if it's the admin
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@queueless.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    if (email === adminEmail && password === adminPassword) {
      res.json({
        success: true,
        user: { id: 'admin-1', email, name: 'Admin Staff', role: 'admin' },
      });
      return;
    }

    // Check MySQL for customer
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, name, email, password_hash, role FROM users WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    const dbUser = rows[0];

    // Compare hashed password
    const passwordMatch = await bcrypt.compare(password, dbUser.password_hash);

    if (!passwordMatch) {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    // Return user without password hash
    res.json({
      success: true,
      user: { id: dbUser.id, name: dbUser.name, email: dbUser.email, role: dbUser.role },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

// ═══════════════════════════════════════════════════════════
// QUEUE ROUTES
// ═══════════════════════════════════════════════════════════

/** GET /api/queue — Fetch all queue entries + current serving index */
router.get('/queue', async (_req: Request, res: Response) => {
  try {
    const [entries] = await pool.query<RowDataPacket[]>(
      'SELECT id, name, email, joined_at AS joinedAt, created_at AS createdAt FROM queue_entries ORDER BY created_at ASC'
    );

    const [stateRows] = await pool.query<RowDataPacket[]>(
      'SELECT current_serving_index FROM queue_state WHERE id = 1'
    );

    const currentServingIndex = stateRows.length > 0 ? stateRows[0].current_serving_index : 0;

    res.json({ queue: entries, currentServingIndex });
  } catch (err) {
    console.error('Error fetching queue:', err);
    res.status(500).json({ error: 'Failed to fetch queue' });
  }
});

/** POST /api/queue/join — Customer joins the queue */
router.post('/queue/join', async (req: Request, res: Response) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      res.status(400).json({ error: 'Name and email are required' });
      return;
    }

    const joinedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO queue_entries (name, email, joined_at) VALUES (?, ?, ?)',
      [name, email, joinedAt]
    );

    res.json({ id: result.insertId, name, email, joinedAt });
  } catch (err) {
    console.error('Error joining queue:', err);
    res.status(500).json({ error: 'Failed to join queue' });
  }
});

/** POST /api/queue/next — Admin: serve next customer */
router.post('/queue/next', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const [entries] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) AS total FROM queue_entries');
    const total = entries[0].total;

    const [stateRows] = await pool.query<RowDataPacket[]>(
      'SELECT current_serving_index FROM queue_state WHERE id = 1'
    );
    const currentIndex = stateRows[0].current_serving_index;

    if (currentIndex < total - 1) {
      await pool.query('UPDATE queue_state SET current_serving_index = current_serving_index + 1 WHERE id = 1');
      res.json({ currentServingIndex: currentIndex + 1 });
    } else {
      res.json({ currentServingIndex: currentIndex, message: 'No more customers' });
    }
  } catch (err) {
    console.error('Error advancing queue:', err);
    res.status(500).json({ error: 'Failed to advance queue' });
  }
});

/** POST /api/queue/skip — Admin: skip current customer */
router.post('/queue/skip', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const [entries] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) AS total FROM queue_entries');
    const total = entries[0].total;

    const [stateRows] = await pool.query<RowDataPacket[]>(
      'SELECT current_serving_index FROM queue_state WHERE id = 1'
    );
    const currentIndex = stateRows[0].current_serving_index;

    if (currentIndex < total - 1) {
      await pool.query('UPDATE queue_state SET current_serving_index = current_serving_index + 1 WHERE id = 1');
      res.json({ currentServingIndex: currentIndex + 1 });
    } else {
      res.json({ currentServingIndex: currentIndex, message: 'No more customers' });
    }
  } catch (err) {
    console.error('Error skipping customer:', err);
    res.status(500).json({ error: 'Failed to skip customer' });
  }
});

/** POST /api/queue/reset — Admin: clear queue and reset index */
router.post('/queue/reset', requireAdmin, async (_req: Request, res: Response) => {
  try {
    await pool.query('DELETE FROM queue_entries');
    await pool.query('UPDATE queue_state SET current_serving_index = 0 WHERE id = 1');
    res.json({ message: 'Queue reset successfully' });
  } catch (err) {
    console.error('Error resetting queue:', err);
    res.status(500).json({ error: 'Failed to reset queue' });
  }
});

export default router;
