import { readFile,lstat } from 'node:fs/promises';
export type Profile = 'user'|'ops'|'ingestion'|'market'|'forecast'|'agent'|'retention';
export interface Config { profile: Profile; databaseUrl: string; opsBusinessDatabaseUrl?:string; origin: string; pepper: Buffer; replayKey: Buffer; factorKey?:Buffer; recoveryEpoch:number; local: true; }
export async function loadConfig(): Promise<Config> {
  const allowedEnv=['FW_PROFILE','FW_MODE','FW_SECRET_FILE','FW_MODEL_MANIFEST'];
  if(Object.keys(process.env).some(k=>k.startsWith('FW_')&&!allowedEnv.includes(k)))throw Error('UNKNOWN_RUNTIME_ENVIRONMENT');
  const profile = process.env.FW_PROFILE as Profile;
  if (!['user','ops','ingestion','market','forecast','agent','retention'].includes(profile)) throw Error('FW_PROFILE_REQUIRED');
  // Real-data deployment stays closed until independent witness/transport/custody gates exist.
  if (process.env.FW_MODE !== 'synthetic-local') throw Error('REAL_PROFILE_NOT_ENABLED');
  const path = process.env.FW_SECRET_FILE;
  if (!path) throw Error('FW_SECRET_FILE_REQUIRED');
  const file=await lstat(path);
  if(!file.isFile()||file.isSymbolicLink()||file.size>16384)throw Error('SECRET_FILE_INVALID');
  const secret = JSON.parse(await readFile(path, 'utf8'));
  const fields=['profile','databaseUrl','opsBusinessDatabaseUrl','origin','pepper','replayKey','factorKey','recoveryEpoch','local'];
  if(!secret||typeof secret!=='object'||Array.isArray(secret)||Object.keys(secret).some(k=>!fields.includes(k)))throw Error('UNKNOWN_SECRET_FIELD');
  if(secret.local!==true)throw Error('SYNTHETIC_SECRET_REQUIRED');
  if(profile!=='ops'&&(secret.factorKey!==undefined||secret.opsBusinessDatabaseUrl!==undefined))throw Error('SECRET_PURPOSE_MISMATCH');
  if(secret.profile!==profile||!Number.isInteger(secret.recoveryEpoch)||secret.recoveryEpoch<0)throw Error('PROFILE_SECRET_MISMATCH');
  const url = new URL(secret.databaseUrl), origin = new URL(secret.origin);
  if(url.protocol!=='postgresql:'||origin.protocol!=='http:'||origin.username||origin.password||origin.pathname!=='/'||origin.search||origin.hash)throw Error('LOCAL_CONFIG_INVALID');
  if(profile==='ops'&&(!secret.opsBusinessDatabaseUrl||secret.opsBusinessDatabaseUrl===secret.databaseUrl||new URL(secret.opsBusinessDatabaseUrl).protocol!=='postgresql:'||!['127.0.0.1','localhost'].includes(new URL(secret.opsBusinessDatabaseUrl).hostname)))throw Error('OPS_BUSINESS_POOL_REQUIRED');
  if (!['127.0.0.1','localhost'].includes(url.hostname) || !['127.0.0.1','localhost'].includes(origin.hostname)) throw Error('LOCAL_LOOPBACK_REQUIRED');
  const pepper = Buffer.from(secret.pepper, 'base64url'), replayKey = Buffer.from(secret.replayKey, 'base64url');
  if (pepper.length !== 32 || replayKey.length !== 32 || pepper.equals(replayKey)) throw Error('SEPARATE_256BIT_KEYS_REQUIRED');
  const factorKey=profile==='ops'?Buffer.from(secret.factorKey??'','base64url'):undefined;
  if(profile==='ops'&&(!factorKey||factorKey.length!==32||factorKey.equals(replayKey)||factorKey.equals(pepper)))throw Error('OPS_FACTOR_KEY_REQUIRED');
  return { profile, databaseUrl: secret.databaseUrl, ...(profile==='ops'?{opsBusinessDatabaseUrl:secret.opsBusinessDatabaseUrl}:{}),origin: origin.origin, pepper, replayKey, factorKey,recoveryEpoch:secret.recoveryEpoch,local: true };
}
