import crypto from "crypto"

function base64url(input: Buffer | string) {
  const b = Buffer.isBuffer(input) ? input : Buffer.from(input)
  return b.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_")
}

function fromBase64url(input: string) {
  input = input.replace(/-/g, "+").replace(/_/g, "/")
  const pad = 4 - (input.length % 4)
  const padded = pad !== 4 ? input + "=".repeat(pad) : input
  return Buffer.from(padded, "base64")
}

export function signSession(payload: Record<string, any>) {
  const secret = process.env.SESSION_SECRET || ""
  if (!secret) throw new Error("SESSION_SECRET not set")
  const data = base64url(JSON.stringify(payload))
  const sig = base64url(crypto.createHmac("sha256", secret).update(data).digest())
  return `${data}.${sig}`
}

export function verifySession(token: string) {
  const secret = process.env.SESSION_SECRET || ""
  if (!secret) return null
  const parts = token.split(".")
  if (parts.length !== 2) return null
  const [data, sig] = parts
  const expected = base64url(crypto.createHmac("sha256", secret).update(data).digest())
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null
  try {
    const json = fromBase64url(data).toString("utf8")
    return JSON.parse(json)
  } catch {
    return null
  }
}