import { Outbox } from './local-core.mjs';
const [path,mode]=process.argv.slice(2);
const queue=new Outbox(path);
if(mode==='crash-after-durable-append') {
  queue.enqueue({id:'crash-item',owner:'A',epoch:2,capturedAt:1802044800,digest:'synthetic-crash'});
  process.exit(86); // abrupt process termination after fsync, before simulated caller ACK
}
if(mode==='read-after-restart') console.log(JSON.stringify(queue.pending('A',2,1802044800).map(x=>x.id)));
else throw Error('UNKNOWN_MODE');
