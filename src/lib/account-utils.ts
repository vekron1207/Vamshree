export const MIN_PASSWORD = 8;
export const MAX_PASSWORD = 72; // bcrypt ignores everything past 72 bytes

// Only same-site paths: "//evil.com" and "/\evil.com" both escape the site
export function safeNext(raw: FormDataEntryValue | string | null | undefined) {
  const next = String(raw ?? "");
  return next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : "/account";
}

export function passwordProblem(password: string) {
  if (password.length < MIN_PASSWORD) return `Use at least ${MIN_PASSWORD} characters.`;
  if (password.length > MAX_PASSWORD) return `Use ${MAX_PASSWORD} characters or fewer.`;
  if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) return "Include at least one letter and one number.";
  return null;
}
