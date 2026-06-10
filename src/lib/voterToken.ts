const key = (pollId: number) => `voter_token_${pollId}`;
const nameKey = (pollId: number) => `voter_name_${pollId}`;

export function getVoterToken(pollId: number): string | null {
  return sessionStorage.getItem(key(pollId));
}

export function getVoterName(pollId: number): string | null {
  return sessionStorage.getItem(nameKey(pollId));
}

export function setVoterSession(pollId: number, token: string, name: string) {
  sessionStorage.setItem(key(pollId), token);
  sessionStorage.setItem(nameKey(pollId), name);
}

export function clearVoterSession(pollId: number) {
  sessionStorage.removeItem(key(pollId));
  sessionStorage.removeItem(nameKey(pollId));
}
