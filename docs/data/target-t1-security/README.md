# PostgreSQL security target — D1 tiếp nối ARCH-06

FW-PHYS-T1-SECURITY-003 · **EXPAND DESIGN / EXECUTABLE SQL NOT AUTHORED / NOT RUN**. Kế thừa [82-table auth target](../target-t1-auth/README.md), giữ nguyên package cũ. Counts/hash chính xác tại [revision](revision.json).

[Full model](target-model.json), [security delta](security-delta.json), [dictionary](data-dictionary.md), [security ERD delta](security-erd.mmd), [migration/permissions](migration-plan.md). ERD chỉ thể hiện control relation mới; full FK set vẫn ở model, không giả sơ đồ nhỏ là full ERD.

Thêm **recovery_delivery_state** để lưu mutable publication/receipt ACK ngoài journal append-only; **erasure_requests** để theo dõi parent/child active/backup purge. Các bảng này không là financial queue authority mới và không giữ payload finance/PII/free text. Stable recovery tokens/control epochs cho identities/workspaces/devices; workspace access_state và identity recovery_reset_required cho denial/locked restore; journal thêm scope/environment/signature fields.

Inherited baselineDeclaration/rules giữ lịch sử; targetRules/migration plan supersede checks cần thay ở cutover, không tự là DDL chạy được. [Security protocol](../../security/t1/backup-restore-erasure.md) định nghĩa state machine/canonical event/witness receipt. API002 wire giữ nguyên; [bundle](../../security/t1/implementation-bundle.json) pin thêm security/db revisions.
