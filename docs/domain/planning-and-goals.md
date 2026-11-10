# Plan–Goals, actual links và funding

**ENG-14…20 · DESIGN; runtime NOT RUN.** Kế thừa BR-28…39 và toàn bộ AI-SPEC-001.

## 1. Plan và occurrences

Plan-only, Goal-first và standalone đều có planning_scope riêng; revision identity=(workspace,scope,revision_no), không dùng bare planVersion xuyên workspace. Monthly anchor day, skip months, date bounds và occurrence ID theo [calendar](precision-calendar-snapshots.md). Save/edit/archive Plan không posting, không sửa simulation đã pin.

Actual matching resolve authorized scope/revision/item/occurrence và immutable event lineage. Không fabricating planVersion trong linkPlanActual input; schema hiện nhận item/version/occurrence/event/version. Một economic event family không được dùng cho hai occurrences đang active trong cùng scope, kể cả hai revisions; old links vẫn giữ history. Reversal/replacement/refund được resolve theo signed lineage, không vừa count original vừa count replacement dương mà bỏ reversal. Không tự gán event mới sang revision mới khi owner chưa xác nhận.

Eligible actual cùng account/currency/type/date/holding; transfer, opening, adjustment, draft/pending không được coi planned income/expense/investment. Refund giảm actual expense ở ngày nhận với origin links hợp lệ. Mỗi occurrence: remaining=max(planned−eligibleActual,0), overspend=max(eligibleActual−planned,0). Actual expense net âm do refund kỳ sau có thể làm remaining lớn hơn planned, phải trình bày lý do; không clamp actual về0 để che refund.

Adjusted Plan forecast = actual closing + remaining income − remaining expense − remaining investment. Không cộng toàn planned vào actual lần nữa. Tài sản chỉ tăng/giảm theo cashflow thực có nghĩa; investment chuyển cash sang simulated holding, không expense sinh hoạt. Không dùng baseline của item đầu tiên làm baseline cả Plan: revision có snapshot chung, nếu các items có baselines khác thì tái simulate/preview toàn bundle.

Overdue remaining phải hiển thị. Forecast ngắn hạn giữ nghĩa overdue; dài hạn chỉ chuyển sang ngày kế tiếp khi explicit overduePolicy=defer_next_day và có assumption. retain_overdue không tạo future income từ khoản đáng lẽ đã nhận. Hành vi này thay implicit shift trong prototype khi tích hợp, không bỏ overdue feature.

## 2. Earmark hiện tại

Allocate/release chỉ thay Goal allocations/history, không cash/ledger/total assets. New allocation kiểm tổng **mọi Goals chưa archive** trên account ≤ eligible cash hiện tại. Giá trị cổ phiếu/vàng, projected income và future contribution không là tiền sẵn có. Account archive/release cần preview ảnh hưởng, không làm mất allocations/history âm thầm.

Nếu actual balance giảm dưới allocations, vẫn nhận actual và giữ earmarks. Eligible=max(actual balance,0); funded capacity=min(eligible,total allocations); shortfall=allocated−funded. Chia funded pro-rata bằng integer numerator division, floor1VND, rồi chia remainder theo **stable allocationId tăng dần**; thứ tự query/UI không làm đổi kết quả. Tổng funded=capacity và mỗi allocation funded≤amount. Không đổi sang largest-remainder method âm thầm vì BR-31 đã chọn stable-ID remainder.

Available=max(balance−active allocations,0). Scope báo cáo nhỏ không cho phép bỏ competing Goals ngoài màn hình để tăng available. Unknown absolute cash → funded/progress phụ thuộc account đó unknown, không tự0 hoặc fully funded.

## 3. Lịch góp và tiêu chí đạt

contributionSchedule mô tả tiền dự định dành trong tương lai, không tạo actual allocation hoặc income. projectGoal giữ requested/scheduled, feasible và shortage theo ngày/account riêng. Nhiều Goals cạnh tranh cùng nguồn: mô phỏng dùng một shared account state, áp stable ordering (due,goalId,occurrenceId), không chạy từng Goal với toàn bộ cùng available cash rồi cộng kết quả.

Savings criterion: current funded earmarks so với target. Assets criterion: tracked assets đủ dữ liệu trong scope, không lấy goal earmark thay toàn portfolio. Independence criterion: tracked assets−declared debt so với monthlyExpense×12×expenseMultiple; debt unknown khác0, expense phải có căn cứ/declaration và target>0. Đây là điều kiện sản phẩm do owner đặt, không chứng nhận độc lập tài chính hoặc khuyến nghị mức rút vốn an toàn.

Liquidity condition là **AND** với criterion, dùng available liquid cash sau active allocations so với monthlyExpense×liquidMonths. Nếu expense/debt do owner nhập trong assessment, history ghi owner-declared, không bank-verified. Server resolve current actual snapshot và current allocations; client assessment không được tự xác lập assets/funded. Savings không đòi đủ giá thị trường khi không phụ thuộc holdings.

markGoalAchieved chỉ do owner xác nhận, với actual/declared inputs và current versions. Không dùng Monte Carlo success, expected returns hoặc future schedule để mark actual achieved. targetBasis=today chỉ inflation-adjust forecast so với base snapshot; actual target là nominal amount đang lưu, phải owner amendment riêng nếu muốn tăng target. Actual criterion không phụ thuộc profile cash/balanced/growth của mô phỏng. Sau achieved mà funding giảm, giữ achieved history và hiện shortfall/current unmet, không tự giả vẫn đủ tiền hoặc tự hoàn tác lifecycle.

## 4. Simulation và Agent

save là earmark giả; consume là simulated expense; invest chuyển cash sang holding giả. Mỗi bước kiểm nguồn account và reservations của mọi Goals; không chỉ check tổng cash. Simulation không vay tự động, bán tài sản hoặc giả tạo future income. Saving và investment không cùng bị trừ như hai expenditures. Links supports giữa Plan và Goal là quan hệ hỗ trợ, không sinh thêm cashflow; trường hợp một expense được dùng như contribution lần nữa phải bị cảnh báo/clarify, không tự tăng funded.

Agent kế thừa Q&A/giải thích/tool evidence/history/linh vật và thêm điều tra/lập Plan từ Goal/lập Goal từ Plan/đề nghị amendment. Tool được read/simulate/create draft, không owner confirm/active mutation/actual posting. Draft không funded. Owner confirm Plan+Goals+links/revisions/history/replay trong một UoW, recheck versions và aggregate funding; không tạo actual event. Stale preview, nguồn chưa biết hoặc infeasible giữ nguyên và trình bày nguyên nhân, không tự hạ reserve/tăng thu nhập giả.

Investment estimate dùng compatible unit price chưa round, floor quantity theo tracking quantum (stock1share mặc định, gold precision theo profile), cost không vượt budget và remainder rõ. Tracking quantum không là broker lot/order authorization; estimate không thực hiện lệnh mua. Thiếu quote/profile/FX thì estimate unknown, không mặc định stock hoặc giá0.

Stale quote còn là last-known estimate có asOf/quality, không thành market-verified fact. Owner preview/confirmation phải lưu quality và căn cứ đã thấy khi đánh dấu assets/independence achieved; kết quả không chứng nhận dữ liệu ngân hàng hay điều kiện tài chính đã được bên thứ ba xác minh.
