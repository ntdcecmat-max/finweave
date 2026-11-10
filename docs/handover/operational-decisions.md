> **ARCH-13 hiện hành — 09/10/2026:** [Operations](../operations/README.md) / [ADR020](../architecture/adr/ADR-020-local-first-operations-and-fenced-releases.md). API005 / DB005 / native003 giữ nguyên; local-first CI, release có bảo trì, backup/witness/alerts ngoài host. **DESIGN SPECIFIED; runtime/SQL/release/restore NOT RUN; REAL chưa bật.** Các notice revision cũ bên dưới là lịch sử; source/policy đích theo [bundle](../operations/implementation-bundle.json).

> **ARCH-12 hiện hành — 09/10/2026:** [Agent LLD](../agent/README.md) và [ADR019](../architecture/adr/ADR-019-bounded-agent-runtime-and-grounded-planning.md). Current **[API005](../contracts/v2-t1-r5/README.md) / DB005 / native bridge003**, [bundle/hash](../agent/implementation-bundle.json); Assistant mode/counter output delta, request/roles unchanged. **Design SPECIFIED; model disabled; runtime/evals NOT RUN.** Kế thừa AI-SPEC và các gói ARCH06–11 bằng explicit binding, không sửa historical packages/frontend.

> **ARCH-11 hiện hành — 09/10/2026:** [Sources](../sources/README.md), [ADR018](../architecture/adr/ADR-018-verified-source-profiles-and-market-entitlements.md) và [bundle pin](../sources/implementation-bundle.json). Chốt source profile/normalization/rights/consumer mapping; API004/DB005/bridge2 giữ nguyên. **Design SPECIFIED; REAL SOURCES NOT ACTIVATED; runtime NOT RUN.** ARCH11 làm rõ nguồn/binding/Review; notes ARCH05…10 là base và lịch sử, không evidence live support.

# Nguồn, môi trường, quota và quyết định vận hành

Rà nguồn chính thức08/10/2026 (Asia/Saigon); desk review, không signup/probe/provider call/deploy. Các hạn mức là theo tài liệu công khai, không entitlement của tài khoản FinWeave. **ARCH-03 đã chọn I0 local + I1 Oracle Always Free VM có điều kiện** tại [ADR-010](../architecture/adr/ADR-010-local-and-conditional-free-cloud.md), kế thừa S1 + P2/T1. [Topology](../architecture/deployment-topology.md), [environments](../architecture/environment-matrix.md) và [cost](../product/cost-model.md) thay candidate cloud cũ. Account/quota/resources/restore chưa kiểm; các lựa chọn provider/model thật không ngầm được duyệt.

