/**
 * Formats a person's full name with proper Unicode capitalization for each word.
 */
export function formatName(value: string): string {
  return value.replace(
    /(^|[\s\-'"])([\p{L}])/gu,
    (_, sep, char) => `${sep}${char.toUpperCase()}`,
  );
}

/**
 * Formats raw digits into a Brazilian phone mask: (XX) XXXXX-XXXX or (XX) XXXX-XXXX.
 */
export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

/**
 * Strips all non-digit characters from a phone number string.
 */
export function cleanPhone(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Ensures Instagram handles start with a single '@'.
 */
export function formatInstagram(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
}

/**
 * Strips '@' symbol for URL generation.
 */
export function cleanInstagramHandle(value: string): string {
  return value.replace(/^@+/, "").trim();
}

/**
 * Formats a lucky number as a 4-digit zero-padded string (e.g., 7 -> "0007").
 */
export function formatLuckyNumber(
  num: number | string | null | undefined,
  length = 4,
): string {
  if (num === null || num === undefined) return "-".repeat(length);
  return String(num).padStart(length, "0");
}

/**
 * Builds a direct personalized WhatsApp click-to-chat URL.
 */
export function buildWhatsAppUrl(
  phone: string,
  name?: string,
  store?: string,
): string {
  const digits = cleanPhone(phone);
  const text = name
    ? `Olá ${name}${store ? ` (${store})` : ""}, estamos entrando em contato sobre a sua participação no Fashion Date!`
    : "Olá! Entrando em contato sobre o Fashion Date.";
  return `https://wa.me/55${digits}?text=${encodeURIComponent(text)}`;
}

/**
 * Builds an Instagram profile URL.
 */
export function buildInstagramUrl(handle: string): string {
  return `https://instagram.com/${cleanInstagramHandle(handle)}`;
}

/**
 * Formats date/timestamp for Brazilian locale.
 */
export function formatDate(
  date: string | Date | number,
  options?: Intl.DateTimeFormatOptions,
): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  };
  return new Date(date).toLocaleString("pt-BR", options || defaultOptions);
}
