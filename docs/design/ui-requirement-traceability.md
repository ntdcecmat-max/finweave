# UI traceability và tiêu chí bàn giao thiết kế

> **BE-19 — 12/10/2026:** [screen RTM](../frontend/be19-rtm.csv) và [scenario RTM](../frontend/be19-scenario-rtm.csv) bổ sung transport/source/evidence, giữ parent AC và inventory hiện có. [Báo cáo](../frontend/be19-report.md) phân biệt 13 real HTTP/PostgreSQL integration cases với 67 browser/140 unit regression synthetic. Android có build/44 JVM tests, native E2E **NOT RUN**; chưa chốt cả ba clients end-to-end.

DES-RTM-001 · v1.0 · 08/10/2026 · refinement của41 AC hệ thống; không tạo requirement sản phẩm mới.
[Catalogue](interface-catalogue.md), [SRS](../requirements/srs.md), [RTM hệ thống](../execution/realignment-traceability.md), [AI-SPEC](../product/ai-agent-specification.md), [acceptance operational](../testing/operational-acceptance-plan.md).

UI-U/UI-S/UI-M/UI-ADM/UI-AUTH là screen IDs; UI-AC refinement không thay41parent AC. Rà soát08/10: 67/67browser PASS; xem [raw](../execution/evidence/frontend-review-2026-10-08/acceptance-2/browser-results.json), [summary](../execution/evidence/frontend-review-2026-10-08/acceptance-2/acceptance-summary.json), [35lỗi đã điều tra](../execution/evidence/frontend-review-2026-10-08/acceptance-2/failure-investigation.json). Trạng thái toàn bộ v3 **PARTIAL**, native/API/security/UAT chưa nghiệm thu. Không lấy test ID hoặc mock screenshot thay gate ngoài UI.

## 1. Requirement cấp hệ thống → thiết kế → checks

Tên rút gọn trong cột đầu mang prefix REQ-.
| Requirement / parent AC | Màn/luồng chính | UI checks |
| --- | --- | --- |
| SET-01/BANK-01/CASH-01 / AC-01…03 | UI-U-17/UI-S-01, UX-FL-01 | UI-AC-01/02/26 |
| STOCK-01/GOLD-01 / AC-04/05 | UI-U-03/UI-S-02, UX-FL-12 | UI-AC-03/19 |
| INPUT-01 / AC-06 | UI-U-13/UI-S-09/10, UX-FL-03 | UI-AC-04/25 |
| INPUT-02 / AC-07 | UI-U-13/19/UI-M-01…05, UX-FL-10/11 | UI-AC-05/15/16 |
| MONEY-01/CASH-02/HOLD-01 / AC-08…10 | UI-U-03…07/UI-S-01…04, UX-FL-02/05/12 | UI-AC-02/03/07 |
| TXN-01/02, TRACK-01/02 / AC-11…14 | UI-U-01…07/UI-S-01…03, UX-FL-02/04 | UI-AC-02/06/18 |
| REVIEW-01/02 / AC-15/16 | UI-U-14/UI-S-04/06, UX-FL-05 | UI-AC-07/17/22 |
| UX-01/DEMO-01/NAV-01 / AC-17…19 | User shell/UI-U-17/UI-S-08, UX-FL-01/04/09 | UI-AC-01/12/26 |
| REPORT-01/INSIGHT-01 / AC-20/21 | UI-U-01/02, UX-FL-04 | UI-AC-06/22 |
| PLAN-01/02 / AC-22/23 | UI-U-08…10, UX-FL-06 | UI-AC-08/21/24 |
| GOAL-01/02 / AC-24/25 | UI-U-11, UX-FL-07 | UI-AC-09/21/24 |
| SIM-01 / AC-26 | UI-U-12/UI-S-05, UX-FL-08/14 | UI-AC-10/21 |
| AI-01/02 / AC-27/28 | UI-U-15/16/UI-S-08, UX-FL-09 | UI-AC-11/12/23/26 |
| SURFACE-01 / AC-29 | User/Android/admin/auth, UX-FL-01/11/16 | UI-AC-01/18/20 |
| APK-01 / AC-30 | UI-M-04…06, UX-FL-10/11 | UI-AC-14/16/26 |
| CAPTURE-01 / AC-31 | UI-M-01…05/UI-U-18/19, UX-FL-10/11 | UI-AC-05/13/15 |
| INGEST-03 / AC-32 | UI-S-04/10/UI-M-05, UX-FL-05/11 | UI-AC-05/17 |
| SYNC-01 / AC-33 | UI-U-18/UI-M-05, UX-FL-11 | UI-AC-13/16/18 |
| STOCK-02 / AC-34 | UI-U-03/UI-S-02, UX-FL-12 | UI-AC-03/19 |
| GOLD-02 / AC-35 | UI-U-03/UI-S-02, UX-FL-12 | UI-AC-03/19 |
| PRICE-01 / AC-36 | UI-U-03/19/UI-S-10, UX-FL-13 | UI-AC-19 |
| ADMIN-01 / AC-37 | UI-ADM-01…07, UX-FL-16 | UI-AC-20 |
| AGENT-01 / AC-38 | UI-U-14/15/UI-S-07, UX-FL-15 | UI-AC-22/23 |
| AGENT-02 / AC-39 | UI-U-08/11/UI-S-05…07, UX-FL-14/15 | UI-AC-21/22/24 |
| AGENT-03 / AC-40 | UI-U-15/16/UI-S-05…08, UX-FL-09/14/15 | UI-AC-11/23/24 |
| RECOVERY-01 / AC-41 | UI-S-06/09/10/UI-M-05, UX-FL-03/11/14 | UI-AC-16/24/25 |

