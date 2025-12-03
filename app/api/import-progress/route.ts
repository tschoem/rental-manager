import { NextRequest, NextResponse } from 'next/server';
import { getImportProgress } from '@/lib/import-progress';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const propertyId = searchParams.get('propertyId');

  if (!propertyId) {
    return NextResponse.json({ error: 'propertyId is required' }, { status: 400 });
  }

  const progress = await getImportProgress(propertyId);

  if (!progress) {
    return NextResponse.json({
      stage: 'idle',
      message: 'No active import',
      progress: 0,
      logs: [],
      completed: false,
      error: null
    });
  }

  let logs = [];
  try {
    logs = progress.logs ? JSON.parse(progress.logs) : [];
  } catch (e) {
    console.error('[PROGRESS API] Failed to parse logs:', e);
    logs = [];
  }

  return NextResponse.json({
    stage: progress.stage || 'idle',
    message: progress.message || 'Processing...',
    progress: progress.progress || 0,
    logs: logs,
    error: progress.error || null,
    completed: progress.completed || false,
  });
}

