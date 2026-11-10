# AI unification — kiểm tra documentation 08/10/2026

Phạm vi: hợp nhất đặc tả trợ lý cũ và Agent mới thành [AI-SPEC-001](../product/ai-agent-specification.md), đồng bộ SRS/PRD/scope/UC/rules/architecture/API/data/UI/RTM/test/register. Chỉ documentation, không chỉnh frontend.

Kết quả tự kiểm documentation:

| Kiểm tra | Kết quả |
| --- | --- |
| Functional definitions | Đủ AI-FR-001…024,24 mã, không thiếu/trùng definition |
| Quality definitions | Đủ AI-NFR-001…008,8 mã, không thiếu/trùng definition |
| System mapping | Giữ5 parent requirements REQ-AI-01/02, REQ-AGENT-01/02/03 và5 AC hệ thống tương ứng;32 mã chi tiết không tự tăng inventory41 AC SRS |
| Journeys | Đủ UC-AI-01…07; PG-01/02/03 và INV-01 giữ aliases |
| Content review | Hỏi–đáp/history/linh vật được giữ như product capability; cùng conversation/context/Engine; draft không actual/active confirmation; regression cũ và eval mới đều cần |
| Local links | Nguồn AI hợp nhất, archive index và verification report không có file link thiếu; anchors/network URLs không thuộc filesystem check |
| Frontend preservation |161 files cùng inventory/hash như trước lượt hợp nhất;0 đổi/mất,0 thêm |
| Snapshot | Pre-unification spec giữ lịch sử; SHA256 được ghi trong machine report |

[Machine report](evidence/ai-unification-checks.json). Không chạy build/tests/frontend/model vì chỉ chỉnh documentation. Suites OP-AI/runtime/evaluation: NOT RUN; không chuyển evidence synthetic lịch sử thành PASS cho đặc tả hợp nhất. Source/code changes có sẵn trước lượt này được giữ.
