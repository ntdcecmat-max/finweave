import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useApp } from './context';
import { useChat } from './chat-provider';
import { useForecast } from './forecast-context';
import { operational } from '../services/operational';
import { ApiError } from '../services/api';
import type { V2Operation, OpInput, OpOutput, OperationalState } from '../contracts/operational';
type Execute = <K extends V2Operation>(operation: K, input: OpInput<K>) => Promise<OpOutput<K>>;
type Value = {
    state: OperationalState | undefined;
    loading: boolean;
    error: Error | null;
    busy: boolean;
    actionError: string;
    execute: Execute;
    refresh: () => Promise<void>;
    beginAgent: (intent: 'goal' | 'plan' | 'investigation', goalId?: string) => Promise<void>;
};
const Context = createContext<Value>(null!);
export function OperationalProvider({ children }: {
    children: ReactNode;
}) {
    const { store, generation, location, period } = useApp(), chat = useChat(), { settings } = useForecast(), client = useQueryClient();
    const [busy, setBusy] = useState(false), [actionError, setError] = useState('');
    const latch = useRef(false), epoch = useRef(0), attempts = useRef(new Map<string, {
        key: string;
        version: number;
    }>());
    const query = useQuery({ queryKey: ['fw', '2.0.0', 'operational', generation], enabled: !!store, queryFn: ({ signal }) => operational('getState', {}, { signal }), refetchInterval: q => q.state.data?.priceJobs.some(j => j.status === 'queued' || j.status === 'running') || q.state.data?.runs.some(r => r.state === 'queued' || r.state === 'reading' || r.state === 'simulating') ? 500 : false });
    const refresh = async () => { await client.invalidateQueries({ queryKey: ['fw'] }); };
    const execute: Execute = async (operation, input) => {
        if (!store)
            throw Error('Chưa tải xong dữ liệu.');
        if (latch.current)
            throw Error('Đang xử lý một yêu cầu. Vui lòng chờ.');
        latch.current = true;
        setBusy(true);
        setError('');
        const token = epoch.current;
        const signature = JSON.stringify({ operation, input });
        let attempt = attempts.current.get(signature);
        if (!attempt) {
            attempt = { key: crypto.randomUUID(), version: store.version };
            attempts.current.set(signature, attempt);
        }
        try {
            const result = await operational(operation, input, attempt);
            attempts.current.delete(signature);
            if (token === epoch.current)
                await refresh();
            return result;
        }
        catch (error) {
            if (error instanceof ApiError && error.status >= 400 && error.status < 500)
                attempts.current.delete(signature);
            if (token === epoch.current)
                setError((error as Error).message);
            throw error;
        }
        finally {
            if (token === epoch.current) {
                latch.current = false;
                setBusy(false);
            }
        }
    };
    useEffect(() => { epoch.current++; attempts.current.clear(); latch.current = false; setBusy(false); setError(''); }, [generation]);
    useEffect(() => () => { epoch.current++; attempts.current.clear(); }, []);
    const priorPrice = useRef('');
    useEffect(() => { const signature = query.data?.priceJobs.map(j => j.id + j.status).join('|') ?? ''; if (priorPrice.current && signature !== priorPrice.current && query.data?.priceJobs.some(j => !['queued', 'running'].includes(j.status)))
        void client.invalidateQueries({ queryKey: ['fw', '1.1.0'] }); priorPrice.current = signature; }, [query.data?.priceJobs, client]);
    const beginAgent = async (intent: 'goal' | 'plan' | 'investigation', goalId?: string) => { if (!store)
        return; chat.setEditingDraftId(null);chat.setPanel(true); try {
        const conversationId = await chat.ensureConversation(intent === 'goal' ? 'Cùng lập mục tiêu' : intent === 'plan' ? 'Cùng lập kế hoạch' : 'Kiểm tra kế hoạch');
        await execute('startAgentRun', { conversationId, intent, goalId: goalId ?? null, context: { route: location.pathname, scope: period.scope, snapshotVersion: store.version, periodStart: period.start, periodEnd: period.end }, settings });
    }
    catch { /* The action error remains visible in the shared assistant. */ } };
    return <Context.Provider value={{ state: query.data, loading: query.isPending, error: query.error, busy, actionError, execute, refresh, beginAgent }}>{children}</Context.Provider>;
}
export const useOperational = () => useContext(Context);
