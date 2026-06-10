import type { VoteEntry } from '../types/api';

export type Rank = number;
export type RankSlots = (number | null)[];

export function emptyRankSlots(maxSelections = 3): RankSlots {
  const n = Math.max(1, Math.min(5, maxSelections));
  return Array.from({ length: n }, () => null);
}

export function rankOf(slots: RankSlots, candidateId: number): number {
  const i = slots.indexOf(candidateId);
  return i === -1 ? 0 : i + 1;
}

export function candidateAt(slots: RankSlots, rank: Rank): number | null {
  return slots[rank - 1] ?? null;
}

export function filledCount(slots: RankSlots): number {
  return slots.filter((id) => id != null).length;
}

export function assignToRank(slots: RankSlots, rank: Rank, candidateId: number): RankSlots {
  const next = [...slots];
  for (let i = 0; i < next.length; i += 1) {
    if (next[i] === candidateId) next[i] = null;
  }
  next[rank - 1] = candidateId;
  return next;
}

export function clearCandidate(slots: RankSlots, candidateId: number): RankSlots {
  const next = [...slots];
  const i = next.indexOf(candidateId);
  if (i !== -1) next[i] = null;
  return next;
}

export function clearRank(slots: RankSlots, rank: Rank): RankSlots {
  const next = [...slots];
  next[rank - 1] = null;
  return next;
}

export function slotsFromVotes(votes: VoteEntry[], maxSelections = 3): RankSlots {
  const slots = emptyRankSlots(maxSelections);
  for (const v of votes) {
    if (v.rank >= 1 && v.rank <= slots.length) slots[v.rank - 1] = v.candidate_id;
  }
  return slots;
}

export function slotsToVotes(slots: RankSlots): VoteEntry[] {
  const out: VoteEntry[] = [];
  for (let i = 0; i < slots.length; i += 1) {
    const candidateId = slots[i];
    if (candidateId != null) out.push({ rank: i + 1, candidate_id: candidateId });
  }
  return out;
}

export function rankRangeLabel(max: number): string {
  if (max <= 1) return '1순위';
  return `1~${max}순위`;
}

export function rankNumbers(max: number): number[] {
  return Array.from({ length: Math.max(1, Math.min(5, max)) }, (_, i) => i + 1);
}
