# Đánh giá tổng quát FinWeave — 03/11/2026

## Kết luận

Chưa hoàn thành toàn bộ sản phẩm vận hành theo Scope/SRS v3. Dự án đã có bộ phân tích và thiết kế khá đầy đủ, giao diện demo, backend PostgreSQL có nghiệp vụ thực thi cục bộ, tích hợp user/admin đã kiểm với dữ liệu thử, APK và bản demo cloud. Phần còn lại tập trung vào tái lập bản bàn giao, Android/nguồn thật, nghiệm thu Agent, vận hành và nghiệm thu toàn hệ thống.

Nếu mục tiêu là đồ án phân tích và thiết kế hệ thống, dự án có nhiều đầu ra phù hợp để chuẩn bị nộp. Chưa có rubric của giảng viên trong phạm vi đối chiếu này nên không kết luận đã đáp ứng toàn bộ tiêu chí chấm điểm. Nếu mục tiêu là ứng dụng quản lý tài chính dùng thật theo phạm vi đã công bố thì chưa đủ điều kiện kết thúc.

## Bằng chứng kiểm mới trong lượt đánh giá

Môi trường: Windows, Node v24.22.1. Các kiểm tra dưới đây không cài lại thư viện, không khởi tạo/migrate/reset database đang dùng và không triển khai bản mới.

| Kiểm tra | Kết quả | Giới hạn |
|---|---|---|
| Backend TypeScript `tsc --noEmit` | PASS | Không thay thế kiểm thử database hoặc HTTP |
| Backend `node --test --test-concurrency=1 --test-reporter=dot tests/*.test.ts` | PASS, 69 dấu kết quả | Bộ kiểm thử đơn vị hiện có; không chạy lại toàn bộ PostgreSQL integration |
| Frontend TypeScript `tsc --noEmit` | FAIL trong môi trường hiện tại | Có lỗi phân giải kiểu của Playwright/TanStack và lỗi dây chuyền; chưa kết luận tất cả là lỗi logic ứng dụng |
| Frontend Vitest | Không khởi chạy được | Thiếu package `std-env`; bộ thư viện hiện tại chưa đủ để tái lập kiểm thử |
| Cloud demo `scripts/market.test.ts` | 7/7 PASS | Kiểm parser/đơn vị/sản phẩm/lỗi upstream bằng dữ liệu kiểm thử, không đo SLA nguồn thật |
| Cloud demo `scripts/check-market-pipeline.mjs` | 7 nhóm PASS | Pipeline trong môi trường kiểm, không phải browser/live-provider E2E |
| Đối chiếu hash source với manifest tích hợp BE-19 mới nhất đã tìm thấy | 247 tệp khớp; 0 tệp thay đổi hoặc thiếu | Chỉ phạm vi source trong manifest, không gồm toàn bộ thư viện đã cài hoặc hosted demo riêng |

Manifest được đối chiếu: [integration-1791889787541](evidence/be19/integration-1791889787541/manifest.json). Manifest tích hợp cũ được dẫn trong báo cáo BE-19 ngày 12/10 có 12 tệp khác hiện trạng; bản kiểm ngày 13/10 phía trên mới là bằng chứng gần hơn. Không dùng khác biệt với manifest cũ để kết luận source hiện tại chưa được kiểm.

Hồ sơ ngày 13/10 ghi 140/140 frontend unit, 67/67 mock browser và 13/13 HTTP/PostgreSQL integration PASS, không skipped/flaky ở hai bộ browser. Đây là kết quả lưu từ trước, không phải các bộ đã được chạy lại thành công hôm nay.

## Đánh giá từng phần

| Phần | Mức hoàn thành có bằng chứng | Việc còn thiếu |
|---|---|---|
| Phân tích, yêu cầu và kiến trúc | Có PRD/SRS, ca sử dụng, mô hình dữ liệu, API, thiết kế bảo mật và truy vết. Bộ tài liệu môn học có 50 ca chi tiết, 7 ca tổng quan và 11 hình | Chốt bộ tài liệu nộp theo rubric; đồng bộ trạng thái hiện hành; PlantUML chưa được render bằng chính engine PlantUML theo biên bản 28/10 |
| User/admin web | Có giao diện và tích hợp HTTP/PostgreSQL cục bộ; hồ sơ regression/integration tốt | Khôi phục khả năng cài và kiểm thử trên môi trường sạch; nghiệm thu các hành trình đầy đủ trên đúng bản bàn giao |
| Nghiệp vụ backend | Có sổ tiền, tài sản, nhập CSV, Review, Plan/Goal, dự báo, xác thực, queue và Ops chạy với dữ liệu thử | Chưa có nghiệm thu tổng hợp toàn bộ 41 AC trên ba giao diện; cấu hình runtime vẫn chỉ nhận `synthetic-local` |
| Demo cloud | Sites ghi nhận dự án active, phiên bản mới nhất 4; mã có Worker/D1 và adapter giá SSI/PNJ/BTMC | Đây là môi trường riêng với dữ liệu tài chính mẫu; không chứng minh backend PostgreSQL, collection Android hoặc Agent dùng thật đã hoàn thành |
| Android | Có APK pilot ký, collector/outbox/Keystore/worker và backend adapter; có build/JVM evidence | Device E2E mới nhất ghi `NOT_RUN_USER_CONFIRMED_NO_DEVICE`; cần kiểm đăng nhập/enrollment, notification thật, offline/reboot/retry, revoke và đồng bộ web–Android trên bản cuối |
| AI/Agent | Có runtime, tool gateway, giới hạn quyền/budget, deterministic evaluation; đã có model manifest Qwen/Ollama local và artifact thử model | Chưa thấy bộ nghiệm thu đầy đủ chất lượng Agent với model thật/người dùng; không dùng kiểm deterministic hoặc một lần gọi model thay thế lợi ích, độ đúng và trải nghiệm thực tế |
| Vận hành | Có nhiều diễn tập migration, backup/restore, fencing và kiểm synthetic | Off-host backup/witness/alert, secret custody, restore sau mất host, retention/erasure thực tế và UAT vẫn còn gate |

