#!/usr/bin/env node
import { randomBytes } from "node:crypto";

const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function toBase32(bytes) {
  let bits = 0;
  let value = 0;
  let output = "";

  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32[(value << (5 - bits)) & 31];
  }

  return output;
}

const email = process.argv[2] ?? "admin@studioos.test";
const secret = toBase32(randomBytes(20));
const issuer = "StudioOS Admin";
const label = encodeURIComponent(`${issuer}:${email}`);
const params = new URLSearchParams({
  secret,
  issuer,
  algorithm: "SHA1",
  digits: "6",
  period: "30"
});

console.log("Add to Vercel / .env:\n");
console.log(`ADMIN_LOGIN_EMAIL=${email}`);
console.log(`ADMIN_TOTP_SECRET=${secret}\n`);
console.log("Google Authenticator setup URI:\n");
console.log(`otpauth://totp/${label}?${params.toString()}\n`);
console.log("Scan the URI with Google Authenticator (or paste into a QR generator).");
