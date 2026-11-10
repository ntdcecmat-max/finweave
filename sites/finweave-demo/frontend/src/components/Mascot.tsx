import {useEffect,useRef,useState} from 'react';
import type {CSSProperties} from 'react';
import './mascot.css';

export type MascotState='idle'|'thinking'|'wave'|'celebrate';
const rates:Record<MascotState,number>={idle:.75,thinking:.85,wave:1.4,celebrate:1.25};
const oneShotEnds:Partial<Record<MascotState,number>>={wave:5.6,celebrate:8};

export function useReducedMotion(){
 const [reduced,setReduced]=useState(()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches);
 useEffect(()=>{const media=window.matchMedia('(prefers-reduced-motion: reduce)');const change=()=>setReduced(media.matches);media.addEventListener('change',change);return()=>media.removeEventListener('change',change);},[]);
 return reduced;
}

/** Remove only the neutral, light backdrop connected to the video frame edges.
 * Enclosed highlights stay intact. The original PNG remains the loading/error fallback. */
function clearVideoBackdrop(context:CanvasRenderingContext2D,size:number){
 const frame=context.getImageData(0,0,size,size),pixels=frame.data;
 const visited=new Uint8Array(size*size),queue=new Int32Array(size*size);let read=0,write=0;
 const visit=(index:number)=>{if(visited[index])return;visited[index]=1;const p=index*4;const low=Math.min(pixels[p],pixels[p+1],pixels[p+2]),high=Math.max(pixels[p],pixels[p+1],pixels[p+2]);if(low<212||high-low>28)return;queue[write++]=index;};
 for(let n=0;n<size;n++){visit(n);visit((size-1)*size+n);visit(n*size);visit(n*size+size-1);}
 while(read<write){const index=queue[read++];pixels[index*4+3]=0;const x=index%size;if(x>0)visit(index-1);if(x<size-1)visit(index+1);if(index>=size)visit(index-size);if(index<size*(size-1))visit(index+size);}
 context.putImageData(frame,0,0);
}

export function Mascot({state='idle',size=60,animated=true,cycle=0,onEnd}:{state?:MascotState;size?:number;animated?:boolean;cycle?:number;onEnd?:()=>void}){
 const reduced=useReducedMotion();const root=useRef<HTMLDivElement>(null),canvas=useRef<HTMLCanvasElement>(null);
 const [ready,setReady]=useState(false);const onEndRef=useRef(onEnd);onEndRef.current=onEnd;
 useEffect(()=>{
  setReady(false);if(!animated||reduced)return;
  const video=document.createElement('video');video.muted=true;video.playsInline=true;video.preload='auto';video.loop=state==='idle'||state==='thinking';video.playbackRate=rates[state];video.src=`/mascot/mascot_${state}.mp4`;
  const surface=canvas.current,context=surface?.getContext('2d',{willReadFrequently:true});if(!context)return;
  let disposed=false,inView=true,ended=false,timer:number|undefined,lastFrame=-1;
  const finish=()=>{if(ended||disposed)return;ended=true;video.pause();onEndRef.current?.();};
  const frame=()=>{
   if(disposed||ended)return;
   if(video.readyState>=2&&video.currentTime!==lastFrame){
    lastFrame=video.currentTime;const side=video.videoHeight;
    context.clearRect(0,0,192,192);context.drawImage(video,(video.videoWidth-side)/2,0,side,side,0,0,192,192);
    clearVideoBackdrop(context,192);setReady(true);
    const end=oneShotEnds[state];if(end!==undefined&&video.currentTime>=end){finish();return;}
   }
   timer=window.setTimeout(frame,1000/15);
  };
  const sync=()=>{
   if(disposed||ended)return;
   if(document.hidden||!inView){video.pause();if(timer!==undefined)clearTimeout(timer);timer=undefined;return;}
   void video.play().then(()=>{if(disposed||ended)return;if(timer!==undefined)clearTimeout(timer);frame();}).catch(()=>{if(!disposed){setReady(false);if(!video.loop)finish();}});
  };
  const fail=()=>{setReady(false);if(!video.loop)finish();};
  video.addEventListener('error',fail);video.addEventListener('ended',finish);document.addEventListener('visibilitychange',sync);
  const observer=new IntersectionObserver(entries=>{inView=entries[0]?.isIntersecting??false;sync();});if(root.current)observer.observe(root.current);
  return()=>{disposed=true;if(timer!==undefined)clearTimeout(timer);observer.disconnect();document.removeEventListener('visibilitychange',sync);video.removeEventListener('error',fail);video.removeEventListener('ended',finish);video.pause();video.removeAttribute('src');video.load();};
 },[state,cycle,animated,reduced]);
 return <div ref={root} className="mascot-visual" data-mascot-state={state} data-animated={animated&&!reduced} data-video-ready={ready} style={{'--mascot-size':`${size}px`} as CSSProperties} aria-hidden="true"><img className={ready?'mascot-poster is-playing':'mascot-poster'} src={`/mascot/mascot_${state}.png`} alt="" draggable={false}/><canvas ref={canvas} className={ready?'mascot-canvas is-playing':'mascot-canvas'} width={192} height={192}/></div>;
}
