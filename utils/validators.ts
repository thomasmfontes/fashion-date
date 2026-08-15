import { cleanPhone } from "./formatters";

export function isValidName(name: string): boolean {
  return name.trim().length >= 3;
}

export function isValidStore(store: string): boolean {
  return store.trim().length >= 2;
}

export function isValidPhone(phone: string): boolean {
  const digits = cleanPhone(phone);
  return digits.length >= 10 && digits.length <= 11;
}

export function isValidInstagram(instagram: string): boolean {
  const cleaned = instagram.replace(/^@/, "").trim();
  return cleaned.length >= 2 && /^[a-zA-Z0-9._]+$/.test(cleaned);
}
