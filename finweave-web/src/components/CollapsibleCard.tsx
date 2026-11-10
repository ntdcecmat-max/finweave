import {useId,useState} from 'react';
import type {ReactNode} from 'react';
import {ChevronDown} from 'lucide-react';
import './cashflow.css';

export function CollapsibleCard({title,storageKey,description,actions,children,className=''}:{title:string;storageKey:string;description?:ReactNode;actions?:ReactNode;children:ReactNode;className?:string}){
 const id=useId();
 const [open,setOpen]=useState(()=>sessionStorage.getItem('fw:section:'+storageKey)!=='closed');
 const toggle=()=>setOpen(previous=>{const next=!previous;sessionStorage.setItem('fw:section:'+storageKey,next?'open':'closed');return next;});
 return <section className={`card collapsible-card ${open?'is-open':'is-closed'} ${className}`}>
  <div className="collapsible-head"><h2><button type="button" className="collapsible-toggle" aria-expanded={open} aria-controls={id} title={(open?'Thu gọn ':'Mở rộng ')+title} onClick={toggle}><span className="collapsible-chevron"><ChevronDown size={19} aria-hidden="true"/></span><span>{title}</span></button></h2>{open&&actions&&<div className="collapsible-actions">{actions}</div>}</div>
  <div id={id} className="collapsible-content" hidden={!open}>{open&&<>{description&&<div className="small muted collapsible-description">{description}</div>}{children}</>}</div>
 </section>;
}
