import { MockRepository } from '../frontend/src/mocks/repository';

function encode(value: any): any {
  if (value instanceof Map) return { $map: [...value].map(([k, v]) => [encode(k), encode(v)]) };
  if (Array.isArray(value)) return value.map(encode);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, encode(v)]));
  return value;
}
function decode(value: any): any {
  if (Array.isArray(value)) return value.map(decode);
  if (value && typeof value === 'object') {
    if (Object.keys(value).length === 1 && Array.isArray(value.$map)) return new Map(value.$map.map(([k, v]: any[]) => [decode(k), decode(v)]));
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, decode(v)]));
  }
  return value;
}
export function saveRepository(repository: MockRepository): string {
  const repo = repository as any;
  repo.requestLog = repo.requestLog.slice(-300);
  const fields = Object.fromEntries(Object.entries(repo).filter(([key]) => key !== 'sequence').map(([key, value]) => [key, encode(value)]));
  return JSON.stringify({ format: 1, fields });
}
export function loadRepository(payload: string): MockRepository {
  const saved = JSON.parse(payload);
  if (saved.format !== 1 || !saved.fields || typeof saved.fields !== 'object') throw new Error('INVALID_DEMO_SNAPSHOT');
  const repo = new MockRepository() as any;
  for (const key of Object.keys(repo)) {
    if (key === 'sequence' || !Object.hasOwn(saved.fields, key)) continue;
    if (key === 'auth' || key === 'operational') {
      const restored = decode(saved.fields[key]);
      for (const field of Object.keys(repo[key])) if (Object.hasOwn(restored, field)) repo[key][field] = restored[field];
    } else repo[key] = decode(saved.fields[key]);
  }
  return repo;
}
