// Additive local Ops contract; the pinned API005 catalogue remains immutable.
export const opsRevision='FW-OPS-001';
export function extendOpsContract(c:any) {
 const s=c.components.schemas;
 for(const output of ['opsStatusOutput','opsListJobsOutput']) {
  const job=output==='opsStatusOutput'?s[output].properties.jobs.items:s[output].properties.items.items;
  job.properties.type.enum.push('import','forecast','agent');job.properties.state.enum.push('cancelled');
  for(const key of ['requestedAt','updatedAt'])job.properties[key]={anyOf:[job.properties[key],{type:'null'}]};
 }
 for(const output of ['opsStatusOutput','opsListAccountsOutput']) {
  const account=output==='opsStatusOutput'?s[output].properties.accounts.items:s[output].properties.items.items;
  account.properties.devices.items.properties.lastSeen={anyOf:[account.properties.devices.items.properties.lastSeen,{type:'null'}]};
 }
 for(const output of ['opsStatusOutput','opsListAuditOutput']) {
  const audit=output==='opsStatusOutput'?s[output].properties.audit.items:s[output].properties.items.items;
  audit.properties.result={enum:['accepted','applied','rejected']};
 }
 s.opsConfirmActionOutput.properties.controlId={type:'string',pattern:'^[A-Za-z0-9_-]{1,80}$'};
 s.opsConfirmActionOutput.properties.disposition={const:'accepted'};
 s.opsConfirmActionOutput.required.push('controlId','disposition');
 s.opsGetCommandOutcomeOutput.properties.controlDisposition={enum:['accepted','applied','rejected',null]};
 s.opsGetCommandOutcomeOutput.required.push('controlDisposition');
 return c;
}
