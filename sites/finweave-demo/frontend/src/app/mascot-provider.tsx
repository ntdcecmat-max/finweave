import {createContext,useCallback,useContext,useEffect,useRef,useState} from 'react';
import type {ReactNode} from 'react';
import {useApp} from './context';
import {useChat} from './chat-provider';
import type {MascotState} from '../components/Mascot';

type Mood={state:MascotState;cycle:number;motion:boolean;play:(state:'wave'|'celebrate')=>void;finish:(cycle:number)=>void;setMotion:(enabled:boolean)=>void};
const MascotContext=createContext<Mood|null>(null);
export function MascotProvider({children}:{children:ReactNode}){
 const chat=useChat();const{generation,location,toast}=useApp();
 const [transient,setTransient]=useState<{state:MascotState;cycle:number}>({state:'idle',cycle:0});
 const [motion,setMotion]=useState(()=>sessionStorage.getItem('fw:mascot-motion')!=='paused');
 const thinking=!!chat.pending,thinkingRef=useRef(thinking);thinkingRef.current=thinking;
 const play=useCallback((state:'wave'|'celebrate')=>{if(!thinkingRef.current)setTransient(previous=>({state,cycle:previous.cycle+1}));},[]);
 const finish=useCallback((cycle:number)=>setTransient(previous=>previous.cycle===cycle?{...previous,state:'idle'}:previous),[]);
 useEffect(()=>{sessionStorage.setItem('fw:mascot-motion',motion?'playing':'paused');},[motion]);
 useEffect(()=>{setTransient(previous=>({state:'idle',cycle:previous.cycle+1}));},[generation,thinking]);
 const wasOpen=useRef(false);const open=chat.panel||location.pathname==='/ai';
 useEffect(()=>{if(open&&!wasOpen.current)play('wave');wasOpen.current=open;},[open,play]);
 const lastSuccess=useRef<string|null>(null);
 useEffect(()=>{if(!thinking&&chat.completedResponseId&&chat.completedResponseId!==lastSuccess.current){lastSuccess.current=chat.completedResponseId;play('celebrate');}},[chat.completedResponseId,thinking,play]);
 useEffect(()=>{if(toast.startsWith('Đã xác nhận thay đổi'))play('celebrate');},[toast,play]);
 // End one-shot states even when motion is disabled, playback fails, or every view is hidden.
 useEffect(()=>{if(transient.state==='idle')return;const timer=setTimeout(()=>finish(transient.cycle),transient.state==='wave'?4500:7000);return()=>clearTimeout(timer);},[transient,finish]);
 return <MascotContext.Provider value={{state:thinking?'thinking':transient.state,cycle:transient.cycle,motion,play,finish,setMotion}}>{children}</MascotContext.Provider>;
}
export function useMascot(){const value=useContext(MascotContext);if(!value)throw Error('MascotProvider is required');return value;}
