import {createContext,useContext} from 'react';import type {ActionSpec} from '../components/ActionForm';
export type Detail={type:'event'|'account'|'holding'|'review'|'formula';id:string};
export const ViewContext=createContext<{openAction:(kind:string,id?:string)=>void;setAction:(spec:ActionSpec)=>void;detail:(d:Detail)=>void;ask:(prompt:string)=>void}>({openAction:()=>{},setAction:()=>{},detail:()=>{},ask:()=>{}});
export const useView=()=>useContext(ViewContext);
