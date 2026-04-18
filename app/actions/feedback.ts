'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function submitFeedback(input: {
  token: string;
  score: number;
  comment?: string;
  category?: string;
}) {
  try {
    const token = (input.token || '').trim();
    if (!token) return { success: false, error: 'invalid_token' };

    const score = Math.round(Number(input.score));
    if (!Number.isFinite(score) || score < 0 || score > 10) {
      return { success: false, error: 'invalid_score' };
    }

    const feedback = await prisma.feedback.findUnique({ where: { token } });
    if (!feedback) return { success: false, error: 'not_found' };
    if (feedback.submittedAt) return { success: false, error: 'already_submitted' };

    await prisma.feedback.update({
      where: { id: feedback.id },
      data: {
        score,
        comment: input.comment?.slice(0, 1000) || null,
        category: input.category?.slice(0, 40) || null,
        submittedAt: new Date(),
      },
    });

    revalidatePath('/[locale]/admin/analytics', 'page');
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'unknown_error';
    return { success: false, error: msg };
  }
}
