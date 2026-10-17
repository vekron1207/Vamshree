// Indian mobile numbers: 10 digits starting 6-9, optionally written with a
// +91 / 91 / 0 prefix and spaces or dashes. Stored as "+91XXXXXXXXXX".
export function normalizeIndianPhone(input: string): string | null {
  let digits = input.replace(/[\s().-]/g, "");
  if (!/^\+?\d+$/.test(digits)) return null;
  digits = digits.replace(/^\+/, "");

  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);

  return /^[6-9]\d{9}$/.test(digits) ? `+91${digits}` : null;
}

export function formatIndianPhone(stored: string | null | undefined) {
  if (!stored) return "";
  const m = /^\+91(\d{5})(\d{5})$/.exec(stored);
  return m ? `+91 ${m[1]} ${m[2]}` : stored;
}

// Six digits, never starting with 0
export function isValidPincode(value: string) {
  return /^[1-9]\d{5}$/.test(value.trim());
}

export function looksLikeEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}
