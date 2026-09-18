// Account-free recovery passphrase tokens.
// Format: SOBS-####-X (e.g. SOBS-4821-X). No account, no password — the key
// itself is the credential for editing/renewing a listing.
export function generateKeyToken() {
  const num = Math.floor(1000 + Math.random() * 9000);
  const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
  return `SOBS-${num}-${letter}`;
}

export function tokenFileName(code) {
  const safe = (code || 'key').replace(/[^A-Za-z0-9-]/g, '');
  return `sobskey-${safe}.txt`;
}