import { randomBytes, createHmac, createHash, createCipheriv, createDecipheriv, createPublicKey, verify as verifySignature, timingSafeEqual } from 'node:crypto';
import { hash, verify } from '@node-rs/argon2';
import canonicalize from 'canonicalize';
import { fail } from './errors.ts';
export const token = () => randomBytes(32).toString('base64url');
export const jcs = (value: unknown): string => { const s = canonicalize(value); if (!s) throw Error('CANONICALIZATION_FAILED'); return s; };
export const sha = (value: string|Buffer) => createHash('sha256').update(value).digest('hex');
export const digest = (key: Buffer, purpose: string, value: string) => createHmac('sha256', key).update(purpose+'\0'+value).digest('hex');
export const equal = (a: string, b: string) => { const x=Buffer.from(a), y=Buffer.from(b); return x.length === y.length && timingSafeEqual(x,y); };
export function seal(key: Buffer, value: unknown, aad: string): string {
  const nonce=randomBytes(12), c=createCipheriv('aes-256-gcm',key,nonce); c.setAAD(Buffer.from(aad));
  const bytes=Buffer.concat([c.update(jcs(value),'utf8'),c.final()]);
  return Buffer.concat([nonce,c.getAuthTag(),bytes]).toString('base64url');
}
export function open<T>(key: Buffer, value: string, aad: string): T {
  const b=Buffer.from(value,'base64url'), c=createDecipheriv('aes-256-gcm',key,b.subarray(0,12));
  c.setAAD(Buffer.from(aad)); c.setAuthTag(b.subarray(12,28));
  return JSON.parse(Buffer.concat([c.update(b.subarray(28)),c.final()]).toString());
}
let active=0; const queue: (()=>void)[]=[];
async function bounded<T>(work: ()=>Promise<T>): Promise<T> {
  if (active>=2) { if(queue.length>=16) fail('RATE_LIMITED',429); await new Promise<void>(r=>queue.push(r)); }
  else active++;
  try { return await work(); } finally { const next=queue.shift(); if(next) next(); else active--; }
}
export function password(value: string): string {
  const normalized=value.normalize('NFC');
  if ([...normalized].length<15 || [...normalized].length>128 || Buffer.byteLength(normalized)>1024 || ['passwordpassword','123456789012345'].includes(normalized.toLowerCase())) fail('PASSWORD_POLICY');
  return normalized;
}
export const hashPassword = (value: string) => bounded(()=>hash(password(value), { algorithm: 2, memoryCost:65536, timeCost:3, parallelism:4, outputLen:32, salt: randomBytes(16) }));
export const checkPassword = (phc: string, value: string) => bounded(()=>verify(phc,password(value)));
export function publicKey(wire: string) {
  try {
    if (!/^[A-Za-z0-9_-]+$/.test(wire)) throw Error();
    const der=Buffer.from(wire,'base64url'), key=createPublicKey({key:der,format:'der',type:'spki'});
    if(der.toString('base64url')!==wire)throw Error();
    if (key.asymmetricKeyType!=='ec' || key.asymmetricKeyDetails?.namedCurve!=='prime256v1' || !key.export({format:'der',type:'spki'}).equals(der)) throw Error();
    return key;
  } catch { fail('BAD_REQUEST'); }
}
export function signature(key: string, claims: unknown, wire: string) {
  if (!/^[A-Za-z0-9_-]{86}$/.test(wire) || Buffer.from(wire,'base64url').toString('base64url')!==wire || !verifySignature('sha256',Buffer.from(jcs(claims)),{key:publicKey(key),dsaEncoding:'ieee-p1363'},Buffer.from(wire,'base64url'))) fail('FORBIDDEN',403);
}
export function totp(seed: Buffer, step: number): string {
  const b=Buffer.alloc(8); b.writeBigUInt64BE(BigInt(step)); const h=createHmac('sha1',seed).update(b).digest(), o=h[19]!&15;
  return String((h.readUInt32BE(o)&0x7fffffff)%1000000).padStart(6,'0');
}
