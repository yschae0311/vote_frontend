import type { Candidate } from '../types/api';
import { CandidateMedia } from './CandidateMedia';

interface PlaceholderProps {
  cand: Pick<Candidate, 'name' | 'tint' | 'image_url'>;
  ratio?: string;
  round?: string;
  emojiSize?: number;
  fit?: 'cover' | 'contain';
  className?: string;
}

export function Placeholder(props: PlaceholderProps) {
  return <CandidateMedia {...props} />;
}
