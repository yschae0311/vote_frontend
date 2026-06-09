import { apiFetch } from './client';
import type { CheckResponse, Poll, VoteEntry } from '../types/api';

export function getPoll(pollId: number) {
  return apiFetch<Poll>(`/polls/${pollId}`);
}

export function checkVote(pollId: number, fingerprint: string) {
  return apiFetch<CheckResponse>(
    `/polls/${pollId}/check?fingerprint=${encodeURIComponent(fingerprint)}`,
  );
}

export function submitVote(pollId: number, fingerprint: string, votes: VoteEntry[]) {
  return apiFetch<{ ok: boolean }>(`/polls/${pollId}/vote`, {
    method: 'POST',
    body: JSON.stringify({ fingerprint, votes }),
  });
}
