import { NextResponse } from 'next/server';
import postgres from 'postgres';

export async function GET() {
  const url = process.env.SUPABASE_DATABASE_URL;

  if (!url) {
    return NextResponse.json({
      status: 'error',
      database: 'not configured',
      message: 'SUPABASE_DATABASE_URL environment variable is missing',
    }, { status: 500 });
  }

  try {
    const sql = postgres(url, { ssl: 'require', max: 1, connect_timeout: 5 });
    const result = await sql`SELECT NOW() AS time`;
    await sql.end();

    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      server_time: result[0].time,
      message: 'Database is connected and responding',
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      database: 'connection failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
