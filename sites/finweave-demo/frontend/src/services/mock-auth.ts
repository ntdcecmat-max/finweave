/** Synthetic identity only. Dummy credentials live in memory; no disk, mail or provider. */
export const DEMO_EMAIL='demo@finweave.test';
export const DEMO_PASSWORD='FinWeaveDemo!2026';
export const DEMO_CODE='123456';
export interface MockIdentity {sessionId?:string;email:string;name:string;expiresAt:number;deviceId:'DEVICE-DEMO';role:'owner';synthetic:true;}
export function validateDemoEmail(email:string) {return /^[A-Za-z0-9._+-]+@finweave\.test$/.test(email);}
export function validateDemoPassword(value:string) {return value.length>=12&&value.length<=128&&/[a-z]/i.test(value)&&/\d/.test(value)&&/[^a-z\d]/i.test(value);}
export class MockAuthService {
 private accounts=new Map([[DEMO_EMAIL,{name:'Chủ workspace demo',password:DEMO_PASSWORD}]]);
 private pending: {email:string;name:string;password:string|null;expiresAt:number}|null=null;
 private resetEmail:string|null=null;
 signIn(email:string,password:string) {
  const account=this.accounts.get(email);
  if(!account||password!==account.password)throw new Error('Email hoặc mật khẩu demo chưa đúng.');
  this.pending={email,name:account.name,password:null,expiresAt:Date.now()+5*60*1000};
  return {state:'challenge',challengeId:'DEMO-CHALLENGE',synthetic:true as const};
 }
 register(name:string,email:string,password:string,confirm:string) {
  if(!name.trim()||name.trim().length>80)throw new Error('Tên hiển thị từ 1 đến 80 ký tự.');
  if(!validateDemoEmail(email))throw new Error('Dùng email giả có đuôi @finweave.test.');
  if(!validateDemoPassword(password))throw new Error('Mật khẩu demo cần 12–128 ký tự, có chữ, số và ký hiệu.');
  if(password!==confirm)throw new Error('Mật khẩu nhập lại chưa khớp.');
  if(this.accounts.has(email))throw new Error('Email demo này đã tồn tại. Dùng đăng nhập hoặc email .test khác.');
  this.pending={email,name:name.trim(),password,expiresAt:Date.now()+5*60*1000};
  return {state:'challenge',challengeId:'DEMO-CHALLENGE',synthetic:true as const};
 }
 verify(code:string,now=Date.now()):MockIdentity {
  if(!this.pending)throw new Error('Chưa có yêu cầu xác thực. Mở đăng nhập hoặc đăng ký trước.');
  if(now>this.pending.expiresAt){this.pending=null;throw new Error('Mã demo đã hết hạn. Mở đăng nhập hoặc đăng ký để nhận mã mới.');}
  if(code!==DEMO_CODE)throw new Error('Mã demo chưa đúng. Dùng 123456.');
  if(this.pending.password)this.accounts.set(this.pending.email,{name:this.pending.name,password:this.pending.password});
  const user={email:this.pending.email,name:this.pending.name,expiresAt:now+30*60*1000,deviceId:'DEVICE-DEMO' as const,role:'owner' as const,synthetic:true as const};
  this.pending=null;return user;
 }
 requestReset(email:string) {
  if(!validateDemoEmail(email))throw new Error('Dùng email giả có đuôi @finweave.test.');
  this.resetEmail=this.accounts.has(email)?email:null;
  return {message:'Nếu tài khoản demo phù hợp, bạn có thể tiếp tục đặt lại mật khẩu.',synthetic:true as const};
 }
 resetPassword(token:string,password:string,confirm:string) {
  if(token!=='DEMO-RESET'||!this.resetEmail)throw new Error('Liên kết demo không hợp lệ hoặc đã hết hạn.');
  if(!validateDemoPassword(password))throw new Error('Mật khẩu demo cần 12–128 ký tự, có chữ, số và ký hiệu.');
  if(password!==confirm)throw new Error('Mật khẩu nhập lại chưa khớp.');
  const account=this.accounts.get(this.resetEmail)!;this.accounts.set(this.resetEmail,{...account,password});this.resetEmail=null;
  return {message:'Đã đặt lại mật khẩu demo trong phiên này. Đăng nhập bằng mật khẩu demo vừa đặt.',synthetic:true as const};
 }
 cancelChallenge() {this.pending=null;}
}
