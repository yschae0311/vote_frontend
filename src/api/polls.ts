import { apiFetch } from './client';
import type {
  CheckResponse,
  Poll,
  PollPublic,
  PollPublicListItem,
  ResultsOut,
  VerifyVoterResponse,
  VoteEntry,
} from '../types/api';

export function listPublicPolls() {
  return apiFetch<PollPublicListItem[]>('/polls');
}

export function getPoll(pollId: number) {
  return apiFetch<Poll>(`/polls/${pollId}`);
}

export function getPollPublic(pollId: number) {
  return apiFetch<PollPublic>(`/polls/${pollId}/public`);
}

export function getPublicResults(pollId: number) {
  return apiFetch<ResultsOut>(`/polls/${pollId}/results`);
}

export function verifyVoter(
  pollId: number,
  payload: { name?: string; email?: string; phone?: string; pin?: string },
) {
  return apiFetch<VerifyVoterResponse>(`/polls/${pollId}/verify`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function checkVote(pollId: number, fingerprint: string, voterToken?: string | null) {
  const params = new URLSearchParams({ fingerprint });
  if (voterToken) params.set('voter_token', voterToken);
  return apiFetch<CheckResponse>(`/polls/${pollId}/check?${params.toString()}`);
}

export function submitVote(
  pollId: number,
  fingerprint: string,
  votes: VoteEntry[],
  voterToken?: string | null,
) {
  return apiFetch<{ ok: boolean }>(`/polls/${pollId}/vote`, {
    method: 'POST',
    body: JSON.stringify({
      fingerprint,
      votes,
      voter_token: voterToken ?? undefined,
    }),
  });
}
