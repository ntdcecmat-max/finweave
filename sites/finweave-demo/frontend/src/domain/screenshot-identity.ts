import {fold} from './screenshot-fields.ts';
export const bankIdentity=(bank:string)=>fold(bank).replace(/[^a-z0-9]/g,'');
export function accountCompatible(a:string,b:string):boolean {
 if(!a||!b)return true;
 const left=a.toLowerCase().replace(/[x•]/g,'*'),right=b.toLowerCase().replace(/[x•]/g,'*');
 if(left===right)return true;
 if(!left.includes('*')&&!right.includes('*'))return false;
 const matches=(masked:string,full:string)=>{
  if(!masked.includes('*'))return false;
  if(masked.length===full.length)return [...masked].every((c,n)=>c==='*'||full[n]==='*'||c===full[n]);
  const suffix=masked.match(/\d{3,}$/)?.[0];return /^\*+\d+$/.test(masked)&&!!suffix&&full.endsWith(suffix);
 };
 return matches(left,right)||matches(right,left);
}
