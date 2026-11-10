import { parentPort } from 'node:worker_threads';
import { runForecastPath } from '../engine/forecast.ts';
import { engineDigest } from './engine-pin.ts';
parentPort!.on('message',({input,trial,withPlans,checkpoint})=>{try{if(input.engineDigest!==engineDigest||input.runtimeVersion!==process.version)throw Error('INPUT_INVALID');parentPort!.postMessage({result:runForecastPath(input,trial,withPlans,{checkpoint,maxDays:10000,maxMillis:1900})});}catch(e){parentPort!.postMessage({error:(e as Error).message});}});
