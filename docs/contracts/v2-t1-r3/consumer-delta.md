# Consumer delta của forecast

**SPECIFIED / NOT INTEGRATED.** Source references là quan sát ngày09/10/2026; [hash bảo vệ](../../execution/evidence/arch-08-domain-2026-10-09/preservation-before.json).

| Consumer | Source hiện tại | Adapter cần có |
| --- | --- | --- |
| User web/mobile UI | src/domain/forecast.ts simulateForecast tính local; app/forecast-context.tsx giữ settings trong sessionStorage | Gọi start/get/cancel run qua service khi dùng authoritative backend forecast; chuyển rates Number→canonical string có validation, money giữ strings; render nominal/real display, missing/progress/expired; giữ local preview có nhãn |
| Native owner session | Chưa có forecast callsite; collector credentials ingestion-only | UI owner call qua cookie/native OwnerBearer flow đã chọn; collector/background renewal không được gọi forecast; không đặt secret vào WebView |
| Admin | Không có quyền finance/forecast user | Chỉ aggregate queue/load/safe error, không run settings/seed/digest/output/customer IDs |
| Backend Planning/ForecastWorker | Chưa có runtime | Pure Engine input adapter, private frozen payload grants, typed J2 job/lease/fence, checkpoints/pages, context/model/version validation |
| Agent tools | Local/mock Plan–Goals tools chưa gọi forecast backend mới | Owner-scoped read/simulate via approved tool registry, không cấp ForecastWorker key cho LLM; reference run/snapshot/evidence, không copy number từ narrative |

getPresentationSnapshot Store của prototype không là production Engine model. Không gửi toàn Store làm forecast input, hoặc lấy browser Number/rounded chart làm source tiền. Owner lấy dữ liệu qua existing authorized reports; start với baseSnapshotId=null có thể tạo freeze mới dưới expectedWorkspaceVersion. Report.id không được tự đoán là DB snapshot ID.

Forecast presets/settings, filters, chart controls và mascot vẫn được kế thừa; mọi consumer có cùng một result version/assumptions. Chuyển đổi code nằm ở task tích hợp sau, không làm trong ARCH-08. Bảng mapping001/002 giữ evidence lịch sử; các hàng ở đây là planned mapping, không evidence tích hợp hoặc contract runtime PASS.
