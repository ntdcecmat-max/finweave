import { sign, verify } from 'node:crypto';
import { Journal, canonical, digest } from './local-core.mjs';
// Single synchronous local writer. fsync on a local file is not independent durability.
export class Witness extends Journal {
  constructor(path,producerPublic,witnessPrivate) { super(path); this.producerPublic=producerPublic; this.witnessPrivate=witnessPrivate; this.validateChain(); }
  validateChain() {
    let previous='0'.repeat(64);
    for(const [i,r] of this.rows.entries()) {
      if(r.sequence!==i+1 || r.previousRecordHash!==previous || r.eventDigest!==digest(r.event) || r.recordHash!==digest({environmentId:r.event.environmentId,sequence:r.sequence,previousRecordHash:previous,eventId:r.event.eventId,eventDigest:r.eventDigest}) || !verify(null,Buffer.from(canonical(r.event)),this.producerPublic,Buffer.from(r.producerSignature,'base64url'))) throw Error('CHAIN_CORRUPT');
      previous=r.recordHash;
    }
  }
  appendDeny(event,producerSignature, fault) {
    const allowed=['profile','eventId','environmentId','scopeKind','targetToken','epoch','kind','createdAt','producerKeyId'];
    const kindScopes={identity_revoke:'identity',identity_erase:'identity',workspace_erase:'workspace',device_revoke:'device'};
    if(Object.keys(event).sort().join()!==allowed.sort().join() || event.profile!=='FW-RECOVERY-EVENT-001' || event.environmentId!=='synthetic' || event.producerKeyId!=='producer-fixture' || kindScopes[event.kind]!==event.scopeKind || !Number.isSafeInteger(event.epoch) || event.epoch<1 || !/^[A-Za-z0-9_-]{43}$/.test(event.targetToken) || !/^[A-Za-z0-9_-]{1,80}$/.test(event.eventId) || !Number.isFinite(Date.parse(event.createdAt)) || !verify(null,Buffer.from(canonical(event)),this.producerPublic,producerSignature)) throw Error('INVALID_DENY');
    const existing=this.rows.find(x=>x.event.eventId===event.eventId);
    if(existing) { if(existing.eventDigest!==digest(event)) throw Error('EVENT_CONFLICT'); return this.receipt(existing); }
    if(this.rows.some(x=>x.event.targetToken===event.targetToken && x.event.scopeKind===event.scopeKind && x.event.epoch===event.epoch)) throw Error('EPOCH_CONFLICT');
    const record={event,producerSignature:producerSignature.toString('base64url'),environmentId:event.environmentId,sequence:this.rows.length+1,previousRecordHash:this.rows.at(-1)?.recordHash??'0'.repeat(64),eventId:event.eventId,eventDigest:digest(event)};
    record.recordHash=digest({environmentId:record.environmentId,sequence:record.sequence,previousRecordHash:record.previousRecordHash,eventId:record.eventId,eventDigest:record.eventDigest});
    if(fault==='beforeAppend') throw Error('INJECTED_BEFORE_APPEND');
    this.append(record);
    if(fault==='afterAppend') throw Error('INJECTED_LOST_RECEIPT');
    return this.receipt(record);
  }
  receipt(r) { const body={sequence:r.sequence,recordHash:r.recordHash,eventDigest:r.eventDigest}; return {...body,signature:sign(null,Buffer.from(canonical(body)),this.witnessPrivate).toString('base64url')}; }
  floor(token) { return Math.max(0,...this.rows.filter(x=>x.event.targetToken===token).map(x=>x.event.epoch)); }
  head(nonce, now) { const body={profile:'FW-WITNESS-HEAD-001',environmentId:'synthetic',sequence:this.rows.length,recordHash:this.rows.at(-1)?.recordHash??'0'.repeat(64),challengeNonce:nonce,issuedAt:new Date(now*1000).toISOString(),witnessKeyId:'witness-fixture'}; return {...body,signature:sign(null,Buffer.from(canonical(body)),this.witnessPrivate).toString('base64url')}; }
}
export function verifyHead(head,key,nonce,now,sequence,recordHash) {
  const {signature,...body}=head;
  return body.environmentId==='synthetic' && body.witnessKeyId==='witness-fixture' && body.challengeNonce===nonce && Math.abs(Date.parse(body.issuedAt)/1000-now)<=60 && body.sequence===sequence && body.recordHash===recordHash && verify(null,Buffer.from(canonical(body)),key,Buffer.from(signature,'base64url'));
}
