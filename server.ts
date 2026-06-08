import express from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import pg from 'pg';

dotenv.config();

const { Pool } = pg;
let dbPool: pg.Pool | null = null;
let dbHealthy = false;

// Lazy initialization of PG pool to prevent startup crashes if URL is missing or incorrect
function getDbPool() {
  if (dbPool) return dbPool;
  
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.log("No DATABASE_URL set in environment. Running in offline/localStorage-only fallback mode.");
    return null;
  }
  
  try {
    dbPool = new Pool({
      connectionString: dbUrl,
      connectionTimeoutMillis: 5000,
      ssl: {
        rejectUnauthorized: false // Required for secure server connections with Supabase
      }
    });
    
    // Bind global error logs to prevent server crashes on pool connection drops
    dbPool.on('error', (err) => {
      console.error('Unexpected error on idle database client:', err);
    });
    
    return dbPool;
  } catch (err) {
    console.error("Failed to establish PostgreSQL connection pool:", err);
    return null;
  }
}

// Automatically compile table schema structure
async function ensureDbTable(): Promise<boolean> {
  const pool = getDbPool();
  if (!pool) return false;
  
  try {
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS curaflow_state (
          key VARCHAR(255) PRIMARY KEY,
          val JSONB NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      dbHealthy = true;
      return true;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Failed to connect or create schema in PostgreSQL database:", err);
    dbHealthy = false;
    return false;
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // Diagnostic Endpoint to test physical Supabase connection speed
  app.get('/api/sync/diagnostic', async (req, res) => {
    const pool = getDbPool();
    if (!pool) {
      return res.json({ 
        connected: false, 
        message: 'No DATABASE_URL environment parameter defined on this instance.' 
      });
    }
    
    const start = Date.now();
    try {
      const client = await pool.connect();
      try {
        const queryRes = await client.query('SELECT NOW() as db_time');
        const latency = Date.now() - start;
        return res.json({
          connected: true,
          latencyMs: latency,
          dbTime: queryRes.rows[0].db_time,
          dbUrlMasked: process.env.DATABASE_URL?.replace(/:([^:@]+)@/, ':******@'),
          message: 'Secure Postgres socket handshake verified successfully with Supabase!'
        });
      } finally {
        client.release();
      }
    } catch (err: any) {
      return res.json({
        connected: false,
        latencyMs: Date.now() - start,
        error: err.message || 'Database connection error'
      });
    }
  });

  // Fetch fully qualified synchronized data sets
  app.get('/api/sync/load', async (req, res) => {
    const pool = getDbPool();
    if (!pool) {
      return res.json({ status: 'offline', data: {} });
    }
    
    try {
      const isOk = await ensureDbTable();
      if (!isOk) {
        return res.json({ status: 'offline', data: {}, message: 'Schema creation failed' });
      }
      
      const result = await pool.query('SELECT key, val FROM curaflow_state');
      const data: Record<string, any> = {};
      result.rows.forEach(row => {
        data[row.key] = row.val;
      });
      
      return res.json({ status: 'synced', data });
    } catch (err: any) {
      console.error('Error in /api/sync/load:', err);
      return res.json({ status: 'offline', data: {}, error: err.message });
    }
  });

  // Upsert updated data structures
  app.post('/api/sync/save', async (req, res) => {
    const pool = getDbPool();
    if (!pool) {
      return res.status(503).json({ error: 'Database service offline' });
    }
    
    try {
      const isOk = await ensureDbTable();
      if (!isOk) {
        return res.status(503).json({ error: 'Database connection or schema unavailable' });
      }
      
      const { key, val } = req.body;
      if (!key) {
        return res.status(400).json({ error: 'Missing mandatory key for states sync' });
      }
      
      await pool.query(
        `INSERT INTO curaflow_state (key, val, updated_at)
         VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (key) DO UPDATE
         SET val = EXCLUDED.val, updated_at = CURRENT_TIMESTAMP`,
        [key, JSON.stringify(val)]
      );
      
      return res.json({ success: true, key });
    } catch (err: any) {
      console.error(`Error saving key ${req.body?.key} to database:`, err);
      return res.status(500).json({ error: err.message || 'Storage save failed' });
    }
  });

  // API route for live production Gemini queries
  app.post('/api/gemini/chat', async (req, res) => {
    try {
      const { message, history, roleContext } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      
      if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server secrets.' });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      // Format history
      const formattedHistory = (history || []).map((msg: any) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      const systemText = `You are Cura AI, an intelligent, empathetic, and clinical-grade health dashboard assistant.
Current role of user interacting with you: ${roleContext || 'Patient'}.
Guidelines to follow:
1. Provide accurate, encouraging, and informative feedback.
2. For patients, explain medical concepts (like BMI, blood glucose levels, blood pressure trends) in simple, accessible language. Suggest natural wellness tips (sleep, hydration, light exercises). Always include a humble reminder to consult their healthcare provider for acute medical decisions.
3. For providers/doctors, assist in interpreting patient historical tracking trends, offer relevant formatting, or give administrative navigation tips with a clinical tone.
4. For admins, describe system telemetry, configuration ideas, or analytical metrics (user engagement rate, platform retention).
5. Always respond using standard Markdown with beautiful spacing, elegant lists, and subtle highlights. Avoid overwhelming walls of text. Move step-by-step. Keep responses concise and focused.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: [
          { role: 'user', parts: [{ text: systemText }] },
          ...formattedHistory,
          { role: 'user', parts: [{ text: message }] }
        ]
      });

      const textContent = response.text || "I apologize, I could not synthesize a health analysis. Please try rephrasing your wellness question.";
      // Return both text and reply to guarantee compatibility with any client interface
      res.json({ text: textContent, reply: textContent });
    } catch (error: any) {
      console.error('Production Gemini Error:', error);
      res.status(500).json({ error: error.message || 'An error occurred querying Gemini AI.' });
    }
  });

  // Integrate Vite Dev Server in middleware mode, otherwise use static serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
