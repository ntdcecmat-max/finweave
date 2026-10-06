import type { LogicalTransport,CallOptions,Reply } from './contracts';
import type { OperationId,Input } from '../contracts/operations';
/** Closed until independent attestation, identity, code distribution and key policy PoC pass. */
export class BlockedProtectedTransport implements LogicalTransport {
 readonly mode='protected' as const;
 async call<K extends OperationId>(_operation:K,_input:Input<K>,_options:CallOptions):Promise<Reply<K>> {
  throw new Error('SECURITY_TRANSPORT_NOT_VERIFIED');
 }
}
