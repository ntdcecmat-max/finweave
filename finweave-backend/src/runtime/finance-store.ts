import type { Tx } from './uow.ts';
import type { Actor } from './identity.ts';
import { token } from './crypto.ts';
import { fail } from './errors.ts';
import { posting,assertBalanced,replayQuantity } from '../engine/posting.ts';
import type { Line } from '../engine/posting.ts';
import { sumMoney,valueHolding } from '../engine/exact.ts';
export async function object(tx:Tx,w:string,table:string,id:string) {
 if(!['accounts','holdings','event_heads','reviews'].includes(table))throw Error('TABLE_PORT');
 const row=await tx.one(`SELECT * FROM fw_finance.${table} WHERE workspace_id=$1 AND id=$2`,[w,id]);if(!row)fail('NOT_FOUND',404);return row;
}
export async function history(tx:Tx,a:Actor,w:string,id:string,version:number,action:string,reason:string|null=null) {
 const p={id:token(),at:new Date(a.now).toISOString(),action,reason,actorId:a.identity.id,version,evidenceIds:[]};
 await tx.query('INSERT INTO fw_finance.history VALUES($1,$2,$3,$4)',[w,p.id,id,p]);
}
export async function histories(tx:Tx,w:string,id:string) {return (await tx.query('SELECT payload FROM fw_finance.history WHERE workspace_id=$1 AND object_id=$2 ORDER BY payload->>\'at\',(payload->>\'version\')::integer,id',[w,id])).rows.map(x=>x.payload);}
export async function eventRevision(tx:Tx,w:string,id:string,version:number,p:any,family=id) {await tx.query('INSERT INTO fw_finance.events VALUES($1,$2,$3,$4,$5)',[w,id,version,family,p]);}
export async function group(tx:Tx,w:string,eventId:string,eventVersion:number,lines:Line[],reversalOf:string|null=null) {
 assertBalanced(lines);const id=token();
 for(const line of lines)if(line.ledger.startsWith('counter:'))await tx.query('INSERT INTO fw_finance.ledger_accounts VALUES($1,$2,NULL,$3) ON CONFLICT DO NOTHING',[w,line.ledger,line.ledger.slice(8)]);
 await tx.query('INSERT INTO fw_finance.entry_groups(workspace_id,id,event_id,event_version,reversal_of) VALUES($1,$2,$3,$4,$5)',[w,id,eventId,eventVersion,reversalOf]);
 for(const [i,line] of lines.entries())await tx.query('INSERT INTO fw_finance.posting_lines VALUES($1,$2,$3,$4,$5,$6)',[w,id,i,line.ledger,line.amount,'VND']);
 await tx.query('UPDATE fw_finance.entry_groups SET sealed=true WHERE workspace_id=$1 AND id=$2',[w,id]);return id;
}
export async function opening(tx:Tx,a:Actor,w:string,id:string,input:any) {
 await tx.query('INSERT INTO fw_finance.ledger_accounts VALUES($1,$2,$3,$4)',[w,'asset:'+id,id,'asset']);
 if(input.opening.value!=='0') {
 const eid=token(),p={kind:'opening',amount:input.opening,date:input.openingDate,accountId:id,description:'Opening declaration',category:'opening',posting:'posted',reference:null};
 await eventRevision(tx,w,eid,0,p);await group(tx,w,eid,0,posting(p));await history(tx,a,w,eid,0,'opening');
 }
 await history(tx,a,w,id,0,'createAccount');
}
export async function balance(tx:Tx,w:string,id:string) {return sumMoney((await tx.query('SELECT l.signed_amount::text AS amount FROM fw_finance.posting_lines l JOIN fw_finance.entry_groups g ON g.workspace_id=l.workspace_id AND g.id=l.group_id WHERE l.workspace_id=$1 AND l.ledger_id=$2 AND g.sealed',[w,'asset:'+id])).rows.map(x=>x.amount));}
export const vnd=(value:string)=>({value,currency:'VND'});
export function metric(value:string|null,now:number,reason='MISSING_PRICE') {return {value:value===null?null:vnd(value),missingReason:value===null?reason:null,classification:value===null?'unknown':'actual',quality:{status:value===null?'unknown':'complete',sourceIds:[] as string[],asOf:new Date(now).toISOString(),reasons:value===null?[reason]:[]},evidenceIds:[]};}
export async function accountProjection(tx:Tx,r:any,now:number) {return {id:r.id,version:r.version,...r.payload,balance:metric(await balance(tx,r.workspace_id,r.id),now),evidenceIds:[]};}
export async function holdingQuantity(tx:Tx,w:string,id:string,cutoff='9999-12-31') {return replayQuantity((await tx.query('SELECT mode,quantity::text FROM fw_finance.holding_movements WHERE workspace_id=$1 AND holding_id=$2 AND business_date<=$3 ORDER BY business_date,sequence_no',[w,id,cutoff])).rows as {mode:string;quantity:string}[]);}
export async function holdingProjection(tx:Tx,r:any,now:number) {
 const {catalogId,profileConfirmedVersion,...p}=r.payload,q=await holdingQuantity(tx,r.workspace_id,r.id);
 const quote=await tx.one('SELECT q.payload FROM fw_finance.quotes q WHERE q.workspace_id=$1 AND q.holding_id=$2 AND (q.payload->>\'at\')::timestamptz<=$3 AND (NOT EXISTS(SELECT 1 FROM fw_async.quote_basis b WHERE b.workspace_id=q.workspace_id AND b.quote_id=q.id) OR EXISTS(SELECT 1 FROM fw_async.quote_basis b WHERE b.workspace_id=q.workspace_id AND b.quote_id=q.id AND b.profile=$4::jsonb)) ORDER BY (q.payload->>\'at\')::timestamptz DESC,(q.payload->>\'fetchedAt\')::timestamptz DESC,q.id DESC LIMIT 1',[r.workspace_id,r.id,new Date(now).toISOString(),Object.fromEntries(Object.entries(r.payload).filter(([key])=>!['name','cost','costDate','costQuantity','quantityDate'].includes(key)))]);
 const x=quote?.payload,result=valueHolding({quantity:q,price:x?.price.value??null,unit:x?.price.per??(p.kind==='gold'?'chi':'share'),currency:x?.price.currency??'VND',fx:x?.fxVndPerUsd??null});
 const valuation=metric(result.known?result.amount:null,now,result.known?'MISSING_PRICE':result.reason==='FX_UNKNOWN'?'MISSING_FX':'MISSING_PRICE');
 if(x&&result.known){valuation.quality.sourceIds=[x.sourceId];if(now-new Date(x.quoteAsOf??x.at).getTime()>36*3600000){valuation.quality.status='stale';valuation.quality.reasons=['STALE_SOURCE'];}}
 return {id:r.id,version:r.version,...p,quantity:{value:q,unit:p.kind==='gold'?'chi':'share'},valuation,evidenceIds:[]};
}
export async function eventProjection(tx:Tx,r:any) {
 const p=r.payload;return {id:r.id,version:r.version,kind:p.kind,amount:p.amount,date:p.date,accountId:p.accountId,toAccountId:p.toAccountId??null,category:p.category,description:p.description,posting:p.posting,reconciliation:p.reconciliation??'clear',reference:p.reference??null,originId:p.originId??null,reversalOf:p.reversalOf??null,holdingId:p.holdingId??null,planLinkId:null,manualCategoryOverride:p.manualCategoryOverride??false,evidenceIds:[],history:await histories(tx,r.workspace_id,r.id)};
}
