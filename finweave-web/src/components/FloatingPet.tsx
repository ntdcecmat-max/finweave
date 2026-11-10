import {useEffect,useRef,useState} from 'react';
import type {KeyboardEvent,PointerEvent} from 'react';
import {ChevronDown,MoreHorizontal,Pause,Play,RotateCcw} from 'lucide-react';
import {useChat} from '../app/chat-provider';
import {useMascot} from '../app/mascot-provider';
import {Mascot,useReducedMotion} from './Mascot';

type Position={right:number;bottom:number};
const positionKey='fw:mascot-position';
function defaultPosition():Position{return {right:20,bottom:innerWidth<760?88:24};}
function clampPosition(position:Position):Position{
 const minimumBottom=innerWidth<760?88:12;
 return {right:Math.max(12,Math.min(position.right,innerWidth-136)),bottom:Math.max(minimumBottom,Math.min(position.bottom,Math.max(minimumBottom,innerHeight-176)))};
}
function restorePosition():Position{try{const value=JSON.parse(sessionStorage.getItem(positionKey)||'null');if(Number.isFinite(value?.right)&&Number.isFinite(value?.bottom))return clampPosition(value);}catch{/* Use the default corner for an invalid preference. */}return defaultPosition();}

export function FloatingPet({hidden=false}:{hidden?:boolean}){
 const chat=useChat(),mood=useMascot(),reduced=useReducedMotion();
 const [position,setPosition]=useState(restorePosition),[collapsed,setCollapsed]=useState(()=>sessionStorage.getItem('fw:mascot-collapsed')==='true'),[menu,setMenu]=useState(false),[dragging,setDragging]=useState(false);
 const root=useRef<HTMLElement>(null),suppressClick=useRef(false),drag=useRef<{pointer:number;x:number;y:number;position:Position;moved:boolean}|null>(null);
 const lastHover=useRef(0);
 useEffect(()=>{sessionStorage.setItem(positionKey,JSON.stringify(position));},[position]);
 useEffect(()=>{sessionStorage.setItem('fw:mascot-collapsed',String(collapsed));},[collapsed]);
 useEffect(()=>{const resize=()=>setPosition(previous=>clampPosition(previous));window.addEventListener('resize',resize);return()=>window.removeEventListener('resize',resize);},[]);
 useEffect(()=>{if(hidden)setMenu(false);},[hidden]);
 useEffect(()=>{if(!menu)return;const dismiss=(event:globalThis.PointerEvent)=>{if(!root.current?.contains(event.target as Node))setMenu(false);};document.addEventListener('pointerdown',dismiss);return()=>document.removeEventListener('pointerdown',dismiss);},[menu]);
 const hover=()=>{if(mood.state==='idle'&&Date.now()-lastHover.current>8000){lastHover.current=Date.now();mood.play('celebrate');}};
 const down=(event:PointerEvent<HTMLButtonElement>)=>{if(event.button!==0)return;suppressClick.current=false;drag.current={pointer:event.pointerId,x:event.clientX,y:event.clientY,position,moved:false};event.currentTarget.setPointerCapture(event.pointerId);};
 const move=(event:PointerEvent<HTMLButtonElement>)=>{const start=drag.current;if(!start||start.pointer!==event.pointerId)return;const x=event.clientX-start.x,y=event.clientY-start.y;if(!start.moved&&Math.hypot(x,y)<6)return;start.moved=true;setDragging(true);setMenu(false);setPosition(clampPosition({right:start.position.right-x,bottom:start.position.bottom-y}));};
 const up=(event:PointerEvent<HTMLButtonElement>)=>{if(!drag.current||drag.current.pointer!==event.pointerId)return;suppressClick.current=drag.current.moved;drag.current=null;setDragging(false);if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);};
 const keyboard=(event:KeyboardEvent<HTMLButtonElement>)=>{const distance=event.shiftKey?32:16;const offset:Record<string,Position>={ArrowLeft:{right:distance,bottom:0},ArrowRight:{right:-distance,bottom:0},ArrowUp:{right:0,bottom:distance},ArrowDown:{right:0,bottom:-distance}};if(offset[event.key]){event.preventDefault();setPosition(previous=>clampPosition({right:previous.right+offset[event.key].right,bottom:previous.bottom+offset[event.key].bottom}));}if(event.key==='Escape')setMenu(false);};
 if(hidden)return null;
 if(collapsed)return <aside className="floating-pet is-collapsed" style={position} aria-label="Linh vật Thần tài"><button className="pet-restore" aria-label="Hiện linh vật Thần tài" title="Hiện linh vật Thần tài" onClick={()=>setCollapsed(false)}><Mascot size={40} animated={false}/></button></aside>;
 return <aside ref={root} className={`floating-pet ${dragging?'is-dragging':''}`} style={position} aria-label="Linh vật Thần tài" data-state={mood.state}>
  <div className="pet-controls"><button className="pet-control" aria-label="Thu gọn linh vật" title="Thu gọn linh vật" onClick={()=>setCollapsed(true)}><ChevronDown size={17}/></button><button className="pet-control" aria-label="Tùy chọn linh vật" title="Tùy chọn linh vật" aria-expanded={menu} onClick={()=>setMenu(value=>!value)}><MoreHorizontal size={18}/></button></div>
  {menu&&<div className={`pet-menu ${position.bottom>innerHeight-320?'opens-below':''}`} style={{right:Math.min(0,innerWidth-position.right-236)}} onKeyDown={event=>{if(event.key==='Escape'){setMenu(false);root.current?.querySelector<HTMLButtonElement>('[aria-label="Tùy chọn linh vật"]')?.focus();}}}>
   <strong>Thần tài của bạn</strong><p>Kéo để đổi chỗ · Bấm để trò chuyện</p>
   <button aria-pressed={!mood.motion} onClick={()=>mood.setMotion(!mood.motion)}>{mood.motion?<Pause size={16}/>:<Play size={16}/>} {mood.motion?'Tạm dừng chuyển động':'Bật chuyển động'}</button>
   <button onClick={()=>{setPosition(defaultPosition());setMenu(false);}}><RotateCcw size={16}/>Đưa về góc màn hình</button>
   {reduced&&<p>Đang dùng ảnh tĩnh theo cài đặt giảm chuyển động.</p>}
  </div>}
  <button className="pet-character" aria-label="Trò chuyện với Thần tài" title="Bấm để hỏi · Kéo để di chuyển · Phím mũi tên để đổi vị trí" onPointerEnter={hover} onFocus={hover} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onLostPointerCapture={()=>{drag.current=null;setDragging(false);}} onKeyDown={keyboard} onClick={()=>{if(suppressClick.current){suppressClick.current=false;return;}chat.setPanel(true);}}><Mascot state={mood.state} size={112} animated={mood.motion} cycle={mood.cycle} onEnd={()=>mood.finish(mood.cycle)}/></button>
  <span className="pet-caption">{mood.state==='thinking'?'Đang suy nghĩ…':mood.state==='celebrate'?'Tuyệt vời!':mood.state==='wave'?'Chào bạn nhé!':'Hỏi Thần tài nhé'}</span>
 </aside>;
}

export function ChatMascot({active=true}:{active?:boolean}){
 const mood=useMascot();const hovered=useRef(false);
 return <div className="chat-mascot"><button className="chat-mascot-character" aria-label="Chào Thần tài" onPointerEnter={()=>{if(!hovered.current){hovered.current=true;mood.play('wave');}}} onClick={()=>mood.play('wave')}><Mascot state={mood.state} size={60} animated={mood.motion&&active} cycle={mood.cycle} onEnd={()=>mood.finish(mood.cycle)}/></button><div><strong>Thần tài FinWeave</strong><span>{mood.state==='thinking'?'Mình đang xem dữ liệu của bạn…':mood.state==='celebrate'?'Đã có câu trả lời cho bạn!':mood.state==='wave'?'Chào bạn, mình có thể giúp gì?':'Cùng bạn hiểu rõ hơn về tiền'}</span></div></div>;
}
