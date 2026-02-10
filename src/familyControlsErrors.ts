export function isFamilyControlsPickerCanceled(error: unknown): boolean {
  const anyErr = error as any;
  const message = String(anyErr?.message ?? '');
  const code = String(anyErr?.code ?? '');

  if (/FamilyControls picker was canceled\./i.test(message)) return true;
  if (/PickerCanceled/i.test(code)) return true;
  if (/picker was cancelle?d/i.test(message)) return true;
  return false;
}

