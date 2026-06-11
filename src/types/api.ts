export interface Candidate {
  id: number;
  name: string;
  team?: string | null;
  tagline?: string | null;
  image_url?: string | null;
  figma_url?: string | null;
  tint: number;
}

export type PollType = 'open' | 'restricted';
export type VerifyField = 'name' | 'email' | 'phone';

export interface PollPublic {
  id: number;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  category: string;
  status: string;
  closes_at?: string | null;
  max_selections: number;
  candidates: Candidate[];
}

export interface Poll {
  id: number;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  category: string;
  status: string;
  closes_at?: string | null;
  eligible_count: number;
  max_selections: number;
  poll_type: PollType;
  verify_fields: VerifyField[];
  candidates: Candidate[];
}

export interface EligibleVoter {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  voted: boolean;
  voted_at?: string | null;
}

export interface VerifyVoterResponse {
  voter_token: string;
  voter_name: string;
  already_voted?: boolean;
}

export interface VoteEntry {
  rank: number;
  candidate_id: number;
}

export interface CheckResponse {
  voted: boolean;
  votes?: VoteEntry[] | null;
}

export interface PollPublicListItem {
  id: number;
  title: string;
  category: string;
  status: string;
  candidates: number;
  max_selections: number;
  poll_type: PollType;
  ballots: number;
  closes_at?: string | null;
  desc?: string | null;
}

export interface PollListItem {
  id: number;
  title: string;
  category: string;
  status: string;
  candidates: number;
  max_selections: number;
  poll_type: PollType;
  ballots: number;
  eligible: number;
  created_at: string;
  closes_at?: string | null;
  desc?: string | null;
}

export interface ResultRow {
  candidate_id: number;
  name: string;
  team?: string | null;
  tagline?: string | null;
  tint: number;
  r1: number;
  r2: number;
  r3: number;
  r4?: number;
  r5?: number;
  score: number;
}

export interface ResultsOut {
  total_ballots: number;
  eligible_count: number;
  participation_rate: number;
  rows: ResultRow[];
}

export interface CandidateDraft {
  name: string;
  team?: string;
  tagline?: string;
}

export interface PollCreatePayload {
  title: string;
  subtitle?: string;
  description?: string;
  category?: string;
  closes_at?: string;
  eligible_count?: number;
  max_selections?: number;
  poll_type?: PollType;
  verify_fields?: VerifyField[];
  candidates: CandidateDraft[];
}

export interface EligibleVoterCreate {
  name?: string;
  email?: string;
  phone?: string;
}