NFR-01…15 kế thừa từ SRS/archive và test plan, không đổi ngưỡng production bằng UI. NFR-16→UI-AC-05/13/15; NFR-17→18; NFR-18→19/23; NFR-19→05/16/26; NFR-20→01/13/20/26; NFR-21→25. Anti-Ops NFR-07/08/security PoC vẫn gate riêng, masked screenshot/admin403 không đủ chứng minh.

## 2. AI refinement → UI

| Mã AI | Hành vi/màn/component | Checks |
| --- | --- | --- |
| AI-FR-001/002/003 | Q&A, giải thích số/Plan/Goal/simulation; UI-U-15, CMP-12 | UI-AC-11 |
| AI-FR-004/005/006/007 | Shared conversation/history/captured context/evidence; UI-U-15/16/UI-S-08, CMP-03/12 | UI-AC-11/12 |
| AI-FR-008 | Mascot controls/motion/keyboard; UI-S-08, CMP-17 | UI-AC-12/26 |
| AI-FR-009 | Simple read vs multi-step mode honesty; UI-U-15/UI-S-07 | UI-AC-11/23 |
| AI-FR-010/011/012 | Clarify/GoalDraft/PlanDraft+links; UI-S-05/07, CMP-13/14 | UI-AC-21 |
| AI-FR-013/014/015 | Engine comparison/edit/owner atomic confirm; UI-S-05/06, CMP-14/15/16 | UI-AC-21/24 |
| AI-FR-016 | Actual amendment; UI-U-08/UI-S-05 | UI-AC-22/24 |
| AI-FR-017/018 | Investigation/Review suggestions; UI-U-14/15/UI-S-04/07 | UI-AC-22 |
| AI-FR-019/020/021 | Run/cancel/stale/errors/quota; UI-S-05…08, CMP-13/16 | UI-AC-23/24 |
| AI-FR-022/023/024 | Plan/Goals entry, rights, manual fallback; UI-U-08/11/15 | UI-AC-01/21/23/24 |
| AI-NFR-001 | Engine numbers/evidence/snapshot | UI-AC-10/11/21/22 |
| AI-NFR-002 | Privacy/masking/provider boundary | UI-AC-26 và security/model evaluation riêng |
| AI-NFR-003/004 | Authorization/injection | UI-AC-01/20/23; cần API/tool negative tests ngoài UI |
| AI-NFR-005/006 | Budget/cost/provider limits | UI-AC-23 |
| AI-NFR-007 | Accessibility/motion | UI-AC-12/26, AX-01…16 |
| AI-NFR-008 | Eval/regression | UI-AC-11/21/22/23; full AI eval ở acceptance plan, chưa chạy |

