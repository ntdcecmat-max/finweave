import {useNavigate} from 'react-router';
import {Button,Badge} from '../components/ui';
import {useView} from '../app/view';
import {useAuth} from '../features/Auth';
import {interfaceCatalogue} from '../contracts/interface-catalogue';
import {screenCatalogue} from '../contracts/surface-catalogue';
export const moduleCatalogue=[
 {name:'Authentication & phiên',routes:['/auth/login','/auth/register','/auth/forgot','/auth/reset?token=DEMO-RESET','/auth/verify','/auth/denied'],features:'Đăng nhập · đăng ký · mã demo · quên/đặt lại mật khẩu · đăng xuất/hết phiên · denied. Chỉ tài khoản .test.'},
 {name:'Tổng hợp tài chính',routes:['/home','/home/reports'],features:'Số dư, dòng tiền, thu/chi/hoàn, cơ cấu tài sản, Insights, chart/bảng và drill-down; custom period/account scope.'},
 {name:'Tài khoản & tiền mặt',routes:['/home/assets'],features:'Ngân hàng, ví, cash; opening, tài khoản detail/archive/history; mốc theo dõi; kiểm đếm → variance → Review.'},
 {name:'Cổ phiếu & vàng',routes:['/home/assets'],features:'Thêm holding, số lượng, giá vốn, quote/FX/đơn vị, chất lượng, lịch sử và nguồn; gold chỉ/lượng và USD quote.'},
 {name:'Giao dịch',routes:['/transactions','/transactions/flow'],features:'Thu, chi, pending/draft/posted/reversed; lọc/search; detail/evidence/history; phân loại, correction, ghi sổ nháp.'},
 {name:'Chuyển tiền & hoàn tiền',routes:['/transactions/transfers','/transactions/refunds'],features:'2 tài khoản, phí, thiếu chân chuyển; nhận hoàn, liên kết khoản mua, giới hạn hoàn; không lẫn với chi.'},
 {name:'Nguồn & import',routes:['/data'],features:'Connection/freshness/error, refresh/disconnect/reconnect; CSV mapping, raw/normalized preview, selected subset, kết quả và lịch sử.'},
 {name:'Review & bằng chứng',routes:['/data/review'],features:'Cash, duplicate, invalid, transfer, refund, category, pending và quality; preview/resolve/defer; raw/history vẫn giữ.'},
 {name:'Kế hoạch & actual',routes:['/plan','/plan/items','/plan/investments'],features:'Thu/chi/đầu tư dự kiến, recurrence, sửa/version/archive; actual links/unlink, remaining, overspend và forecast.'},
 {name:'Goals & phân bổ',routes:['/plan/goals'],features:'Target/deadline/contribution, allocation/release, funded/shortfall, đạt/archive, lịch sử; không tự sinh tiền.'},
 {name:'Mô phỏng mục tiêu',routes:['/plan/simulation'],features:'Góp, tiêu dùng, đầu tư; số lần/ngày/horizon; kết quả và so sánh frozen versions, thiếu giá, cash capacity.'},
 {name:'AI & contextual panel',routes:['/ai','/ai/history'],features:'Chat, history, send/cancel/error, scripted result/evidence; cùng conversation/context giữa full chat và panel 5 navigation.'},
 {name:'Thiết lập & design system',routes:['/design'],features:'Tokens/components/states, keyboard/privacy, fixture/reset/fault/clock; ngoài 5 navigation nghiệp vụ.'},
];
export function ModuleCatalogue() {
 const nav=useNavigate(),{openAction}=useView(),{endSession}=useAuth();
 return <section className="card stack" id="module-catalogue"><div><Badge>13 nhóm giao diện · 5 navigation nghiệp vụ</Badge><h2 style={{marginTop:12}}>Bản đồ module và tính năng</h2><p className="small muted">Inventory kế thừa gồm 13 module và 86 thao tác. Catalogue v3 bên dưới có 50 mã màn; admin chạy riêng, Android chưa có native/APK. Core mock v1.1 và operational prototype mang nhãn 2.0 chưa tương thích đầy đủ API v2 bàn giao. Trạng thái triển khai không thay cho nghiệm thu.</p></div><div className="module-map grid two">{interfaceCatalogue.map(m=><article key={m.id}><h3>{m.name}</h3><p className="small muted">{m.interfaces.join(' · ')}</p><p className="meta muted" style={{marginTop:8}}>{m.implementation}</p><div className="row" style={{marginTop:12}}>{m.routes.map(route=><Button key={route} onClick={()=>nav(route)}>{route}</Button>)}</div><details style={{marginTop:12}}><summary>Thao tác & trạng thái ({m.actions.length})</summary><ul>{m.actions.map(action=><li key={action.id}><strong>{action.id} · {action.label}</strong><p className="meta muted">{action.kind} · {action.states.join(' / ')}</p></li>)}</ul></details></article>)}</div><details id="screen-catalogue"><summary>Catalogue v3 · 50 mã màn hình</summary><div className="table-wrap"><table><caption>Trạng thái triển khai và giới hạn kiểm chứng từng màn</caption><thead><tr><th>Mã</th><th>Màn / bề mặt</th><th>Route</th><th>Triển khai</th><th>Chưa kiểm chứng</th></tr></thead><tbody>{screenCatalogue.map(s=><tr key={s.id}><td>{s.id}</td><td>{s.title} · {s.surface}</td><td>{s.route??"Dialog / component"}</td><td>{s.implementation}</td><td>{s.unverified}</td></tr>)}</tbody></table></div></details><div className="row">{[['tracking','Mốc theo dõi'],['account','Thêm tài khoản'],['holding','Thêm tài sản'],['event','Ghi giao dịch'],['cashCount','Kiểm đếm cash'],['plan','Tạo planned item'],['goal','Tạo goal']].map(([kind,label])=><Button key={kind} onClick={()=>openAction(kind)}>{label}</Button>)}<Button onClick={()=>void endSession(true)}>Thử hết phiên demo</Button></div></section>;
}
