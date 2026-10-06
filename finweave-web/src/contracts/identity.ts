import {z} from 'zod';
import {Id,Text,Timestamp,Session,CONTRACT_VERSION} from './schemas';
const obj=z.strictObject;
const Email=z.email().max(254);
const Password=z.string().min(12).max(128);
const Challenge=obj({challengeId:Id,state:z.literal('challenge'),expiresAt:Timestamp,synthetic:z.boolean()});
export const IdentityResult=obj({session:Session,profile:obj({email:Email,name:Text}),synthetic:z.boolean()});
const Notice=obj({message:Text,synthetic:z.boolean()});
export const IdentityError=obj({contractVersion:z.literal(CONTRACT_VERSION),requestId:Id,code:z.enum(['VALIDATION','FORBIDDEN','NOT_FOUND','IDEMPOTENCY_CONFLICT','INVALID_CREDENTIALS','EMAIL_INVALID','EMAIL_EXISTS','PASSWORD_POLICY','PASSWORD_MISMATCH','CHALLENGE_INVALID','CHALLENGE_EXPIRED','RESET_INVALID','UNAUTHENTICATED','RATE_LIMITED','OFFLINE','TIMEOUT','SERVICE_UNAVAILABLE','SECURITY_TRANSPORT_NOT_VERIFIED']),message:Text,retryable:z.boolean(),retryAfterSeconds:z.number().int().min(1).nullable()});
function auth<I extends z.ZodType,O extends z.ZodType>(input:I,output:O,authorized=false){return {input,output,authorized};}
export const identityOperations={
 signIn:auth(obj({email:Email,password:Password}),Challenge),
 registerIdentity:auth(obj({email:Email,name:z.string().trim().min(1).max(80),password:Password,passwordConfirmation:Password,syntheticAcknowledgement:z.boolean()}),Challenge),
 verifyIdentityChallenge:auth(obj({challengeId:Id,code:z.string().regex(/^\d{6}$/)}),IdentityResult),
 requestPasswordReset:auth(obj({email:Email}),Notice),
 resetIdentityPassword:auth(obj({resetToken:Id,password:Password,passwordConfirmation:Password}),Notice),
 signOut:auth(obj({sessionId:Id}),obj({signedOut:z.literal(true),synthetic:z.boolean()}),true),
} as const;
export type IdentityOperationId=keyof typeof identityOperations;
export interface IdentityOptions {contractVersion:typeof CONTRACT_VERSION;requestId:string;idempotencyKey:string;signal?:AbortSignal;}
export type IdentityServices={[K in IdentityOperationId]:(input:z.infer<(typeof identityOperations)[K]['input']>,options:IdentityOptions)=>Promise<z.infer<(typeof identityOperations)[K]['output']>>};
const challenge={challengeId:'DEMO-CHALLENGE',state:'challenge',expiresAt:'2026-10-06T01:05:00+07:00',synthetic:true};
const password='FinWeaveDemo!2026';
export const identityExamples:Record<IdentityOperationId,{input:unknown;output:unknown}>={
 signIn:{input:{email:'demo@finweave.test',password},output:challenge},
 registerIdentity:{input:{email:'an@finweave.test',name:'An',password,passwordConfirmation:password,syntheticAcknowledgement:true},output:challenge},
 verifyIdentityChallenge:{input:{challengeId:'DEMO-CHALLENGE',code:'123456'},output:{session:{sessionId:'SESSION-DEMO',subjectId:'OWNER-DEMO',deviceId:'DEVICE-DEMO',workspaceIds:['W-DEMO'],role:'owner',expiresAt:'2026-10-06T01:30:00+07:00',synthetic:true},profile:{email:'demo@finweave.test',name:'Chủ workspace demo'},synthetic:true}},
 requestPasswordReset:{input:{email:'demo@finweave.test'},output:{message:'Nếu tài khoản demo phù hợp, bạn có thể tiếp tục đặt lại mật khẩu.',synthetic:true}},
 resetIdentityPassword:{input:{resetToken:'DEMO-RESET',password,passwordConfirmation:password},output:{message:'Mật khẩu demo đã thay đổi trong phiên này.',synthetic:true}},
 signOut:{input:{sessionId:'SESSION-DEMO'},output:{signedOut:true,synthetic:true}}
};
