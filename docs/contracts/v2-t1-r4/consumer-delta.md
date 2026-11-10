# Consumer migration sang API004

**PLANNED / NOT INTEGRATED.** Không sửa frontend/native runtime trong ARCH-09.

| Consumer | Cần thay khi tích hợp |
| --- | --- |
| User web | Pin exact004, gửi CSV header selectors đúng mode; đọc completeness flags, dùng coverage/gaps paging khi chưa đủ; poll typed statuses thay mock getState; không coi query là worker |
| User mobile WebView | Cùng API004 owner DTO qua native owner session broker; local generation/epoch/version guards; không đưa collector/refresh secrets vào JS |
| Android collector | Giữ ingest/reconcile wire như003; pairing ACK/digest/in-flight identity, Retry-After, bounded replay/quarantine; missing sau restore không auto repost; listener/queue độc lập WebView |
| Admin | Exact004 metadata, Ops sessions/outcome store riêng; safe retry/disable request, không SELECT private quota/finance/coverage |
| Backend/workers | Implement CSV semantic parser, bounded getSyncState flags, frozen coverage pages/control version, J2 registry/lock/fence/quota; narrow grants theo profile |
| Assistant/Agent/forecast | Inherited capabilities/API vẫn giữ; persistent budgets/checkpoints/current auth; forecast chunk incomplete không complete run |

149 operations không thuộc hai schema sửa vẫn giữ shape/meaning003;151 paths dùng header revision004 nên không được nói client003 đã tương thích100%. Validation kế thừa dùng149×2 synthetic examples; modified2 và added2 có examples riêng. Đây là shape evidence, không là consumer callsite/runtime evidence. Source prototype đang hybrid1.1.0/2.0.0; không đổi label trong tài liệu để giả migrate source.
