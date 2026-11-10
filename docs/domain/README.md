# ARCH-08 — Financial Engine và domain

09/10/2026 · **ACCEPTED DESIGN theo hướng đã được ủy quyền; BACKEND/SQL/CONCURRENCY NOT RUN**. Profile **FW-ENGINE-DOMAIN-001**, forecast **FW-FORECAST-MODEL-001**. Kế thừa A+T1, S1+P2, I0+I1, D1+J2 và ARCH-05…07; giữ đủ 21 mục backend REQUIRED / 41 AC.

| Hồ sơ | Nội dung |
| --- | --- |
| [Precision và thời gian](precision-calendar-snapshots.md) | Decimal strings, rounding, giới hạn, kỳ lịch, snapshot và nguồn giá |
| [Ledger và tài sản](ledger-and-portfolio.md) | Opening, posting, transfer/fee/refund, correction, quantity và định giá |
| [Plan–Goals](planning-and-goals.md) | Occurrences, actual links, funding, tiêu chí đạt và owner confirmation |
| [Forecast](forecast-model.md) | Kế thừa mọi settings/presets, nợ/lạm phát, uncertainty, phản thực và lịch dài hạn |
| [Transactions](transactions-and-concurrency.md) | UnitOfWork, lock order, replay, read consistency và races |
| [Đối chiếu frontend](source-review.md) | Quan sát source có vị trí cụ thể; phần kế thừa và phần phải sửa khi tích hợp |
| [Acceptance](acceptance-plan.md), [golden vectors](golden-vectors.json) | Oracle độc lập; hành vi backend và concurrency chưa chạy |
| [Policy](engine-policy.json), [bundle](implementation-bundle.json) | Pin Engine, API, DB và security; tách trạng thái thiết kế/thực thi |

Engine gồm phần tính actual chính xác và phần dự báo có điều kiện, cùng nằm trong modular backend/shared pure library. Engine không import React, fixture store, SQL, HTTP hoặc model SDK. Application workflows xác thực và nạp facts; Engine nhận immutable typed input cùng context/version/clock, trả effects hoặc projections, không tự commit. Repository/controller/worker không được tự tính thêm một số dư khác.

Frontend hiện dùng decimal.js trong selectors nhưng forecast dài hạn dùng Number/Math và state cục bộ. Đây là source để kiểm kê tính năng, không phải oracle duy nhất hoặc production backend. Không sửa frontend trong ARCH-08.

Phát hiện thiếu hợp đồng cho forecast dài hạn được xử lý bằng [API revision003](../contracts/v2-t1-r3/README.md): giữ 147 operations/600 schemas của002, thêm 4 operations và 26 schemas, thành **151 operations/626 schemas**. [DB revision004](../data/target-t1-domain/README.md) kế thừa84 bảng, thêm2 bảng forecast thành **86 bảng/988 cột/161 FK**, không thêm financial queue ngoài J2. Các gói cũ và snapshot giữ nguyên; consumers chưa migrate.

Số operation/bảng không là bằng chứng hoàn thiện. Kiểm oracle ở đây chỉ kiểm ví dụ và specification, không phải nghiệm thu production Engine, SQL, grants, model thống kê hoặc UAT. Tiếp theo **ARCH-09 Async/sync** chốt timings, checkpoint, cancellation, retry và đồng bộ theo các ranh giới này.

Security policy ARCH-07 giữ binding lịch sử API002/DB003. Bundle ARCH-08 có securityBindingAddendum pin API003/DB004 và các overlay151operations/86bảng cùng hashes; không sửa hoặc giả base policy đã mang hash mới. Controls T1/keys/logs/egress/witness/restore giữ nguyên, ForecastWorker có capability riêng.
