import crypto from 'crypto';

function buildDataCheckString(authData: Record<string, string | number>) {
  return Object.keys(authData)
    .filter((k) => k !== 'hash')
    .sort()
    .map((k) => `${k}=${authData[k]}`)
    .join('\n');
}

export function verifyTelegramAuth(authData: Record<string, string | number>, botToken: string): boolean {
  if (!authData || !authData.hash) return false;
  const dataCheckString = buildDataCheckString(authData);
  const secret = crypto.createHash('sha256').update(botToken).digest();
  const hmac = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex');
  return hmac === authData.hash;
}
