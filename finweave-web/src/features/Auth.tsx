import {createContext,useContext,useEffect,useState,useRef} from 'react';
import type {ReactNode,FormEvent} from 'react';
import {Link,useLocation,useNavigate} from 'react-router';
import {useQueryClient} from '@tanstack/react-query';
import {ShieldCheck,ArrowRight,Eye,EyeOff,LockKeyhole,LogOut} from 'lucide-react';
import {Button,Badge} from '../components/ui';
import {identityServices,identityOptions,setApiSession} from '../services/api';
import {clearPresentationDrafts} from '../services/presentation';
const DEMO_EMAIL='demo@finweave.test',DEMO_PASSWORD='FinWeaveDemo!2026',DEMO_CODE='123456';
import type {MockIdentity} from '../services/mock-auth';
import './auth.css';
const sessionKey='fw:synthetic-session';
function restoreSyntheticSession():MockIdentity|null {
 try {const value=JSON.parse(sessionStorage.getItem(sessionKey)||'null');if(value?.synthetic===true&&typeof value.sessionId==='string'&&value.role==='owner'&&value.deviceId==='DEVICE-DEMO'&&typeof value.email==='string'&&value.email.endsWith('@finweave.test')&&typeof value.name==='string'&&typeof value.expiresAt==='number'&&value.expiresAt>Date.now()){setApiSession(value.sessionId);return value;}sessionStorage.removeItem(sessionKey);}catch{sessionStorage.removeItem(sessionKey);}return null;
}
const AuthContext=createContext<{user:MockIdentity|null;sessionDestination:string|null;setUser:(user:MockIdentity|null)=>void;endSession:(expired?:boolean)=>Promise<void>}>({user:null,sessionDestination:null,setUser:()=>{},endSession:async()=>{}});
export function AuthProvider({children}:{children:ReactNode}) {
 const [user,updateUser]=useState<MockIdentity|null>(restoreSyntheticSession);const [sessionDestination,setSessionDestination]=useState<string|null>(null);const ending=useRef(false);const client=useQueryClient();const nav=useNavigate();
 const setUser=(identity:MockIdentity|null)=>{setApiSession(identity?.sessionId||null);if(identity){sessionStorage.setItem(sessionKey,JSON.stringify(identity));setSessionDestination(null);ending.current=false;}else sessionStorage.removeItem(sessionKey);updateUser(identity);};
 const endSession=async(expired=false)=>{if(ending.current)return;ending.current=true;const destination=expired?'/auth/expired':'/auth/login';const serverCall=user?.sessionId?identityServices.signOut({sessionId:user.sessionId},identityOptions()).catch(()=>undefined):Promise.resolve();await client.cancelQueries();client.clear();clearPresentationDrafts();sessionStorage.removeItem('fw:synthetic-challenge');setSessionDestination(destination);setUser(null);nav(destination,{replace:true});await serverCall;};
 useEffect(()=>{if(!user)return;const timer=setTimeout(()=>void endSession(true),Math.max(0,user.expiresAt-Date.now()));return()=>clearTimeout(timer);},[user?.expiresAt]);
 return <AuthContext.Provider value={{user,sessionDestination,setUser,endSession}}>{children}</AuthContext.Provider>;
}
export const useAuth=()=>useContext(AuthContext);
export function AuthGate({children}:{children:ReactNode}) {
 const {user,sessionDestination}=useAuth();const location=useLocation();const nav=useNavigate();
 useEffect(()=>{if(!user&&!location.pathname.startsWith('/auth/'))nav(sessionDestination||'/auth/login',{replace:true,state:{returnTo:location.pathname+location.search}});},[user,location.pathname,sessionDestination]);
 if(location.pathname.startsWith('/auth/'))return <AuthScreen/>;
 return user?children:<AuthScreen/>;
}
const headings:Record<string,string>={login:'Đăng nhập FinWeave',register:'Tạo tài khoản demo',forgot:'Quên mật khẩu',reset:'Đặt lại mật khẩu demo',verify:'Xác thực mã demo',expired:'Phiên demo đã hết hạn',denied:'Bạn chưa có quyền truy cập'};
function AuthScreen() {
 const loc=useLocation(),nav=useNavigate();const screen=loc.pathname.split('/')[2]||'login';const {user,setUser,endSession}=useAuth();
 const submitLock=useRef(false);const attempts=useRef(new Map<string,ReturnType<typeof identityOptions>>());const authOptions=(payload:unknown)=>{const key=JSON.stringify({screen,payload});let options=attempts.current.get(key);if(!options){options=identityOptions();attempts.current.set(key,options);}return options;};
 const [email,setEmail]=useState(DEMO_EMAIL),[name,setName]=useState(''),[password,setPassword]=useState(''),[confirm,setConfirm]=useState(''),[code,setCode]=useState(''),[visible,setVisible]=useState(false),[ack,setAck]=useState(false),[error,setError]=useState(''),[result,setResult]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{setError('');setResult('');setPassword('');setConfirm('');setCode('');setVisible(false);setBusy(false);document.title=(headings[screen]||headings.login)+' · FinWeave';document.getElementById('auth-title')?.focus();},[screen]);
 useEffect(()=>{if(screen==='expired'&&user)void endSession(true);},[screen]);
 const submit=async(e:FormEvent)=>{e.preventDefault();if(submitLock.current)return;submitLock.current=true;setError('');setResult('');setBusy(true);try {
  await Promise.resolve();
  if(screen==='login'){const response=await identityServices.signIn({email:email.trim(),password},authOptions({email:email.trim(),password}));sessionStorage.setItem('fw:synthetic-challenge',response.challengeId);setPassword('');nav('/auth/verify',{state:{returnTo:(loc.state as {returnTo?:string}|null)?.returnTo}});}
  else if(screen==='register'){if(!ack)throw new Error('Xác nhận sử dụng dữ liệu giả để tiếp tục.');const response=await identityServices.registerIdentity({name,email:email.trim(),password,passwordConfirmation:confirm,syntheticAcknowledgement:ack},authOptions({name,email:email.trim(),password,passwordConfirmation:confirm,syntheticAcknowledgement:ack}));sessionStorage.setItem('fw:synthetic-challenge',response.challengeId);setPassword('');setConfirm('');nav('/auth/verify');}
  else if(screen==='verify'){const response=await identityServices.verifyIdentityChallenge({challengeId:sessionStorage.getItem('fw:synthetic-challenge')||'MISSING',code},authOptions({challengeId:sessionStorage.getItem('fw:synthetic-challenge')||'MISSING',code}));const identity={...response.profile,sessionId:response.session.sessionId,expiresAt:Date.parse(response.session.expiresAt),deviceId:'DEVICE-DEMO' as const,role:'owner' as const,synthetic:true as const};setUser(identity);sessionStorage.removeItem('fw:synthetic-challenge');const target=(loc.state as {returnTo?:string}|null)?.returnTo;const allowed=['/home','/home/reports','/home/assets','/transactions','/transactions/flow','/transactions/transfers','/transactions/refunds','/plan','/plan/items','/plan/investments','/plan/goals','/plan/simulation','/data','/data/review','/ai','/ai/history','/design'];nav(target&&allowed.includes(target.split('?')[0])?target:'/home',{replace:true});}
  else if(screen==='forgot')setResult((await identityServices.requestPasswordReset({email:email.trim()},authOptions({email:email.trim()}))).message);
  else if(screen==='reset'){setResult((await identityServices.resetIdentityPassword({resetToken:new URLSearchParams(loc.search).get('token')||'MISSING',password,passwordConfirmation:confirm},authOptions({resetToken:new URLSearchParams(loc.search).get('token')||'MISSING',password,passwordConfirmation:confirm}))).message);setPassword('');setConfirm('');}
 }catch(ex){setError((ex as Error).message);requestAnimationFrame(()=>document.querySelector<HTMLInputElement>('.auth-form input:not([type=checkbox])')?.focus());}finally{setBusy(false);submitLock.current=false;}};
 const field=(id:string,label:string,value:string,set:(value:string)=>void,type='text',autoComplete='off')=><div className="field"><label htmlFor={id}>{label}</label><input id={id} type={type} value={value} onChange={e=>set(e.target.value)} autoComplete={autoComplete} required maxLength={id==='auth-password'||id==='auth-confirm'?128:500} aria-describedby={error?'auth-error':undefined}/></div>;
 const isForm=['login','register','forgot','reset','verify'].includes(screen);
 return <main className="auth-shell" id="auth-main"><aside className="auth-story"><Link className="auth-brand" to="/auth/login"><span className="auth-mark">FW</span>FinWeave</Link><div><p className="eyebrow">TIỀN CỦA BẠN, RÕ HƠN</p><h2>Hiểu tài chính từ cùng một nguồn dữ liệu.</h2><p>Tổng hợp, giao dịch, kế hoạch, dữ liệu và trợ lý — kết nối bằng nguồn, thời gian và bằng chứng.</p><div className="auth-principles"><span><ShieldCheck size={20}/>Không gian tài chính cá nhân</span><span><LockKeyhole size={20}/>Bản dùng thử với dữ liệu giả</span></div></div><p className="meta">Prototype local · Ngân hàng và trợ lý được mô phỏng</p></aside><section className="auth-content"><div className="auth-card"><Badge tone="warning">Dùng thử · Dữ liệu giả</Badge><h1 id="auth-title" tabIndex={-1}>{headings[screen]||headings.login}</h1><p className="muted small">Chỉ dùng tài khoản giả <strong>@finweave.test</strong>. Không nhập mật khẩu hoặc email thật. Mã xác thực và liên kết khôi phục được mô phỏng ngay trong bản dùng thử.</p>
 {screen==='login'&&<div className="notice info auth-fixture">Tài khoản mẫu: {DEMO_EMAIL}<br/>Mật khẩu mẫu: {DEMO_PASSWORD}<Button type="button" onClick={()=>{setEmail(DEMO_EMAIL);setPassword(DEMO_PASSWORD);}}>Điền thông tin mẫu</Button></div>}
 {screen==='verify'&&<div className="notice info">Mã mô phỏng: <strong>{DEMO_CODE}</strong>. Không gửi SMS/email thật.</div>}
 {screen==='register'&&<p className="small muted">Tạo danh tính cho phiên demo này. Reload xóa phiên; không tạo tài khoản thật.</p>}
 {isForm&&<form className="auth-form stack" onSubmit={submit}>
 {screen==='register'&&field('auth-name','Tên hiển thị',name,setName)}
 {['login','register','forgot'].includes(screen)&&field('auth-email','Email demo',email,setEmail,'email','username')}
 {['login','register','reset'].includes(screen)&&<>{field('auth-password','Mật khẩu demo',password,setPassword,visible?'text':'password',screen==='login'?'current-password':'new-password')}<Button type="button" variant="ghost" className="auth-reveal" aria-pressed={visible} onClick={()=>setVisible(!visible)}>{visible?<EyeOff size={16}/>:<Eye size={16}/>} {visible?'Ẩn mật khẩu':'Hiện mật khẩu'}</Button>{screen!=='login'&&<p className="meta muted">12–128 ký tự, gồm chữ, số và ký hiệu. Thông tin giả chỉ giữ trong memory tới reload.</p>}</>}
 {['register','reset'].includes(screen)&&field('auth-confirm','Nhập lại mật khẩu demo',confirm,setConfirm,visible?'text':'password','new-password')}
 {screen==='verify'&&<div className="field"><label htmlFor="auth-code">Mã xác thực demo</label><input id="auth-code" value={code} onChange={e=>setCode(e.target.value)} inputMode="numeric" autoComplete="one-time-code" maxLength={6} required aria-describedby={error?'auth-error':undefined}/></div>}
 {screen==='register'&&<label className="check"><input type="checkbox" checked={ack} onChange={e=>setAck(e.target.checked)}/>Tôi hiểu đây là mô phỏng dùng dữ liệu giả.</label>}
 {error&&<p className="notice error" id="auth-error" role="alert">{error}</p>}
 {!result&&<Button type="submit" variant="primary" disabled={busy}>{busy?'Đang kiểm tra…':({login:'Đăng nhập demo',register:'Tạo tài khoản demo',forgot:'Tiếp tục khôi phục demo',reset:'Đặt lại mật khẩu demo',verify:'Xác nhận mã demo'} as Record<string,string>)[screen]}<ArrowRight size={17}/></Button>}
 </form>}
 {result&&<div role="status" className="notice info">{result}</div>}
 {screen==='forgot'&&result&&<Link className="btn primary" to="/auth/reset?token=DEMO-RESET">Mở liên kết đặt lại mô phỏng</Link>}
 {screen==='reset'&&result&&<Link className="btn primary" to="/auth/login">Về đăng nhập</Link>}
 {screen==='expired'&&<><div className="notice warning" role="status">Phiên 30 phút đã kết thúc. Dữ liệu phiên, chat và cache được xóa; đăng nhập demo để bắt đầu lại.</div><Link className="btn primary" to="/auth/login">Đăng nhập lại</Link></>}
 {screen==='denied'&&<><div className="notice error" role="alert">Không có dữ liệu tài chính được trả cho workspace hoặc đối tượng không được phép.</div>{user?<Link className="btn primary" to="/home">Về workspace demo của tôi</Link>:<Link className="btn primary" to="/auth/login">Về đăng nhập</Link>}</>}
 <div className="auth-links">{screen==='login'?<><Link to="/auth/register">Tạo tài khoản demo</Link><Link to="/auth/forgot">Quên mật khẩu?</Link></>:screen!=='reset'||!result?<Link to="/auth/login" onClick={()=>sessionStorage.removeItem('fw:synthetic-challenge')}>Về đăng nhập</Link>:null}{user&&<Button variant="ghost" onClick={()=>void endSession()}><LogOut size={16}/>Đăng xuất</Button>}</div>
 <p className="meta muted auth-footnote">Tài khoản và thao tác chỉ phục vụ bản dùng thử; không dùng để truy cập dữ liệu tài chính thật.</p>
 </div></section></main>;
}
