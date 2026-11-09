import type { APIRoute } from 'astro';
import { getDb } from '../db/index';

export const GET: APIRoute = async () => {
  try {
    const db = getDb();
    const row = db.prepare('SELECT 1 as healthy').get() as { healthy: number };

    if (row && row.healthy === 1) {
      return new Response(JSON.stringify({ status: 'ok', uptime: process.uptime() }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    throw new Error('Database check returned unexpected result');
  } catch (err: any) {
    return new Response(JSON.stringify({ status: 'unhealthy', error: err.message }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
