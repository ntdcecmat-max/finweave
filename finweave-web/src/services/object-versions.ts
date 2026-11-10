import type {Store} from '../domain/model';
import {realCall} from './real-transport';
// Capture authoritative versions at the user's snapshot, never infer version 0.
export async function objectVersions(store:Store){
 const r=await realCall('getOverview',{context:{period:{start:store.tracking,endExclusive:new Date(Date.parse(store.clock.slice(0,10)+'T00:00:00Z')+86400000).toISOString().slice(0,10),timezone:'Asia/Ho_Chi_Minh'},accountIds:[],snapshotVersion:store.version}});
 const refs=r.data.snapshotRefs,allocations=(await Promise.all(store.goals.map(g=>realCall('getGoalProgress',{id:g.id,context:r.data.context})))).flatMap(g=>g.data.allocations);
 return {...Object.fromEntries(r.data.accounts.map((a:any)=>[a.id,a.version])),...refs.holdingVersions,...refs.eventVersions,...refs.planVersions,...refs.goalVersions,...Object.fromEntries(allocations.map((a:any)=>[a.id,a.version]))} as Record<string,number>;
}
