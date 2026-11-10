# CI, build và phát hành

## 1. Pipeline cùng source, tách bằng chứng

1. Chọn source immutable: commit sạch hoặc content-addressed archive của working tree đã review gồm untracked/lockfiles/config; HEAD một mình không đại diện source bẩn. Manifest liệt kê hashes và absent/deleted inputs, không tự phục hồi file người dùng xóa. Kế thừa r1/r2 theo link, không ghi lại snapshot.
2. Pin Node/package manager/PostgreSQL16/client tools, dependency lock, containers per-platform digest, Android SDK/Gradle/JDK/AGP/Capacitor compatible patch, signing channel. Không `latest`/tag mutable. Exact pins chưa có là BLOCKED build release, không bịa digest.
3. Isolated synthetic runner: artifact/schema/link validation, type/lint/build user+admin/backend, Engine oracle, SQL clean/upgrade/grants/concurrency/fault, strict API005 contract/consumer mapping, browser regression, privacy/egress and supply-chain checks. NOT RUN không đổi thành PASS vì job chưa viết. Existing67/131frontend là historical scoped evidence, không số test bắt buộc cố định.
4. Build một lần từ source này; hash user/admin assets/backend per-platform images/APK/migration files/policies; inventory third-party components/licenses và reproducibility differences. Đừng build lại lúc deploy rồi coi là artifact đã test. Signed release manifest bằng approved standard tool, release signing custody tách CI untrusted và APK signer; exact signing tool/key chưa chọn, không crypto tự viết.
5. Chạy integration/UAT trên đúng artifact và môi trường; sanitize logs, no raw finance/screenshots/secrets uploaded. Failure blocks promotion, giữ bằng chứng thất bại. Required check absent/cancelled/skipped không PASS; branch protection nếu dùng hosted cần kiểm khả dụng, local checklist vẫn bắt buộc.
6. Operator verified manifest/key-trust + capability compatibility + backup/witness preflight; maintenance release theo runbook. Không tự commit/push/deploy từ tài liệu này.

## 2. CI không có quyền finance

Local là baseline không phát sinh phí dịch vụ CI. Hosted optional: kiểm quota/minutes/artifact/cache retention/budget 0 và dừng trước overage; không cam kết GitHub private/free vô hạn. Không dùng finance host làm self-hosted runner. Untrusted PR không secrets, write token, production network, Docker daemon hoặc privileged publish/signing; không dùng pull_request_target checkout untrusted code rồi chạy với secrets. Permissions tối thiểu, actions full commit SHA và review upstream; lockfile digest không chứng minh dependency an toàn.

## 3. Clients và APK

API005 exact + schemas checksum; strict consumer accepts đúng revision, không hybrid fallback production. Native bridge003 exact; older APK: report incompatible/update path bằng envelope đã thỏa thuận, không tự chuyển token/profile hoặc ACK dữ liệu chưa lưu. Server phải giữ compatibility handler có quyền đúng cho installed releases nếu đã có real users; hiện chưa có release thật nên baseline005/003. Sunset collector cần consent/status/queue safe export or quarantine, không bỏ offline receipts để lên version.

APK build/sign/verify/install/update/data continuity theo [ARCH10](../android/apk-release.md); signing key offline/custody, no debug, bundled assets, HTTPS verified. User tải HTTPS artifact với package/version/certificate/hash/release metadata, Android xác minh signer; không Android auto-installer vượt OS. Metadata/release artifact integrity không thay runtime security/UAT.

[GitHub secure use](https://docs.github.com/en/actions/reference/security/secure-use), [Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions). Không tạo workflow đang hoạt động hoặc gọi hosted runner trong ARCH13.
## Lịch, inventory và thứ tự tái tạo hồ sơ


Host tick60s chỉ enqueue/due scan theo J2; daily price18:00 Asia/Ho_Chi_Minh do business scheduler kiểm occurrence. Backup candidate12h, custodian kiểm retention hằng ngày và purge trong24h; các lịch này cần runner, lock, heartbeat và diễn tập. `Persistent=true` của systemd chỉ áp dụng `OnCalendar` và kích hoạt bù khi bị lỡ; không replay từng occurrence và không chứng minh công việc đã hoàn thành. [systemd timer source](https://github.com/systemd/systemd/blob/main/man/systemd.timer.xml). I0 Windows dùng harness tương đương trước khi kiểm Linux units thật.

Infrastructure journal/maintenance state có schema/grants riêng cần DDL đã review và inventory deployment ngoài87 bảng domain. Không tạo bảng/runtime trong task tài liệu này. Public ingress/readiness phải tôn trọng state đó; restart process không tự mở maintenance/recovery gate. Logs chỉ dùng releaseId/operation enums từ registry tin cậy, không lấy chuỗi người dùng làm label để né allowlist.

Tái tạo artifact thiết kế theo thứ tự: `build_arch13_operations.py` → `build_arch13_validation_inputs.py` → `polish_arch13_documents.py` → hàm `bundle()` của builder → `validate_and_seal_arch13.py`. Đây là công cụ author/validate tài liệu, không pipeline CI/deploy đang chạy. Không chạy lại generator gói ARCH cũ để sửa evidence lịch sử.
