# Contract nghiệp vụ thực thi local

**FW-BUSINESS-001** kế thừa API005 đã pin, cung cấp 49 operations/223 schemas cho BE-05/09/10/11/12/13 và các ports tài chính dùng chung. [OpenAPI](openapi.json), [runtime policy](runtime-policy.json), [hướng dẫn chạy](../../../finweave-backend/BUSINESS.md), [evidence và mapping](../../execution/backend-business-local-2026-10-10.md).

Request JSON strict, credential owner/workspace, cookie CSRF/Origin hoặc owner native bearer. Headers: `X-FW-Contract-Revision: FW-API-T1-D1J2-005`; response thêm `X-FW-Business-Revision: FW-BUSINESS-001`. Reply được validate trước COMMIT. Historical API005/DB005/native003 không sửa byte; subset này là contract runtime local và phải được consumer chọn rõ khi tích hợp.

Canonical routes giữ `/v2/operations/{operationId}`. Extensions dưới `/v2/business/`: retryImportJob, getBusinessHistory (Plan/Goal/import/simulation/forecast), compareSimulations, listForecastRuns, getForecastInputs, setFinancialCoverage và listFinancialCoverage. Optional snapshot context được thêm cho presentation/details/Plan/Goal reads; presentation lastSuccess/lastAttempt nhận null khi chưa có timestamp. Error.code nhận business delta; các error response trong subset tham chiếu envelope thực thi, không giữ error allowlist cũ che mất mã mới.

Money/quantity/rate inputs vẫn là string theo schema. Plan/Goal/Review write dùng preview và current versions; CSV preview24h có selected pins; simulation/forecast có frozen request/refs/digest. Same-key replay cần body semantic giữ nguyên, current authorization trước replay. Read-only polling không tự advance worker state.

Home/spending/portfolio dùng cùng immutable financial closure; client chuyển snapshotVersion từ card sang table/detail/page để giữ cùng facts. Simulations và import job metadata trong presentation là auxiliary records, không làm inputs actual. Không thêm route/màn Báo cáo mới. Forecast result pages chỉ có sau atomic succeeded, cursor được HMAC ràng buộc owner/workspace/run/input/expiry. getForecastInputs/history vẫn đọc được cho terminal/expired run.

Workers không có public HTTP. Ingestion và forecast execute qua narrow live-ticket PostgreSQL functions, với generation/token/epoch và DB capability riêng; compute thread không nhận credentials hoặc DB connection. Sự kiện Plan/Goal/simulation không tạo actual ledger effects.

Tái sinh contract bằng `node scripts/build-business-contract.ts`, kiểm source/evidence/mapping bằng `node scripts/verify-business-evidence.ts`. Các gói frontend/native/Agent/provider/UAT không được nhận là đã tích hợp chỉ vì API local đạt tests.
