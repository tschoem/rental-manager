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
      logs: []
    });
  }

  return NextResponse.json({
    stage: progress.stage,
    message: progress.message,
    progress: progress.progress,
    logs: progress.logs ? JSON.parse(progress.logs) : [],
    error: progress.error,
    completed: progress.completed,
  });
}

