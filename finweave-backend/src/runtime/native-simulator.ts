import { readFile,writeFile,rename,mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { token,seal,open,jcs } from './crypto.ts';
import { itemDigest,safeItem } from './sources.ts';
import { validator } from './contracts.ts';
// Local native transport emulator: encrypted durable normalized outbox, not an Android collector.
export class NativeOutboxSimulator {
 private path:string;private key:Buffer;private authority:{workspaceId:string;deviceId:string;deviceEpoch:number};private serial=Promise.resolve();
 constructor(path:string,key:Buffer,authority:{workspaceId:string;deviceId:string;deviceEpoch:number}) {this.path=path;this.key=key;this.authority=authority;}
 private async read():Promise<{pending:any[];acked:any[]}> {try{return open(this.key,await readFile(this.path,'utf8'),jcs(this.authority));}catch(e){if((e as any).code==='ENOENT')return {pending:[],acked:[]};throw e;}}
 private async write(state:any) {await mkdir(dirname(this.path),{recursive:true});const tmp=this.path+'.'+token()+'.tmp';await writeFile(tmp,seal(this.key,state,jcs(this.authority)),{flag:'wx',flush:true});await rename(tmp,this.path);}
 private async lock<T>(work:()=>Promise<T>) {const previous=this.serial;let release!:()=>void;this.serial=new Promise(r=>{release=r;});await previous;try{return await work();}finally{release();}}
 async capture(item:any) {return this.lock(async()=>{const s=await this.read(),copy=structuredClone({...item,payloadDigest:itemDigest(item)});const req=this.envelope([copy],0);
 if(!validator('ingestNotificationsRequest')(req)||!safeItem(copy,Date.now()))throw Error('NATIVE_CONTRACT_INVALID');
 if(s.pending.some(x=>x.eventKey===copy.eventKey&&x.revision===copy.revision))throw Error('IMMUTABLE_IDENTITY');
 if(s.pending.length>=1000||Buffer.byteLength(jcs(s.pending))+Buffer.byteLength(jcs(copy))>8*1024*1024)throw Error('CAPTURE_GAP_OUTBOX_FULL');
 s.pending.push(copy);await this.write(s);});}
 private envelope(items:any[],recoveryEpoch:number):any {return {contractVersion:'2.0.0',requestId:token(),operationId:'ingestNotifications',workspaceId:this.authority.workspaceId,input:{deviceId:this.authority.deviceId,deviceEpoch:this.authority.deviceEpoch,recoveryEpoch,items},mutation:{idempotencyKey:token(),expectedWorkspaceVersion:0,expectedObjectVersions:{},previewToken:null}};}
 async batch(recoveryEpoch:number) {return this.lock(async()=>{const s=await this.read();let selected:any[]=[];for(const x of s.pending.slice(0,50)) {
 if(Date.parse(x.observedAt)<=Date.now()-7*86400000)throw Error('EXPIRED_ITEM_QUARANTINE_REQUIRED');
 const next=this.envelope([...selected,x],recoveryEpoch);if(Buffer.byteLength(jcs(next))>250*1024){if(!selected.length)throw Error('OVERSIZED_ITEM_QUARANTINE_REQUIRED');break;}selected.push(x);
 }return selected.length?this.envelope(selected,recoveryEpoch):null;});}
 async acknowledge(sent:any,response:any) {return this.lock(async()=>{
 const valid=validator('ingestNotificationsReply')(response);const wire:any=response;
 if(!valid||wire.requestId!==sent.requestId||wire.data.receipts.length!==sent.input.items.length)throw Error('ACK_PROTOCOL_ERROR');
 const acks=new Map<string,any>();for(const a of wire.data.receipts) {const id=a.eventKey+':'+a.revision;if(acks.has(id))throw Error('ACK_PROTOCOL_ERROR');acks.set(id,a);}
 const state=await this.read();for(const item of sent.input.items) {
 const ack=acks.get(item.eventKey+':'+item.revision);if(!ack)throw Error('ACK_PROTOCOL_ERROR');
 const current=state.pending.find(x=>x.eventKey===item.eventKey&&x.revision===item.revision);if(current&&current.payloadDigest!==item.payloadDigest)throw Error('IMMUTABLE_IDENTITY');
 }
 for(const item of sent.input.items)if(acks.get(item.eventKey+':'+item.revision).state==='durable') {state.pending=state.pending.filter(x=>!(x.eventKey===item.eventKey&&x.revision===item.revision&&x.payloadDigest===item.payloadDigest));state.acked.push({item,ack:acks.get(item.eventKey+':'+item.revision),at:Date.now()});}
 state.acked=state.acked.filter(x=>x.at>Date.now()-7*86400000).slice(-1000);while(Buffer.byteLength(jcs(state.acked))>8*1024*1024)state.acked.shift();await this.write(state);
 });}
 async counts() {const s=await this.read();return {pending:s.pending.length,acked:s.acked.length};}
}