Nguồn: [scope](../product/scope.md), [bộ phân tích môn học](../course-analysis-2026-10-28/README.md), [BE-19](../frontend/be19-report.md), [APK](../../artifacts/android/README.md), [operations runtime](backend-operations-2026-10-13.md), [real gates](../operations/real-gates.md), [cloud demo](../../sites/finweave-demo/README.md).

## Những việc cần đóng trước khi gọi là hoàn tất

1. **Tái lập và đóng gói bản bàn giao.** Khôi phục đầy đủ dependencies từ lockfile, chạy typecheck/build user/admin/unit và các luồng browser quan trọng. Đóng băng đúng source đã kiểm. Git hiện có nhiều thay đổi chưa commit và nhiều tệp chưa được theo dõi; chưa có workflow trong `.github/workflows`. CI tự động là cải tiến hữu ích, còn khả năng tái lập bản bàn giao là yêu cầu thực tế trước khi chốt.
2. **Nghiệm thu Android và nguồn giao dịch.** Kiểm trọn chuỗi thông báo giao dịch → outbox → backend → Review/ledger → web; gồm chống trùng, mất mạng, khởi động lại, thu hồi quyền và khác biệt thiết bị. Pilot cài được hoặc parser test PASS chưa đủ. Nguồn VCB/ZaloPay cần mẫu giao dịch đã xác minh; giá thị trường thật ở cloud không thay bằng chứng này.
3. **Nghiệm thu Agent theo đúng cam kết.** Đo độ đúng tiếng Việt, hiểu yêu cầu/sửa draft, lỗi và timeout, giới hạn công cụ và lợi ích trước phương án manual + Engine trên model/phần cứng thực tế. Nếu bàn giao demo thì công bố rõ phần nào scripted/deterministic và phần nào inference thật.
4. **Đóng quan sát scheduler.** [Mẫu mới nhất 03/11](evidence/backend-async-observation/latest.json) ghi `sevenDayObservation=false`, 9 ngày có mẫu trong khoảng 24,38 ngày, khoảng trống lớn nhất 388,45 giờ và `dailyMissed=15`. Cần giải thích gaps và thu chuỗi quan sát đạt tiêu chí; thời gian lịch đã trôi qua không tự đóng yêu cầu 7 ngày liên tục.
5. **Nghiệm thu bảo mật và vận hành đúng môi trường đích.** Hoàn thiện các gate liên quan trong `real-gates.md`; đặc biệt bản sao ngoài host, khôi phục sau mất host, phân quyền/khóa, cảnh báo độc lập và chính sách xóa dữ liệu. Không yêu cầu mọi gate production nếu chỉ nộp bản demo, nhưng phải ghi đúng giới hạn.
6. **Chốt 41 AC và hồ sơ nghiệm thu.** Mỗi AC có trạng thái đạt/chưa đạt/không thuộc bản giao đã được thống nhất, luồng kiểm, kết quả trên đúng phiên bản và vấn đề còn mở. Có biên bản UAT của người dùng thay vì suy số lượng test bằng số yêu cầu đã hoàn thành.
7. **Đồng bộ tài liệu.** README, progress, SRS, backlog và các checklist đang giữ nhiều notice lịch sử như “APK chưa build”, “runtime chưa chạy”, “model chưa có” bên cạnh evidence mới. Giữ lịch sử trong phần riêng và đặt một bảng trạng thái hiện hành ở đầu bộ bàn giao. Cập nhật URL/version cloud và chỉ rõ backend demo khác backend nghiệp vụ.

## Giới hạn lượt đánh giá

Đã đọc cấu trúc, tài liệu, mã ở các điểm quyết định chế độ chạy, evidence và một số kết quả kiểm mới. Không kiểm từng dòng toàn bộ mã, không chạy lại tất cả database/browser/device suites, không thực hiện UAT và không kiểm độc lập toàn bộ thao tác trên site production. Sites xác nhận site active, nhưng công cụ đọc web không truy cập được endpoint health trong lượt này; không coi metadata active là kiểm tra sức khỏe runtime.

Chỉ tạo báo cáo đánh giá này; không sửa source ứng dụng, cấu hình bí mật, dữ liệu tài chính hoặc trạng thái phát hành.
