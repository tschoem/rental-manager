import { prisma } from '@/lib/prisma';

export async function updateImportProgress(
  propertyId: string,
  stage: string,
  message: string,
  progress: number,
  logMessage?: string,
  error?: string
) {
  try {
    // Get or create progress record
    const existing = await prisma.importProgress.findFirst({
      where: { propertyId, completed: false },
      orderBy: { createdAt: 'desc' },
    });

    const logs = existing?.logs ? JSON.parse(existing.logs) : [];
    if (logMessage) {
      logs.push({ timestamp: new Date().toISOString(), message: logMessage });
      // Keep only last 50 log messages
      if (logs.length > 50) {
        logs.shift();
      }
    }

    if (existing) {
      await prisma.importProgress.update({
        where: { id: existing.id },
        data: {
          stage,
          message,
          progress,
          logs: JSON.stringify(logs),
          error: error || null,
          completed: error ? true : false,
        },
      });
      return existing.id;
    } else {
      const newProgress = await prisma.importProgress.create({
        data: {
          propertyId,
          stage,
          message,
          progress,
          logs: JSON.stringify(logs),
          error: error || null,
        },
      });
      return newProgress.id;
    }
  } catch (error) {
    console.error('[PROGRESS] Failed to update progress:', error);
    // Don't throw - progress tracking is non-critical
    return null;
  }
}

export async function getImportProgress(propertyId: string) {
  try {
    const progress = await prisma.importProgress.findFirst({
      where: { propertyId, completed: false },
      orderBy: { createdAt: 'desc' },
    });
    return progress;
  } catch (error) {
    console.error('[PROGRESS] Failed to get progress:', error);
    return null;
  }
}

export async function markImportComplete(propertyId: string) {
  try {
    await prisma.importProgress.updateMany({
      where: { propertyId, completed: false },
      data: { completed: true, progress: 100 },
    });
  } catch (error) {
    console.error('[PROGRESS] Failed to mark complete:', error);
  }
}

