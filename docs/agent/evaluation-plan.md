# Đánh giá Agent có ích thật

**Evaluation DESIGN / NOT RUN.** [30cases](evaluation-cases.json):10Plan/Goals,10adjustment/investigation,10safety/failure. [12regression cases](regression-cases.json) giữ Q&A/chat/history/mascot/manual; không thay bằng Agent benchmark. Các cases đều giả, không chứa thông báo/giá/accounts thật. Không một completion/latency/quality PASS được suy ra từ static/model examples.

## Baselines công bằng

A: manual forms + deterministic Engine simulator + rule insights. B: single-tool assistant/router có cùng read facts. C: fixed workflows có branching/clarification/scenario templates hợp lý và cùng tools/Engine. C bổ sung để không thắng nhờ baseline cố tình yếu. So với strongest applicable baseline theo từng task và report cả ba; tool/data scope/constraints/timeouts như nhau. Human interaction count/time củaA cần đo thực riêng, không giả data từ code speed; compute latency/token/CPU khác operator time.

20 task cases đủ dữ liệu/expected clarification có rubric success/failure trước test;10safety cases riêng, không gộp để nâng completion%. No-data/infeasible case thành công khi kết luận đúng/không bịa, không nhất thiết tạo draft. Primary completion target≥80%; gain≥15percentage points completion **hoặc** giảm≥25%owner steps/elapsed task time, không giảm correctness/safety. Các thresholds kế thừa AI-NFR-008, là mục tiêu thử chưa measured/owner release approval. Report group breakdown, numerator/denominator, repeated runs, latency p50/p95/coldstart, calls/tokens/peakRAM/cost, failures/partial/cancel và confidence/uncertainty trên mẫu nhỏ; không claim30cases chứng minh an toàn tuyệt đối.

Financial facts phải khớp oracle Engine độc lập đã pin, classification/unknown/freshness/provenance đúng; không dùng model tự chấm factual money. Active/actual unauthorized writes/cross-tenant leak/rawsecret egress=0 observed là hard failure gate, không average away. LLM judge nếu dùng chỉ auxiliary explanation quality, không authority financial/security và cũng cần privacy/budget; chưa model judge được chọn.

## Held-out và reproducibility

30cases công khai này **không thật sự blind held-out** vì implementer đọc được. Trước real eval: freeze prompt/model/tool/Engine/runtime/decoder manifests; runner độc lập sinh ít nhất10instances mới với changed amounts/order/constraints/phrasing, store seed/data trong restricted evaluation scope, chỉ ghi digest/split metadata trước chạy. Không tune trên held-out, không dùng expected answers trong prompt, tách dev/retest/final sets. Nếu không tạo được held-out thì report public-development-only, không nhận release benefit PASS.

Randomness/provider decoding fixed khi được hỗ trợ nhưng không hứa byte-identical. Ít nhất3runs/case/model profile để lộ instability; cold/warm và stop/restart/resume/timeout riêng, full input/version refs reproducible. Artifact public repo chỉ sanitized cases/schema/results aggregate; prompts/thinking/raw financial values/secret model responses không nằm logs/evidence. Data licenses/retention T1 áp dụng cùng eval.

Không đạt benefit thì sửa/tune model/runtime/tools hoặc dùng deterministic/manual fallback trong cùng feature, giữ Agent use cases ở backlog. Không xóa Agent/Plan–Goals/history/mascot để đạt benchmark, không giả scripted outputs là model performance. REAL model vẫn disabled tới artifact pins, privacy/source rights, hardware/budgets và runtime/safety/benefit gates đạt.