| Lựa chọn | Đề xuất cụ thể và fallback | Quota/cost/overage | Trạng thái |
| --- | --- | --- | --- |
| Local/backend/PG | **S1 + P2 đã chọn** tại [ADR-009](../architecture/adr/ADR-009-fastify-and-isolated-processes.md): Fastify TypeScript modular backend, user/device và Ops API processes riêng, worker profiles/quyền riêng + PostgreSQL16+ loopback, durable PG jobs; scripted sources/Assistant. Nếu chưa có PG, chỉ review SQL và mocks; không nhận migration PASS | External spend0; 10 synthetic workspaces, tối đa100 holdings/workspace,1000 CSV rows/preview,100 selected/job,50 notifications/256KiB batch là caps thử nghiệm, không capacity đã đo | **Chốt baseline**; backend/DB chưa triển khai |
| Cloud synthetic compute | **I1 Oracle Always Free VM**: Linux ARM64, containers/Compose; user API/Ops API/worker profiles riêng, không một paid server mỗi process. Không cấp được máy thì I0 | Quota/account/shape/region thực chưa kiểm; capacity/reclaim có rủi ro. Mục tiêu rent0 trong quota; không tự PAYG/I2/I3 hoặc tạo tải giả | **Owner chọn hướng**, chưa provision/benchmark |
| Cloud synthetic DB | PostgreSQL self-host trên VM, persistent volume/private network, separate roles/pools; backup ngoài host | Disk/RAM/connection budget theo tài nguyên thực; không quota500MB của Supabase làm giới hạn mới. Alert/admission control sau đo; không xóa ledger để tiết kiệm | **Owner chọn hướng**, migrations/roles/restore NOT RUN |
| Static user/admin/APK | Hai builds qua reverse proxy HTTPS, user/API và admin/Ops origins riêng; signed APK release path | Transfer/storage trong quota host; DNS/hostname/TLS chưa kiểm, không mặc định Vercel Hobby hoặc mua domain | **Owner chọn hướng**, chưa endpoint/release |
| Scheduler | Host timer enqueue durable source/entitlement/date job; daily18:00+07 là cấu hình đích, startup/overdue catch-up; worker thực thi ngoài HTTP | Host chết thì lịch dừng; lease/retry/fence/cooldown/polling chi tiết ARCH-09. Alert window và dispatch cadence cần đo; không browser timer hoặc Supabase pg_net wake baseline | **Hướng chốt**, cần PoC7 ngày trước claim daily reliable |
| Backup/monitor | Encrypted off-host export hằng ngày,7 daily+4 weekly, restore DB sạch; file/signing/keys backup riêng và alert độc lập host | Destination/quota/availability còn cần kiểm; máy cá nhân tắt thì báo overdue. RPO24h/RTO1ngày chưa đo. Retention chi tiết ARCH-07/13; metadata-only logs | **Hướng chốt**, chưa destination/restore evidence |
| Cổ phiếu VN | SSI FastConnect **V3 read-only** là ứng viên đầu tiên; không dùng V2 làm adapter mới. Synthetic/manual vẫn baseline | SSI FAQ09/10 ghi hiện không phí API và cần tài khoản SSI; quota thực/rights SaaS/cache/history/scale/time chưa xác minh. Keys để trống, external calls0; không trading hoặc tự đăng ký | **Cần entitlement + PoC**, chưa live supported |
| Vàng | PNJ public price board là nguồn đối chiếu ứng viên cho nhẫn9999; SJC product profile riêng, không lấy PNJ ring thay SJC. Fallback owner-confirmed manual quote đúng product/brand/region/side/chi/time | Trang giá công bố không chứng minh public API hoặc quyền automation/redistribute. Chưa có quota/license/chi phí API xác nhận; no scraping baseline. Định giá tài sản dùng buy side như lựa chọn khuyến nghị, owner xác nhận profile rõ | **Cần quyền nguồn/PoC**; synthetic/manual baseline chốt |
| Collector đầu tiên | Khuyến nghị shortlist VCB Digibank + MoMo nếu người dùng đang dùng; trước đó test.finweave.bank/wallet synthetic packages. Nếu không đúng app dùng, thay shortlist theo người dùng, không tốn công parser sai nguồn | Chưa source package/appVersion/template/OEM samples hợp lệ; support=false với app thật cho tới test matrix. Không dùng OTP/raw thông báo làm fixture cloud; manual/CSV fallback | **Cần người dùng chọn**, native/source PoC chưa chạy |
| AI | Scripted synthetic chốt. Candidate local Ollama + Qwen3-4B (pin model/license/digest lúc PoC) để so sánh30 held-out cases theo AI-SPEC; fallback single-tool rules/manual planner | Local inference không hóa đơn API nhưng có RAM/CPU/điện; chưa benchmark máy này.8 calls/60s active/2 clarification,10 runs/workspace/day và50 global/day là cap local thử; quota hết pause, không cloud/paid fallback. Local model host thấy plaintext prompt, phù hợp boundary T1 nếu được chọn/kiểm; external model cần review egress riêng | **Baseline scripted chốt; local model cần PoC**, không tải/chạy model trong lượt này |
| Real pilot/production | **A + T1 / I0 + I1 đã chọn** tại ADR-008/010; Oracle VM pilot có điều kiện; runtime/DBA/key operators được tin, app-admin chỉ metadata | Không yêu cầu enclave; không HA/uptime hoặc tổng phí0 guarantee. Budget bên ngoài vẫn0, chưa provision/paid resources hoặc cho phép real data. Real cần host/backup/roles tách staging | **Hướng chốt; SEC-REAL-T1 chưa kiểm**, backend/native/source/model/UAT/restore gates còn mở |

