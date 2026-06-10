export function hasSelectionMismatch(candidateCount: number, maxSelections: number): boolean {
  return maxSelections > candidateCount;
}

export function selectionMismatchMessage(candidateCount: number, maxSelections: number): string {
  return `선택 가능 인원(${maxSelections}명)이 후보 수(${candidateCount}명)보다 많습니다. 투표자는 후보 수만큼만 순위를 채울 수 있어요.`;
}
