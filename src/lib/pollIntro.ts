export function pollIntroText(poll: { description?: string | null; subtitle?: string | null }): string {
  return poll.description?.trim() || poll.subtitle?.trim() || '';
}
