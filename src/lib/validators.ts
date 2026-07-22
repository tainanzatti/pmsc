export function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function validateCPF(cpf: string): boolean {
  const clean = cpf.replace(/\D/g, "");
  if (clean.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(clean)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(clean[i]) * (10 - i);
  let rest = (sum * 10) % 11;
  if (rest === 10) rest = 0;
  if (rest !== parseInt(clean[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(clean[i]) * (11 - i);
  rest = (sum * 10) % 11;
  if (rest === 10) rest = 0;
  if (rest !== parseInt(clean[10])) return false;

  return true;
}

export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)$/, "$1-$2");
  }
  return digits
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)$/, "$1-$2");
}

export function validatePhone(phone: string): boolean {
  const clean = phone.replace(/\D/g, "");
  return clean.length === 10 || clean.length === 11;
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePassword(password: string): boolean {
  return password.length >= 6;
}

export function validateBirthDate(dateStr: string): { valid: boolean; error?: string } {
  if (!dateStr) return { valid: false, error: "Data de nascimento é obrigatória." };
  const date = new Date(dateStr + "T00:00:00");
  if (isNaN(date.getTime())) return { valid: false, error: "Data inválida." };
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (date > today) return { valid: false, error: "Data de nascimento não pode ser no futuro." };
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 13);
  if (date > minDate) return { valid: false, error: "Você deve ter pelo menos 13 anos." };
  return { valid: true };
}