## 3. Kịch bản acceptance UI

Fixtures là synthetic, không phải giá thị trường. Mỗi case chạy happy + empty/loading/error/permission khi áp dụng, desktop/mobile và privacy; không chỉ chụp màn ban đầu.
| ID | Thao tác và kết quả cần kiểm |
| --- | --- |
| UI-AC-01 | Auth login/challenge/recovery/expired/denied/returnTo; không fetch finance trước auth. Logout/user switch clear cache/chat/draft; production không có Reset/fault demo; hidden menu không thay rights |
| UI-AC-02 | Opening, income/expense/transfer/fee/refund/count/correction/post/category; preview→confirm đúng effects/history, no optimistic money, cancel no effects; posted correction immutable |
| UI-AC-03 | Stock chỉ mã+lượng, ticker mơ hồ phải chọn; gold profile confirmed rồi số chỉ; zero quantity hợp lệ, missing cost/price không0; unit/product/purity/side mismatch bị chặn |
| UI-AC-04 | CSV template/map/invalid/duplicate/selected rows/confirm/poll, cancel no posting, input sửa invalidate preview, quá limit production rõ; template error giữ manual draft |
| UI-AC-05 | Notification allowlist, OTP/app ngoài nguồn/redacted/unknown/multi-account; unsupported/manualCSV fallback; không raw/secret cloud/log/LLM, invalid vào Review |
| UI-AC-06 | Period/scope/chart/table/formula/evidence/drill/Back và gross/refund/net; thiếu baseline/price không fake chart/total/trend; same snapshot, transfer scope không expense |
| UI-AC-07 | Tất cả case matrix cash/transfer/duplicate/refund/category/pending/quality/invalid/account ambiguity/gap; only eligible resolution, preview/version/reason, defer giữ trạng thái |
| UI-AC-08 | Manual Plan/investment recurrence/date/horizon, archive/history và link/unlink actual; no actual money/trade, versions đúng |
| UI-AC-09 | Manual Goal target/contribution/allocate/release/achieve/archive; capacity aggregate, planned income không funding, không double cash |
| UI-AC-10 | Save/consume/invest Engine scenarios cùng baseline/assumptions, infeasible/unknown/stale rõ, no actual write |
| UI-AC-11 | Q&A tiền/asset/Tx/Plan/Goal/simulation không cần Agent; evidence/drill/captured context; new/select/history paging/loadmore/latest reply, lỗi giữ retry |
| UI-AC-12 | Năm mascot entry/panel/full/history cùng conversation; nav khi pending không đổi result context; drag keyboard/collapse/restore/pause/static fallback/reduced motion, không che actions hoặc celebrate lỗi/history |
| UI-AC-13 | Web device status last-reported không giả OS live; revoke đúng owner, upload blocked, đã-sync history giữ; browser users vẫn manual/CSV/price/Plan |
| UI-AC-14 | Signed APK cài/update giữ binding đúng, bundled assets, support matrix và signing metadata; source chưa artifact không download giả; real device không chỉ emulator |
| UI-AC-15 | Native disclosure→consent→OS handoff→return recheck→allowlist→binding→test; deny/revoke/restricted/unsupported/unknown không fake granted/supported; skip hoạt động |
| UI-AC-16 | Offline3events→restart→online queue→ACK; UI đóng/screenoff/reboot/OEMgap, retention7ngày/1.000items pause/quarantine/retry/delete warning; userA queue không gửi bằng B |
| UI-AC-17 | Retry10lần/timeout sau commit, updates/group summary, hai giao dịch thật cùng amount,2devices+CSV overlap; không double-post/false merge; receipt ACK khác posted |
| UI-AC-18 | Web/mobile cùng owner foreground refresh về currentVersion; old response không overwrite; lastSeen/lastAck/gaps đúng; đo NFR-17 riêng, không hứa instant background |
| UI-AC-19 | Daily client tắt vẫn chạy; manual/daily coalesced, 429/partial/timeout/holiday giữ last-good/asOf; fixture100×25.000→2.500.000, giá26.000→2.600.000; gold2chỉ×8.000.000→16.000.000; cash/quantity/income không đổi |
| UI-AC-20 | Admin mọi màn metadata-only, user→admin/admin→finance403 kể cả ID tamper; safe retry/disable reason+version+audit, timeout replay không double-post, không finance/raw/prompt trong response/log/DOM |
| UI-AC-21 | Goal-first và Plan-first→clarify constraints→linked draft→Engine compare→edit chat/form→preview→owner confirm atomic IDs; manual flow còn; draft/run completed không tự active |
| UI-AC-22 | Actual replan/investigation branching từ evidence/coverage/Review; case sạch không bịa lỗi, thiếu evidence nói chưa biết; amendment giữ reserve/history; không actual write hoặc auto-review resolution |
| UI-AC-23 | Run queued/reading/awaiting/simulating/draft/partial/error/cancel; failed cancel retry,8tools/60sactive/2clarification pause,quota/offline/injection/denied đúng; manual handoff, không paid fallback |
| UI-AC-24 | Concurrent draft edit/snapshot update/expired preview/409/confirm repeat/timeout sau commit; keep draft, recompute+repreview, same key replay atomic, không duplicate Goal/Plan/link/allocation |
| UI-AC-25 | Crash trước/sau commit, restore drill, source/job receipts và outbox còn truy vết; UI không fake recovery complete; uninstall chưaACK có cảnh báo; recovery infra cần evidence ngoài UI |
| UI-AC-26 | AX-01…16: keyboard/focus/dialog/errors/contrast/chart bảng/mask DOM+accessibility, zoom/textscale,360/390/1440; Android TalkBack/insets/Back, admin semantic tables; không claim WCAG/UAT chỉ từ axe |

