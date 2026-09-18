import { randomInt } from 'crypto';
import type { Participant } from '@/types/giveaway';

/**
 * Cryptographically secure random winner selection.
 *
 * Uses Node.js crypto.randomInt() — a CSPRNG.
 * NEVER uses Math.random() for production draws.
 *
 * Algorithm: Fisher-Yates partial shuffle (select without replacement).
 */
export const RANDOM_METHOD = 'crypto.randomInt (Node.js CSPRNG)';

/**
 * Selects N winners from an eligible participant pool without replacement.
 * Uses crypto.randomInt() for cryptographically secure randomness.
 *
 * @param pool - Array of eligible participants
 * @param count - Number of winners to select
 * @returns Selected winners in order (position 1, 2, 3...)
 * @throws Error if count > pool.length
 */
export function selectWinners(
  pool: Participant[],
  count: number,
): Participant[] {
  if (!Number.isSafeInteger(count) || count <= 0) {
    throw new Error('Winner count must be greater than 0');
  }
  if (count > pool.length) {
    throw new Error(
      `Cannot select ${count} winners from a pool of ${pool.length} participants`,
    );
  }
  if (pool.length === 0) {
    throw new Error('Participant pool is empty');
  }

  // Create a mutable copy of the pool indices
  const indices = Array.from({ length: pool.length }, (_, i) => i);
  const selectedIndices: number[] = [];

  // Partial Fisher-Yates shuffle — only shuffle the first `count` positions
  for (let i = 0; i < count; i++) {
    const remaining = indices.length - i;
    const randomOffset = randomInt(remaining); // crypto.randomInt
    const j = i + randomOffset;

    // Swap
    const temp = indices[i];
    indices[i] = indices[j];
    indices[j] = temp;

    selectedIndices.push(indices[i]);
  }

  return selectedIndices.map((idx) => pool[idx]);
}

/**
 * Selects both main winners and reserve winners from the pool.
 * Reserve winners are selected from the remaining pool after main winners are removed.
 */
export function selectWinnersWithReserves(
  pool: Participant[],
  winnerCount: number,
  reserveCount: number,
): { mainWinners: Participant[]; reserveWinners: Participant[] } {
  if (!Number.isSafeInteger(winnerCount) || winnerCount < 1 || !Number.isSafeInteger(reserveCount) || reserveCount < 0) throw new Error('Invalid winner counts');
  const totalNeeded = winnerCount + reserveCount;
  if (totalNeeded > pool.length) {
    throw new Error(
      `Cannot select ${totalNeeded} participants (${winnerCount} + ${reserveCount} reserve) from a pool of ${pool.length}`,
    );
  }

  const allSelected = selectWinners(pool, totalNeeded);
  return {
    mainWinners: allSelected.slice(0, winnerCount),
    reserveWinners: allSelected.slice(winnerCount),
  };
}
