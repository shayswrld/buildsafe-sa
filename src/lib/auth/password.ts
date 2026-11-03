import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";

/**
 * Password hashing with scrypt (built into Node, no native deps).
 * Stored format: scrypt$N$r$p$<salt b64>$<hash b64>
 * Node runtime only: never import this from middleware (Edge runtime).
 */

const N = 16384;
const R = 8;
const P = 1;
const KEY_LEN = 64;

function scryptAsync(
  password: string,
  salt: Buffer,
  keyLen: number,
  opts: { N: number; r: number; p: number }
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCb(password, salt, keyLen, opts, (err, key) => {
      if (err) reject(err);
      else resolve(key as Buffer);
    });
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, KEY_LEN, { N, r: R, p: P });
  return ["scrypt", N, R, P, salt.toString("base64"), hash.toString("base64")].join("$");
}

export async function verifyPassword(password: string, stored: string | null | undefined): Promise<boolean> {
  if (!stored) return false;
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, n, r, p, saltB64, hashB64] = parts;
  try {
    const salt = Buffer.from(saltB64, "base64");
    const expected = Buffer.from(hashB64, "base64");
    const actual = await scryptAsync(password, salt, expected.length, {
      N: Number(n),
      r: Number(r),
      p: Number(p),
    });
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

/**
 * A fixed, valid hash used to burn equivalent CPU time when the phone number is
 * unknown, so response timing does not reveal which numbers are registered.
 */
export const DUMMY_PASSWORD_HASH =
  "scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA==$" + Buffer.alloc(KEY_LEN).toString("base64");