## 4. Bàn giao sang wireframe/build

Để bàn giao wireframe: mỗi screen có hierarchy/input/actions/states/quyền, flow happy và lỗi, components và REQ mapping. Để bàn giao build: mockups responsive đã review, schema v2/examples/mock và native proof đủ; mọi field/enum/limit dùng một source contract. Để release: chạy UI-AC và parent AC/NFR/evals/security/native/restore, ghi evidence thật, PO/UAT review. Chưa có các kết quả đó trong lượt tài liệu này.

## 5. Trạng thái kiểm chứng frontend 08/10/2026

`CHECKED_SUBSET` chỉ những thao tác ghi ở cột thứ ba, khi các ca liên kết PASS trong raw; không PASS cả yêu cầu UI-AC. `NOT_RUN_NATIVE` vẫn chưa native/runtime evidence. Test prefix gom nhiều ca có cùng tiền tố; mỗi ca hiện rõ ở raw JSON.

| UI-AC | Browser checks | Phần đã thực thi synthetic | Phần chưa kiểm chứng | Trạng thái v3 |
|---|---|---|---|---|
| UI-AC-01 | AUTH-UI,N01,OP07 | Auth/session synthetic; không finance trước xác minh | Auth provider/role/collector logout production | CHECKED_SUBSET |
| UI-AC-02 | B01,B03,B06,N01 | Nhập/preview/cancel/correction/cash/transfer | Backend atomic/concurrency | CHECKED_SUBSET |
| UI-AC-03 | B01,B05,B14,OP01 | Catalog/sàn/profile/quantity/FX | Providers và tất cả compatibility edge states | CHECKED_SUBSET |
| UI-AC-04 | B04,N03,N05,S6-E05 | CSV staging/mapping/selected subset/replay | Production limits/template recovery toàn bộ | CHECKED_SUBSET |
| UI-AC-05 | OP02 | Allowlist explicit, unsupported disabled, thiếu amount→Review synthetic | OTP/raw/real multi-account/2devices native parser | CHECKED_SUBSET |
| UI-AC-06 | B02,B12,N07 | Period/scope/chart/table/drill/filter context | Đồng bộ backend và nguồn lịch sử thật | CHECKED_SUBSET |
| UI-AC-07 | B03,B04,B06,B20,OP02 | Các nhánh Review kế thừa và receipt thiếu thông tin | Ma trận gap/account ambiguity/native đầy đủ | CHECKED_SUBSET |
| UI-AC-08 | B07,B12 | Manual Plan/investment/link actual; remaining qua logical API, overspend trên UI | Đủ recurrence/archive/unlink states UI v3 chưa exhaustively rerun | CHECKED_SUBSET |
| UI-AC-09 | B08,B13,B20 | Target/lịch góp/backing/over-allocation/shortfall | Release/achieve/archive mỗi trạng thái chưa đủ browser matrix | CHECKED_SUBSET |
| UI-AC-10 | B09,S6-E11,OP03 | Save/consume/invest/no actual write/compare draft | Market calibration và stale/unknown mọi mode | CHECKED_SUBSET |
| UI-AC-11 | B10,N04,N06,S6-E11 | Q&A/history/paging/captured tool/classification | LLM/provider eval | CHECKED_SUBSET |
| UI-AC-12 | B10,B11,B13,PET | Shared panel/history/motion/drag/focus | TalkBack/native Back | CHECKED_SUBSET |
| UI-AC-13 | OP02,OP07 | Last-reported UI, revoke/bind receipt giữ lịch sử | Upload permission thật/device reporting | CHECKED_SUBSET |
| UI-AC-14 | OP07 | UI nói rõ chưa có APK, không fake download | Toàn bộ signed install/update/real device NOT RUN | NOT_RUN_NATIVE |
| UI-AC-15 | OP02,OP07 | Wizard consent/allowlist/binding minh họa | OS permission/native capture NOT RUN | NOT_RUN_NATIVE |
| UI-AC-16 | OP02,OP07 | UI nói rõ chưa native queue; nút không khả dụng | Durable offline/restart/ACK/owner/OEM NOT RUN | NOT_RUN_NATIVE |
| UI-AC-17 | N03,S6-E03,OP02 | Import/event same-key replay và receipt≠posted | Native10retry/group summary/2devices overlap NOT RUN | CHECKED_SUBSET |
| UI-AC-18 | N01,N07,OP02 | UI refetch/context và timestamps fixture | Cross-client currentVersion/latency NFR17 NOT RUN | CHECKED_SUBSET |
| UI-AC-19 | B05,B14,OP01 | Partial/last-good giữ quantity/cash; compatible quotes | Daily scheduler/client tắt/holiday/429 provider NOT RUN | CHECKED_SUBSET |
| UI-AC-20 | OP06 | 7admin views/metadata DOM/retry lease guard/disable/reason/audit | Direct API cross-role/tamper/log/storage authorization NOT RUN | CHECKED_SUBSET |
| UI-AC-21 | OP03 | Goal-first & Plan-first constraints/linked draft/edit/compare/owner confirm | Chat revision/atomic server tất cả branches chưa đủ | CHECKED_SUBSET |
| UI-AC-22 | B04,OP02 | Evidence/Review cơ bản | Agent investigation clean/mixed/replan branching NOT RUN | NOT_RUN_AGENT_BRANCHING |
| UI-AC-23 | OP05,B10,S6-E07,S6-E09 | Agent cancel và Q&A quota/error/cancel | Agent8tools/60s/2clarifications/quota/injection/provider NOT RUN | CHECKED_SUBSET |
| UI-AC-24 | OP03,OP04,S6-E03 | Draft stale→recompute/repreview; double confirm; v1lost ACK | Draft lost ACK/concurrent edit/expired preview/API replay đầy đủ NOT RUN | CHECKED_SUBSET |
| UI-AC-25 | N03,OP02 | Job/receipt giữ trace trong phiên | Crash/restore/worker lease/native outbox NOT RUN | CHECKED_SUBSET |
| UI-AC-26 | B11,B12,B13,B21,AUTH-UI-07,PET,OP06 | Automated axe/responsive/focus/mask/motion selected states | Manual visual/screen reader/zoom/font/native NOT RUN | CHECKED_SUBSET |
