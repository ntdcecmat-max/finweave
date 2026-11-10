export interface SafeEvent { environmentClass:'synthetic';profile:'user'|'ops';operationClass:'http';statusClass:'ok'|'denied'|'unavailable';latencyBucket:'lt100ms'|'lt1s'|'ge1s'; }
// Construct a fresh DTO. Never copy request, exception, URL, message or arbitrary labels.
export function safeEvent(profile:string,status:number,millis:number):SafeEvent {
  if(!['user','ops'].includes(profile)||!Number.isFinite(millis)||millis<0)throw Error('TELEMETRY_INPUT_INVALID');
  return {environmentClass:'synthetic',profile:profile as 'user'|'ops',operationClass:'http',statusClass:status<400?'ok':status<500?'denied':'unavailable',latencyBucket:millis<100?'lt100ms':millis<1000?'lt1s':'ge1s'};
}
