// Mismo criterio que el back: celular de 10 dígitos (con o sin formato o +1) o cuenta CE + dígitos.
export function isValidIdentifier(input: string): boolean {
  const value = input.trim().toUpperCase();

  if (/^CE\s*\d{4,12}$/.test(value)) return true;
  if (/[A-Z]/.test(value)) return false;

  const digits = value.replace(/\D/g, "");
  return digits.length === 10 || (digits.length === 11 && digits.startsWith("1"));
}

// Máscara del celular igual a la del Soft, (###) ###-####, mientras se escribe; una cuenta (empieza con letra) queda como está.
export function formatIdentifierInput(input: string): string {
  if (/^\s*[a-z]/i.test(input)) return input;

  let digits = input.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1);
  digits = digits.slice(0, 10);

  if (digits.length === 0) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}
