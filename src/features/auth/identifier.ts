// Mismo criterio que el back: celular de 10 dígitos (con o sin formato o +1) o cuenta CE + dígitos.
export function isValidIdentifier(input: string): boolean {
  const value = input.trim().toUpperCase();

  if (/^CE\s*\d{4,12}$/.test(value)) return true;
  if (/[A-Z]/.test(value)) return false;

  const digits = value.replace(/\D/g, "");
  return digits.length === 10 || (digits.length === 11 && digits.startsWith("1"));
}
