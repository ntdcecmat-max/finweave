import type {Command,Goal,Simulation,Store} from '../domain/model';
import {useApp,MoneyValue,PrivateText} from '../app/context';
import {D,fmtDate,quantityLabel} from '../domain/selectors';
import {cleanAssetName,forecastPlans,investmentEstimate} from '../domain/planning';
import {Badge} from './ui';
import './planning.css';

export {PlanningMetric,ForecastView,GoalProjectionView} from './ForecastDashboard';
import {ForecastView,GoalProjectionView} from './ForecastDashboard';

export function SimulationResult({simulation:sim,store}:{simulation:Simulation;store:Store}){
 const goal=store.goals.find(g=>g.id===sim.goal),total=D(sim.amount).mul(sim.count).toFixed(0);
 return <div className="stack"><div className="row between"><h3>{({save:'Dành tiền cho mục tiêu',consume:'Chi tiền cho mục tiêu',invest:'Chuyển tiền sang đầu tư'})[sim.mode]}</h3><Badge tone="simulated">Kịch bản</Badge></div><p className="small muted">{sim.count} lần × <MoneyValue value={sim.amount}/> · đến {fmtDate(sim.horizon)}</p>
  <div className="table-wrap"><table><thead><tr><th>Chỉ tiêu</th><th className="num">Hiện tại lúc tính</th><th className="num">Nếu thực hiện</th></tr></thead><tbody><tr><td>Tiền trong tài khoản</td><td className="num"><MoneyValue value={sim.baseCash}/></td><td className="num"><MoneyValue value={sim.cash}/></td></tr><tr><td>Tổng tài sản</td><td className="num"><MoneyValue value={sim.baseAssets}/></td><td className="num"><MoneyValue value={sim.assets}/></td></tr><tr><td>Chi gộp lũy kế</td><td className="num"><MoneyValue value={sim.baseGross}/></td><td className="num"><MoneyValue value={D(sim.baseGross).plus(sim.gross).toFixed(0)}/></td></tr><tr><td>Chi ròng lũy kế</td><td className="num"><MoneyValue value={sim.baseNet}/></td><td className="num"><MoneyValue value={D(sim.baseNet).plus(sim.net).toFixed(0)}/></td></tr><tr><td>Tiền dành cho mục tiêu</td><td className="num"><MoneyValue value={sim.mode==='save'?D(sim.goalFunded).minus(total).toFixed(0):sim.goalFunded}/></td><td className="num"><MoneyValue value={sim.goalFunded}/></td></tr></tbody></table></div>
  <p className="notice info">{sim.mode==='save'?<>Dành <MoneyValue value={total}/> từ tiền hiện có cho mục tiêu. Tổng tiền vẫn giữ nguyên vì khoản này vẫn ở trong tài khoản.</>:sim.mode==='invest'?<>Chuyển <MoneyValue value={total}/> tiền sang tài sản đầu tư. Giá cố định nên tổng tài sản giữ nguyên.</>:<>Chi <MoneyValue value={total}/> làm giảm tiền và tổng tài sản tương ứng.</>}{goal&&<> Mục tiêu cần <MoneyValue value={goal.target}/>.</>}</p>
  <details className="chart-table"><summary>Xem các bước thực hiện</summary><div className="table-wrap"><table><thead><tr><th>Ngày</th><th className="num">Số tiền</th></tr></thead><tbody>{sim.steps.map((step,i)=><tr key={i}><td>{fmtDate(step.date)}</td><td className="num"><MoneyValue value={step.amount}/></td></tr>)}</tbody></table></div></details>
  <p className="meta muted">Kết quả lưu tại thời điểm tính. Thay đổi kế hoạch hoặc số dư sau đó cần tính lại.</p>
 </div>;
}

export function PlanningPreview({before,after,command}:{before:Store;after:Store;command:Command}){
 if(command.kind==='goalAction'&&command.data.action==='archive')return <p className="notice info">Mục tiêu sẽ được lưu trữ và các khoản dành riêng được giải phóng để dùng cho mục tiêu khác.</p>;
 if(command.kind==='planArchive')return <div className="stack"><p className="notice info">Kế hoạch này sẽ ngừng tham gia dự tính. Các giao dịch đã thực hiện vẫn được giữ lại.</p><ForecastView store={after} compact/></div>;
 if(command.kind==='planLink')return <div className="stack"><p className="notice info">Giao dịch được liên kết vào kế hoạch. Phần đã thực hiện sẽ được trừ khỏi số tiền còn lại của đúng lần thực hiện.</p><ForecastView store={after} compact/></div>;
 if(['goal','allocate','goalAction'].includes(command.kind)){
  const goal=command.data.id?after.goals.find(g=>g.id===command.data.id)!:after.goals.at(-1)!;
  return <div className="stack"><h3><PrivateText>{goal.name}</PrivateText> · <MoneyValue value={goal.target}/></h3><GoalProjectionView store={after} goal={goal} compact/></div>;
 }
 if(command.kind==='simulate')return <SimulationResult simulation={after.simulations.at(-1)!} store={before}/>;
 const plan=command.data.id?after.plans.find(i=>i.id===command.data.id)!:after.plans.at(-1)!;
 const forecast=forecastPlans(after),item=forecast.items.find(i=>i.id===plan.id)!;
 const estimate=investmentEstimate(after,plan.holding,plan.amount);
 return <div className="stack"><div><Badge tone="planned">{({income:'Thu nhập',expense:'Chi tiêu',investment:'Đầu tư'})[plan.kind]}</Badge><h3 style={{marginTop:8}}><PrivateText>{plan.name}</PrivateText></h3><p className="small muted">{item.rows.length} lần × <MoneyValue value={plan.amount}/> · Tổng <MoneyValue value={item.planned}/></p></div>
  {plan.kind==='investment'&&<div className="notice info">Tài sản: <PrivateText>{cleanAssetName(estimate.holding?.name??'')}</PrivateText>. {estimate.quantity!==null?<>Dự tính mua {quantityLabel(estimate.quantity)} {estimate.holding?.unit==='share'?'cổ phiếu':'chỉ'} mỗi lần ở giá <MoneyValue value={estimate.unitPrice}/>. {estimate.holding?.kind==='stock'&&<>Ngân sách còn lại sau làm tròn cổ phiếu: <MoneyValue value={estimate.remainder}/>.</>}</>:<>Chưa có giá phù hợp để dự tính số lượng mua.</>}</div>}
  <ForecastView store={after} compact/>
  <details className="chart-table" open><summary>Lịch thực hiện kế hoạch này</summary><div className="table-wrap"><table><thead><tr><th>Ngày</th><th className="num">Dự kiến</th><th className="num">Đã thực hiện</th><th className="num">Còn lại</th></tr></thead><tbody>{item.rows.map(row=><tr key={row.id}><td>{fmtDate(row.date)}</td><td className="num"><MoneyValue value={row.amount}/></td><td className="num"><MoneyValue value={row.actual}/></td><td className="num"><MoneyValue value={row.remaining}/></td></tr>)}</tbody></table></div></details>
 </div>;
}
