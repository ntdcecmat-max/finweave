# ARCH-04 — Ghi nhận D1 + J2

08/10/2026 · **ACCEPTED DESIGN / DATABASE NOT EXECUTED**. [ADR-011](adr/ADR-011-evolving-schema-and-shared-jobs.md), [target package](../data/target-t1/README.md).

| Hồ sơ | Thay đổi và lý do |
| --- | --- |
| Options/agenda/ADR-011 | Ghi owner chọn D1 + J2, giữ D2/J1 làm lịch sử, chuyển tiếp ARCH-05 |
| Target model/dictionary/ERD/inventory | Kế thừa54 bảng, thêm16 structures; expand70 bảng/782 cột/141 FK; đủ nodes và tenant/global/late FK, không đoán relations từ tên |
| Migration plan |004+ expand/backfill/verify/cutover/contract; runner/checksum/restore; không sửa SQL001–003 |
| Invariants | Chặn append posted bundle, retarget account, revision collision; precision/locks/history/cache/payload/recovery rõ; Agent không actual |
| Permissions | Tách capabilities từng P2 profile và admin auth; không dùng broad fw_worker cho Agent/market/retention |
| API/storage delta | Dependency overlay đủ133 operations, chỉ ra field/auth/transport gaps cần ARCH-05; canonical API wire giữ nguyên |
| HLD/LLD/views/Stack/module/logical/security/handover/index/BR-44 | Trỏ target mới, phân biệt baseline và design; bỏ yêu cầu anti-root-Ops lỗi thời trong BR-44 theo T1 đã chọn |

16 structures mới phục vụ jobs3, planning3, cache1, import rows1, admin identity4, payload1, recovery1, Ops control1 và migration journal1. Không tự thêm feature hoặc giảm phạm vi: đây là storage phục vụ behavior và vận hành đã yêu cầu. Queue/auth implementation details còn chốt ARCH-06/09; final schema có thể điều chỉnh bằng reviewed delta.

[Validation](../execution/evidence/arch-04-d1-j2-2026-10-08/validation.json) kiểm structure, dependency coverage, links và [preservation](../execution/evidence/arch-04-d1-j2-2026-10-08/preservation.json). Source frontend, r1/r2, canonicalv2, physical baseline và research evidence được đối chiếu hash. Các kiểm tra này **không** là SQL/domain/auth/concurrency/restore PASS. Mọi finding có disposition thiết kế, chưa runtime closure. Không tạo baseline handover revision mới chỉ vì chốt architecture.

Lượt static validation đầu có1 lỗi ở bộ đếm dictionary: regex đếm cả dòng phân cách Markdown thành cột. Đã kiểm đủ70 headings/782 column rows và sửa bộ đếm; giữ [kết quả ban đầu](../execution/evidence/arch-04-d1-j2-2026-10-08/validation-initial.json), không diễn giải lỗi script này thành lỗi DB hoặc SQL test.
