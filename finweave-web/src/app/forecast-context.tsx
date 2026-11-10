import {createContext,useContext,useState} from 'react';
import type {ReactNode} from 'react';
import {DEFAULT_FORECAST,normalizeForecast} from '../domain/forecast';
import type {ForecastSettings} from '../domain/forecast';
import {useApp} from './context';
const Context=createContext<{settings:ForecastSettings;patch:(v:Partial<ForecastSettings>)=>void;reset:()=>void}>({settings:DEFAULT_FORECAST,patch:()=>{},reset:()=>{}});
function Session({children,resetGeneration}:{children:ReactNode;resetGeneration:number}){
 const [settings,setSettings]=useState(()=>{if(resetGeneration>0){try{sessionStorage.removeItem('fw:forecast:v2');}catch{}return DEFAULT_FORECAST;}try{return normalizeForecast(JSON.parse(sessionStorage.getItem('fw:forecast:v2')??'{}'));}catch{return DEFAULT_FORECAST;}});
 const patch=(v:Partial<ForecastSettings>)=>setSettings(old=>{const next=normalizeForecast({...old,...v});try{sessionStorage.setItem('fw:forecast:v2',JSON.stringify(next));}catch{/* Assumptions remain available in memory. */}return next;});
 const reset=()=>{try{sessionStorage.removeItem('fw:forecast:v2');}catch{}setSettings(DEFAULT_FORECAST);};
 return <Context.Provider value={{settings,patch,reset}}>{children}</Context.Provider>;
}
export function ForecastProvider({children}:{children:ReactNode}){const {generation}=useApp();return <Session key={generation} resetGeneration={generation}>{children}</Session>;}
export const useForecast=()=>useContext(Context);
