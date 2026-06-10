export type VerifyField = 'name' | 'email' | 'phone';

export const VERIFY_FIELD_OPTIONS: { id: VerifyField; label: string }[] = [
  { id: 'name', label: '이름' },
  { id: 'email', label: '이메일' },
  { id: 'phone', label: '전화번호' },
];

export function parseVerifyFields(raw?: VerifyField[] | string | null): VerifyField[] {
  if (Array.isArray(raw) && raw.length) return raw;
  if (typeof raw === 'string' && raw.trim()) {
    return raw.split(',').map((s) => s.trim()).filter((s): s is VerifyField =>
      s === 'name' || s === 'email' || s === 'phone',
    );
  }
  return ['name', 'email', 'phone'];
}

export function verifyFieldsLabel(fields: VerifyField[]): string {
  return fields
    .map((f) => VERIFY_FIELD_OPTIONS.find((o) => o.id === f)?.label ?? f)
    .join(' · ');
}

export function bulkImportHint(fields: VerifyField[]): string {
  const labels = fields.map((f) => VERIFY_FIELD_OPTIONS.find((o) => o.id === f)?.label ?? f);
  return `한 줄에 ${labels.join(', ')} 형식`;
}
