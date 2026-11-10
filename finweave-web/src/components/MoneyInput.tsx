import {useLayoutEffect,useRef,useState} from 'react';
import type {InputHTMLAttributes} from 'react';
import './planning.css';

export const moneyDigits=(value:string)=>value.replace(/\s*VND\s*/gi,'').replace(/[.,\s₫đ]/g,'');
export const groupedMoney=(value:string)=>value.replace(/^0+(?=\d)/,'').replace(/\B(?=(\d{3})+(?!\d))/g,'.');

export function MoneyInput({value,onValueChange,inputRef,...props}:Omit<InputHTMLAttributes<HTMLInputElement>,'value'|'onChange'|'type'>&{value:string;onValueChange:(value:string)=>void;inputRef?:(input:HTMLInputElement|null)=>void}){
 const ref=useRef<HTMLInputElement>(null);
 const [cursor,setCursor]=useState<{digits:number;sequence:number}|null>(null);
 useLayoutEffect(()=>{if(!cursor||!ref.current)return;const input=ref.current;let seen=0,pos=0;for(;pos<input.value.length&&seen<cursor.digits;pos++)if(/\d/.test(input.value[pos]))seen++;input.setSelectionRange(pos,pos);},[value,cursor]);
 return <div className="money-input"><input {...props} ref={node=>{ref.current=node;inputRef?.(node);}} type="text" inputMode="numeric" value={/^\d*$/.test(value)?groupedMoney(value):value} onKeyDown={e=>{
  props.onKeyDown?.(e);if(e.defaultPrevented)return;
  const input=e.currentTarget,pos=input.selectionStart??0;
  if(pos!==input.selectionEnd)return;
  const index=e.key==='Backspace'&&input.value[pos-1]==='.'?pos-2:e.key==='Delete'&&input.value[pos]==='.'?pos+1:-1;
  if(index<0)return;
  e.preventDefault();
  const next=moneyDigits(input.value.slice(0,index)+input.value.slice(index+1)).replace(/^0+(?=\d)/,'');
  setCursor(previous=>({digits:(input.value.slice(0,index).match(/\d/g)||[]).length,sequence:(previous?.sequence??0)+1}));onValueChange(next);
 }} onChange={e=>{
  const raw=moneyDigits(e.target.value);
  if(!/^\d*$/.test(raw))return;
  const before=e.target.value.slice(0,e.target.selectionStart??e.target.value.length);
  setCursor(previous=>({digits:(before.match(/\d/g)||[]).length,sequence:(previous?.sequence??0)+1}));
  onValueChange(raw.replace(/^0+(?=\d)/,''));
 }}/><span className="money-input-unit" aria-hidden="true">VND</span></div>;
}
