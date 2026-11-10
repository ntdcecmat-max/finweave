// SYNTHETIC SPIKE ONLY. Not production authentication, JCS library, Room or age.
import { createHash, createHmac, timingSafeEqual, verify } from 'node:crypto';
import { openSync, writeSync, fsyncSync, closeSync, readFileSync } from 'node:fs';
export const canonical = x => {
  if (x === null || typeof x !== 'object') return JSON.stringify(x);
  if (Array.isArray(x)) return '[' + x.map(canonical).join(',') + ']';
  return '{' + Object.keys(x).sort().map(k => JSON.stringify(k) + ':' + canonical(x[k])).join(',') + '}';
};
export const digest = x => createHash('sha256').update(typeof x === 'string' ? x : canonical(x)).digest('hex');
export const mac = (key, x) => createHmac('sha256', key).update(canonical(x)).digest('base64url');
const equal = (a,b) => typeof a === 'string' && typeof b === 'string' && a.length === b.length && timingSafeEqual(Buffer.from(a),Buffer.from(b));
export function cookieGate(r, session) {
  if (r.bearer || r.origin !== session.origin || r.owner !== session.owner || r.epoch !== session.epoch || r.now >= session.expires) return false;
  return !r.mutation || equal(r.csrfCookie, session.csrf) && equal(r.csrfHeader, session.csrf);
}
export function nativeGate(claims, signature, key, expected, used) {
  const fields = ['revision','purpose','method','path','audience','bodyDigest','credentialDigest','challengeId','challengeNonce','issuedAt','nonce'];
  if (Object.keys(claims).sort().join() !== fields.sort().join() || !/^[A-Za-z0-9_-]{43}$/.test(claims.nonce) || Math.abs(claims.issuedAt-expected.now)>60) return false;
  for (const k of fields.filter(k => !['issuedAt','nonce'].includes(k))) if (claims[k] !== expected[k]) return false;
  if (signature.length !== 64 || used.has(claims.nonce) || !verify('sha256',Buffer.from(canonical(claims)),{key,dsaEncoding:'ieee-p1363'},signature)) return false;
  used.add(claims.nonce); return true;
}
export function serviceGate(claims, signature, cert, registry, expected, used) {
  const p = registry[claims.principalId];
  if (!p || !p.live || cert !== p.cert || Math.abs(claims.timestamp-expected.now)>60 || !p.operations.includes(expected.operation) || claims.path !== expected.path || claims.method !== 'POST' || claims.bodyDigest !== expected.bodyDigest || claims.revision !== expected.revision || !/^[A-Za-z0-9_-]{43}$/.test(claims.nonce)) return false;
  if (Object.keys(claims).sort().join() !== ['revision','principalId','method','path','bodyDigest','timestamp','nonce'].sort().join()) return false;
  if (!expected.leaseLive || expected.workspace !== p.workspace || expected.generation !== p.generation || used.has(claims.nonce) || !equal(signature,mac(p.key,claims))) return false;
  used.add(claims.nonce); return true;
}
export class Journal {
  constructor(path) { this.path=path; this.rows=readFileSync(path,'utf8').split('\n').filter(Boolean).map(JSON.parse); }
  append(row) { const fd=openSync(this.path,'a'); try { writeSync(fd,JSON.stringify(row)+'\n'); fsyncSync(fd); } finally { closeSync(fd); } this.rows.push(row); }
}
export class Outbox extends Journal {
  enqueue(item) { if(this.rows.some(x=>x.type==='item' && x.item.id===item.id)) throw Error('DUPLICATE'); this.append({type:'item',item}); }
  pending(owner, epoch, now) { return this.rows.filter(x=>x.type==='item').map(x=>x.item).filter(x=>x.owner===owner && x.epoch===epoch && now-x.capturedAt<=7*86400 && !this.rows.some(a=>a.type==='ack' && a.id===x.id)); }
  ack(id,owner,epoch) { const item=this.rows.find(x=>x.type==='item' && x.item.id===id)?.item; if(!item || item.owner!==owner || item.epoch!==epoch) throw Error('OWNER_MISMATCH'); if(!this.rows.some(x=>x.type==='ack'&&x.id===id)) this.append({type:'ack',id}); }
}
export function restoreGate(x) {
  return x.capsuleVerified && x.backupVerified && x.hostFenced && x.headVerified && x.chainComplete && x.deniesApplied && x.credentialsInvalidated && x.contactVerified ? 'READY_FOR_SIGNOFF' : 'LOCKED';
}
export function parseNotification(raw, context) {
  if (!context.consent || !context.permission || context.package!=='synthetic.bank' || context.signer!=='fixture-cert-v1' || context.version!==1) return {state:'DISCARD'};
  if (/OTP|ma xac thuc|mã xác thực/iu.test(raw)) return {state:'DISCARD'};
  const m=/^SYNTHETIC (IN|OUT|REFUND|TRANSFER) ([1-9][0-9]*) VND ACC=(A|B) REF=([A-Z0-9]+)$/.exec(raw);
  if (!m || !context.bindings[m[3]]) return {state:'REVIEW',reason:'AMBIGUOUS'};
  return {state:'NORMALIZED',kind:m[1],amount:m[2],currency:'VND',binding:context.bindings[m[3]],reference:m[4],parserVersion:'synthetic-v1'};
}
export function normalizeGold(value, profile) {
  if (!/^[0-9]+(?:\.[0-9]{1,8})?$/.test(value) || profile.currency!=='VND' || !['chi','luong'].includes(profile.unit) || !['buy','sell'].includes(profile.side) || !profile.product || !profile.brand || !profile.purity || !profile.region) throw Error('PROFILE_OR_VALUE');
  if (!['1','1000'].includes(profile.scale)) throw Error('SCALE');
  const [a,b='']=value.split('.'); const n=BigInt(a+b)*BigInt(profile.scale); const d=10n**BigInt(b.length);
  if(n<=0n) throw Error('PRICE'); return {storedNumerator:n,storedDenominator:d,perChiNumerator:n,perChiDenominator:d*(profile.unit==='luong'?10n:1n),profile};
}
export function rightsGate(p, now, purposes) {
  return p.selected && p.evidenceRef && p.validUntil>now && purposes.every(k=>p.rights[k]===true) ? 'AUTHORIZED_FIXTURE' : 'BLOCKED_SOURCE';
}
export function normalizeStock(row, profile, now) {
  if(profile.scale!=='1' || profile.currency!=='VND' || profile.unit!=='share' || profile.basis!=='unadjusted_close' || !profile.catalogueVersion || row.exchange!==profile.exchange || !profile.symbols.includes(row.symbol)) throw Error('SOURCE_BASIS_UNVERIFIED');
  if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(row.asOf) || !Number.isFinite(Date.parse(row.asOf)) || Date.parse(row.asOf)>now*1000 || !row.final) throw Error('SOURCE_TIME_UNKNOWN');
  if(!/^(?:0|[1-9][0-9]{0,17})(?:\.[0-9]{1,8})?$/.test(row.close) || /^0(?:\.0+)?$/.test(row.close)) throw Error('PRICE');
  return {symbol:row.symbol,exchange:row.exchange,price:row.close,quoteAsOf:row.asOf,fetchedAt:new Date(now*1000).toISOString(),currency:'VND',unit:'share',profileVersion:profile.version};
}
export function retryAt({now,attempt,serverRetryAfter,deadline}) {
  if(!Number.isInteger(attempt)||attempt<0||!Number.isFinite(serverRetryAfter)) throw Error('RETRY_INPUT');
  const next=Math.max(now+Math.min(3600,2**Math.min(attempt,12)),serverRetryAfter);
  return next>deadline ? {state:'QUARANTINE',deadline} : {state:'WAIT',next,deadline};
}
// Only the keywords encountered in decision-schemas.json; rejects unknown schema keywords.
// Replace with a pinned Draft2020 validator before production.
export function validate(value, schema, root) {
  if(schema.$ref) return validate(value,schema.$ref.split('/').slice(1).reduce((v,k)=>v[k],root),root);
  const supported=['type','properties','required','additionalProperties','enum','const','oneOf','anyOf','items','minItems','maxItems','uniqueItems','pattern','minLength','maxLength','minimum','maximum','description','format'];
  for(const k of Object.keys(schema)) if(!supported.includes(k)) throw Error('UNSUPPORTED_SCHEMA_KEYWORD:'+k);
  if(schema.oneOf) return schema.oneOf.filter(s=>validate(value,s,root)).length===1;
  if(schema.anyOf && !schema.anyOf.some(s=>validate(value,s,root))) return false;
  if('const' in schema && canonical(value)!==canonical(schema.const)) return false;
  if(schema.enum && !schema.enum.includes(value)) return false;
  if(schema.type) { const types=Array.isArray(schema.type)?schema.type:[schema.type]; if(!types.some(t=> t==='null'?value===null:t==='array'?Array.isArray(value):t==='object'?value!==null&&typeof value==='object'&&!Array.isArray(value):t==='integer'?Number.isSafeInteger(value):typeof value===t)) return false; }
  if(typeof value==='string' && ((schema.pattern&&!new RegExp(schema.pattern).test(value)) || [...value].length<(schema.minLength??0) || [...value].length>(schema.maxLength??Infinity))) return false;
  if(schema.format) {
    if(!['date','date-time'].includes(schema.format)) throw Error('UNSUPPORTED_FORMAT');
    if(typeof value==='string' && schema.format==='date' && (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0,10)!==value)) return false;
    if(typeof value==='string' && schema.format==='date-time' && (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value) || !Number.isFinite(Date.parse(value)))) return false;
  }
  if(typeof value==='number' && (value<(schema.minimum??-Infinity)||value>(schema.maximum??Infinity))) return false;
  if(Array.isArray(value)) { if(value.length<(schema.minItems??0)||value.length>(schema.maxItems??Infinity)||schema.uniqueItems&&new Set(value.map(canonical)).size!==value.length) return false; if(schema.items&&!value.every(v=>validate(v,schema.items,root))) return false; }
  if(value!==null&&typeof value==='object'&&!Array.isArray(value)) { if((schema.required??[]).some(k=>!(k in value))) return false; for(const k of Object.keys(value)) { if(schema.properties?.[k]) { if(!validate(value[k],schema.properties[k],root)) return false; } else if(schema.additionalProperties===false) return false; } }
  return true;
}
