# T1 threat model — phạm vi và rủi ro

09/10/2026 · **DESIGN SPECIFIED / ALL RUNTIME TESTS NOT RUN**. [Register16threats](threat-register.csv), [SEC-01…32](acceptance-plan.md).

Assets: canonical ledger/history, accounts/holdings/quotes provenance, Plan–Goals/revisions/drafts/simulations, normalized receipts/imports/evidence, conversations/tool results, owner/admin credentials, native outbox/keys, release signatures, backups/key capsule, latest recovery deny stream. Integrity, confidentiality và khả năng xác định unknown/gaps đều cần bảo vệ; backup availability không tự là financial correctness.

Actors: malicious unauthenticated caller, owner A thử đọc B, compromised app-admin/session, hostile notification/CSV/provider/model text, compromised browser/APK/dependency, attacker có worker/API process credentials, người lấy disk/backup, lỗi vận hành/restore/scheduler. Trusted infrastructure/root/DBA/cloud-host/backup/key custodians thuộc T1 boundary nhưng phải có access control/audit; nếu các bên được tin cố ý lạm dụng quyền, hệ thống này không bảo đảm chống được. External mail/model/market providers không tự được nhập vào trusted boundary.

| Boundary/flow | Controls bắt buộc | Residual risk / không được claim |
| --- | --- | --- |
| Web owner→API→DB | HTTPS/cookie/CSRF/current owner+workspace+every nested object, response allowlist, transactional context | XSS có thể dùng phiên của chính owner dù HttpOnly; RLS không chống API process đã bị chiếm quyền |
| Admin→Ops | Origin/session/MFA/pool/DTO riêng; safe controls qua typed requests | Counts/timing có thể liên kết hoạt động; không show customer object IDs/private metadata để hỗ trợ debug |
| Android notifications→native→ingestion | Consent/allowlist/filter bank OTP+raw, encrypted owner-bound outbox, scoped collector credentials/fences | OS/OEM/app process compromise/capture gap; notification không là chứng từ ngân hàng đã xác thực độc lập |
| CSV/manual→Ledger/Review | Size/schema/provenance/decimal validation, dedupe/versions, parameterized SQL, no executable upload | Formula/script content và ambiguous statements cần quarantine; sai nguồn không tự đúng vì schema PASS |
| Market→holdings valuation | Approved source/license, strict unit/side/time, no private quantity/provider egress | Provider biết tickers/IP/auth account; quotes có thể stale/tampered, không được tự thay cash/holdings |
| Plan–Goals/Agent→tools | Scoped read/simulate/draft, cancellation/epoch checks, Engine oracle, owner confirm atomically | Prompt injection/model hallucination; không grant SQL/arbitraryHTTP/payment/trade/active-plan confirm |
| P2 workers→internal API/DB | mTLS+signature, nonce+profile capability+typed lease, narrow grants | Compromised profile có thể đọc các tenant trong phạm vi quyền thật của profile; không giả mỗi worker tự cô lập một tenant |
| Source host→backup/witness→restore | Encrypted off-host backup, append-only source upload, independent current signed deny stream, isolated restore | Destination outage/key loss/quota; no HA/zero-loss claim, no anti-trusted-operator rollback guarantee |

Abuse cases cụ thể: đổi workspaceId/nested evidence/session/device/run ID; fake bearer/CSRF/native proof; forged receipt digest; retry old token/lease/preview; SQL parameters in error logs; amount/prompt vào metric labels; model yêu cầu export ledger; provider URL SSRF; malicious snapshot future timestamps đánh lừa retention; restored old password/recovery code; old host còn chạy sau restore. Mỗi case phải có direct API/DB/device test tương ứng, không chỉ test nút UI.

Hardening direction: image/dependency pin+verification, non-root processes, read-only filesystem trừ bounded encrypted work dirs, no Docker socket/privileged containers, deny outbound by default, strict upload/body limits, no untrusted deserialization/remote scripts, patch cadence/integrity checks. Sandbox/process hardening không ngăn root có chủ quyền theo T1, không tự là exploit mitigation đã được chứng minh.

Trust/privacy acceptance: email-reset takeover risk từ ARCH-06 vẫn tồn tại; external inference mặc định denied; disk encryption bảo vệ offline material nhưng runtime đã unlock thấy plaintext; backup custodian có quyền decrypt được tin và không là app-admin. Không gọi pseudonymous IDs/digests là dữ liệu vô danh hoặc khẳng định tuân thủ pháp lý từ checklist này. Nếu thay yêu cầu sang anti-root-Ops hoặc pháp lý cụ thể, cần review riêng.