Nguồn chính thức và so sánh cloud limits ngày08/10 nằm trong [ARCH-03 options](../architecture/ARCH-03-options.md): [Oracle Always Free resources](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm), [Free Tier FAQ](https://www.oracle.com/cloud/free/faq/). Hạn mức public chưa phải quota thực được cấp. Render/Supabase/Vercel/Cron/pg_net là candidate cũ được thay bởi ADR-010; caps ứng dụng là thiết kế riêng cần measurement, không vendor guarantee.

Nguồn thị trường cập nhật09/10: [SSI V3 overview](https://developers.ssi.com.vn/docs/faq/service-overview), [V2→V3](https://developers.ssi.com.vn/docs/faq/v2-to-v3-migration) và [research sources](../sources/research-sources.json). V2 guide là lịch sử; fee API hiện0 chưa là grant SaaS/retention. [PNJ](https://www.pnj.com.vn/blog/gia-vang/) công bố giá, không chứng minh public API/license. Không copy giá live làm fixtures.

Inference desk review: [Ollama API](https://docs.ollama.com/api/introduction) cho local serving; [Qwen3-4B official model card](https://huggingface.co/Qwen/Qwen3-4B) ghi model/license (Apache-2.0 tại ngày kiểm). Capability/model card không chứng minh tiếng Việt, tool accuracy, hardware latency hoặc privacy đáp ứng; phải pin model artifacts+license và eval trước chọn. Không có model/provider call với dữ liệu thật.

## Các quyết định cần chủ sản phẩm duyệt

1. **Đã chốt A + T1 và I0 + I1 ngày08/10/2026** — owner chấp nhận trusted runtime/DBA có khả năng đọc finance; app-admin vẫn không có quyền finance. NFR-07/08/security theo ADR-008, infrastructure theo ADR-010. Protected PoC/trần đề xuất1.000.000 VND cũ không bắt buộc và chưa được cấp. Oracle Always Free là hướng cloud, quota chưa kiểm; không auto paid fallback hoặc tạo bill.
2. **Ngân hàng/ví đúng người dùng đang dùng** — shortlist VCB Digibank/MoMo để chuẩn bị matrix; giữ synthetic nếu chưa chọn. Bằng chứng cần package/version+OS/OEM+consent+normalized sample tại owner device, không gửi raw notification lên cloud. Chọn app không đồng nghĩa hỗ trợ.
3. **Recovery auth T1 đã chốt thiết kế ARCH-06** — [identity protocol](../security/identity/identity-access-design.md): server-managed reset bằng email token15min, optional offline one-time recovery codes; reset revokes credentials/epochs, không recover Keystore/backup. App-admin không impersonate/reset owner. Second-device-only recovery chưa có API. Mail provider/implementation/key custody/checkpoint/restore/RPO/RTO còn gates ARCH-07/13; không real ready.
4. **Nguồn và hướng thương mại** — trước live market automation, owner xác nhận SSI/PNJ hoặc nguồn thay thế có entitlement/cache rights và hạn mức chi phí cụ thể. Không còn Hobby baseline; Oracle plan/terms và APK/model distribution vẫn phải kiểm đúng use case trước triển khai. Hiện budget bên ngoài vẫn0 và chưa tạo dịch vụ.

Những câu hỏi đã gửi trong chat là lựa chọn cho giai đoạn sau; không có câu trả lời không được coi là chấp thuận hạ bảo mật, chi tiền, nhận source real supported hoặc triển khai.

## ARCH-04 — D1 + J2 đã chốt

Owner chọn [D1 + J2 / ADR-011](../architecture/adr/ADR-011-evolving-schema-and-shared-jobs.md): PostgreSQL cùng transaction boundary, migrations tiếp nối004+, shared durable dispatch authority; per-profile roles, admin auth riêng, payload/history/cache/recovery tách lifecycle. [Target](../data/target-t1/README.md) và [migration/restore plan](../data/target-t1/migration-plan.md) có design, SQL/grants/upgrade/restore chưa chạy. Không thêm vendor/Redis/paid service. Backup cần independent latest revocation/deletion checkpoint, không chỉ journal trong DB đã restore. Queue package/auth mechanism/field contract tiếp ARCH-05/06/09.

## ARCH-07 — Thiết kế bảo mật và recovery đã chốt 09/10/2026

[ADR-014](../architecture/adr/ADR-014-t1-data-protection-and-recovery-witness.md) chọn secret files riêng trên storage mã hóa, pg_dump nhất quán → restic mã hóa ngoài host, process upload chỉ append, custodian prune riêng và recovery capsule mã hóa bằng age. Không thêm paid KMS/Vault cluster.

Witness độc lập lưu lệnh thu hồi/xóa dạng metadata tối thiểu. Chặn local trước; chỉ xác nhận hoàn tất an toàn cho recovery sau durable receipt. Restore chặn host cũ, kiểm head/chain mới nhất, áp dụng xóa trước đọc tài chính và vô hiệu hóa credentials cũ. Giữ 7 bản ngày / 4 bản tuần trong tuổi snapshot tối đa 34 ngày, prune dữ liệu không còn tham chiếu trong 24 giờ; deadline xóa mọi bản sao do server kiểm soát là 35 ngày từ yêu cầu gốc, có kiểm chứng.

Endpoint backup/witness, capacity, khóa, versions và runtime evidence chưa có. RPO/RTO chưa đo; T1 vẫn tin operator/root/DBA. Chưa cấp quyền chi tiền, bật dữ liệu thật hay deploy. Bộ 32 ca SEC và AUTH/native/source/Agent/UAT vẫn NOT RUN hoặc theo trạng thái bằng chứng riêng.

## ARCH-11 — Source integration handover

Cập nhật source desk review09/10: SSI FastConnect V3 là current candidate (V2 references lịch sử). Fee API hiện0 theo FAQ, rights SaaS/quota/scale/time thực chưa verified. VCB/MoMo candidate supported=false; source lựa chọn/app/device/entitlement chưa chốt.

[Source design](../sources/README.md) · [Acceptance32 NOT RUN](../sources/acceptance-plan.md) · [Báo cáo ARCH11](../architecture/ARCH-11-change-report.md).

## ARCH-12 — Agent runtime handover

Chốt orchestration design O1 typed TS/J2; local Ollama/Qwen3-4B candidate PoC chưa artifact pins/hardware/eval. Không hosted model/account/quota được chọn; gates/budget0 giữ. Source VCB/MoMo/SSI/PNJ/SJC chưa activate.

[Runtime design](../agent/README.md) · [Acceptance32 NOT RUN](../agent/acceptance-plan.md) · [Báo cáo ARCH12](../architecture/ARCH-12-change-report.md).

## ARCH-13 — Operations handover

Chọn CI local, release có bảo trì, giám sát tổng hợp và off-host recovery kế thừa. Endpoint/account/contact/quota/exact pins còn thiếu nên REAL bị chặn; không tự provision hoặc trả phí.

[Hồ sơ vận hành](../operations/README.md) · [Acceptance32 NOT RUN](../operations/acceptance-plan.md) · [Báo cáo](../architecture/ARCH-13-change-report.md).
