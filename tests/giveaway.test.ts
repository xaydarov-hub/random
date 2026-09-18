import { describe, expect, it } from 'vitest';
import { DEFAULT_FILTERS, type Participant } from '@/types/giveaway';
import { filterParticipants } from '@/lib/giveaway/filter-participants';
import { hashParticipantPool } from '@/lib/giveaway/hash-participants';
import { selectWinners, selectWinnersWithReserves } from '@/lib/giveaway/random-draw';

function participant(id: string, username: string, extra: Partial<Participant> = {}): Participant {
  return {
    id,
    usernameOriginal: username,
    usernameNormalized: username,
    commentText: 'hello',
    commentId: id,
    commentTimestamp: '2026-01-01T00:00:00.000Z',
    parentCommentId: null,
    profilePictureUrl: null,
    isEligible: true,
    exclusionReason: null,
    isWinner: false,
    metadata: {},
    ...extra,
  };
}

describe('filterParticipants', () => {
  it('keeps unique users and drops replies', () => {
    const result = filterParticipants(
      [
        participant('1', 'ada'),
        participant('2', 'ada', { commentText: 'second' }),
        participant('3', 'bob', { parentCommentId: '1' }),
      ],
      DEFAULT_FILTERS,
      { blacklistedUsernames: new Set(), previousWinnerUsernames: new Set(), followerUsernames: null },
    );
    expect(result.eligible.map((p) => p.usernameNormalized)).toEqual(['ada']);
    expect(result.stats.duplicateUsers).toBe(1);
    expect(result.stats.isReply).toBe(1);
  });
});

describe('hashParticipantPool', () => {
  it('is order-independent for the same ids', () => {
    const a = [participant('b', 'bob'), participant('a', 'ada')];
    const b = [participant('a', 'ada'), participant('b', 'bob')];
    expect(hashParticipantPool(a)).toBe(hashParticipantPool(b));
    expect(hashParticipantPool(a)).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe('selectWinners', () => {
  it('returns the requested unique winners', () => {
    const pool = [participant('1', 'a'), participant('2', 'b'), participant('3', 'c')];
    const winners = selectWinners(pool, 2);
    expect(winners).toHaveLength(2);
    expect(new Set(winners.map((w) => w.id)).size).toBe(2);
    winners.forEach((w) => expect(pool).toContain(w));
  });

  it('selects reserves from the leftover pool', () => {
    const pool = [participant('1', 'a'), participant('2', 'b'), participant('3', 'c')];
    const { mainWinners, reserveWinners } = selectWinnersWithReserves(pool, 1, 1);
    expect(mainWinners).toHaveLength(1);
    expect(reserveWinners).toHaveLength(1);
    expect(mainWinners[0].id).not.toBe(reserveWinners[0].id);
  });
});
