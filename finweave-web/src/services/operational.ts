import { network, ApiError,dataMode } from './api';
import {realOperational} from './real-operational';
import { v2Operations } from '../contracts/operational';
import type { V2Operation, OpInput, OpOutput } from '../contracts/operational';
export async function operational<K extends V2Operation>(operation: K, input: OpInput<K>, options: {
    key?: string;
    version?: number;
    signal?: AbortSignal;
} = {}): Promise<OpOutput<K>> {
    if(dataMode==='backend')return realOperational(operation,input,options) as Promise<OpOutput<K>>;
    const requestId = crypto.randomUUID(), parsed = v2Operations[operation].input.parse(input);
    const reply = await network('/__mock/v2/operational', { contractVersion: '2.0.0', requestId, operation, input: parsed, idempotencyKey: options.key ?? null, expectedWorkspaceVersion: options.version ?? null }, options.signal);
    if (reply.contractVersion !== '2.0.0' || reply.requestId !== requestId)
        throw new ApiError('Phản hồi không đúng phiên bản. Giữ yêu cầu để đối chiếu.', 'SERVICE_UNAVAILABLE', 502);
    return v2Operations[operation].output.parse(reply.data) as OpOutput<K>;
}
