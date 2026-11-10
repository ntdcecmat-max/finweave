"""Build source integration DESIGN artifacts. No network, vendor calls or runtime changes."""
from pathlib import Path
import hashlib, json

R = Path(__file__).resolve().parents[2]
D = R/'docs/sources'
E = R/'docs/execution/evidence/arch-11-sources-2026-10-09'
OLD = R/'docs/execution/evidence/arch-10-android-2026-10-09'

def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def put(p,x):
    p.parent.mkdir(parents=True,exist_ok=True)
    p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def md(name,s):
    p=D/name; p.parent.mkdir(parents=True,exist_ok=True)
    p.write_text(s.strip()+'\n',encoding='utf-8')

def preserve():
    p=E/'preservation-before.json'
    if p.exists():
        protected=json.loads(p.read_text(encoding='utf-8'))['files']
    else:
        old=json.loads((OLD/'preservation-before.json').read_text(encoding='utf-8'))['files']
        manifest=json.loads((OLD/'artifact-manifest.json').read_text(encoding='utf-8'))
        current=set(json.loads((OLD/'current-documents.json').read_text(encoding='utf-8'))['files'])
        assert all(sha(R/n)==h for n,h in old.items()),'Prior preservation drift'
        assert all(sha(R/n)==v['sha256'] for n,v in manifest['files'].items()),'ARCH10 artifact drift'
        protected=dict(old)
        protected.update({n:v['sha256'] for n,v in manifest['files'].items() if n not in current})
        protected[(OLD/'artifact-manifest.json').relative_to(R).as_posix()]=sha(OLD/'artifact-manifest.json')
        put(p,{'date':'2026-10-09','scope':'Prior frontend/baselines/API/DB/security/domain/async/Android packages and evidence; mutable current overview docs excluded','files':dict(sorted(protected.items()))})
    assert all((R/n).exists() and sha(R/n)==h for n,h in protected.items()),'Protected drift'

def main():
    preserve()
    md('README.md','''
# Sources — ARCH-11

**FW-SOURCES-DESIGN-001 · 09/10/2026 · DESIGN SPECIFIED / REAL SOURCES NOT ACTIVATED.**
Kế thừa toàn bộ feature hiện có: nhập tài sản, notification capture, manual/CSV, cập nhật giá hằng ngày/chủ động, Review/provenance, Plan–Goals/Agent và admin vận hành. Nguồn thật chưa chọn cuối cùng hoặc chưa có quyền/PoC không làm mất feature; adapter và acceptance vẫn phải xây đầy đủ, dùng synthetic để kiểm trước.

| Hồ sơ | Nội dung |
| --- | --- |
| [Options/decisions](source-options-and-decisions.md) | SSI V3, nguồn được cấp phép, Vnstock, PNJ/SJC, ngân hàng/ví và các thông tin còn thiếu |
| [Collector profiles](collector-profiles.md) | Package/signer/version/template, finality, account binding, duplicate/transfer và privacy |
| [Market normalization](market-normalization.md) | Exact money/unit/side/profile/time, catalogue, lịch phiên, correction/fallback |
| [Entitlements/egress](entitlements-and-egress.md) | Access/cache/display/redistribution/history/derived/LLM rights, secret/quota/revocation |
| [Contract/storage addendum](contract-storage-addendum.md) | API004/DB005, thiếu binding, wallet projection, versioned config và consumer mapping |
| [Operational policy](operational-policy.md) | Daily/manual, timeout/backoff, last-good, support lifecycle và phục hồi |
| [Acceptance](acceptance-plan.md) | 32 ca runtime chưa chạy, đầu vào và evidence phải có |

[Policy](source-policy.json) · [Provider registry](provider-registry.json) · [Profile schemas](profile-schemas.json) · [Storage/consumer mapping](contract-storage-map.json) · [Traceability](requirement-traceability.json) · [Research](research-sources.json) · [Bundle/hashes](implementation-bundle.json).

## Hiện trạng và precedence

Nguồn cơ sở chốt là synthetic + owner-confirmed manual/CSV. SSI FastConnect **V3 read-only market data** là ứng viên cổ phiếu ưu tiên để PoC; PNJ/SJC là bảng đối chiếu ứng viên vàng, **chưa chứng minh public API hay quyền tự động lấy/chia sẻ dữ liệu**. VCB Digibank/MoMo chỉ shortlist, chưa phải app owner đã chọn; signer/version/thiết bị/template thật còn thiếu, supported=false. Chi phí provider và quyền SaaS chưa được xác nhận; không suy ra total cost=0 từ API miễn phí.

API hiện hành vẫn [FW-API-T1-D1J2-004153ops/634schemas](../contracts/v2-t1-r4/README.md); PostgreSQL [FW-PHYS-T1-ASYNC-00587tables/1001columns](../data/target-t1-async/README.md); Android [bridge2/native design](../android/README.md). **SSI V3 là phiên bản upstream, không đổi FinWeave API v2.0.0.** Không sửa các gói đã niêm phong/r1/r2 hay runtime frontend. ARCH11 làm rõ giới hạn binding/Review và nguồn; ARCH06–10 tiếp tục quyết định auth/security/ledger/async/native. Nếu rights cần retention hoặc payload mới vượt hợp đồng hiện tại, dừng nguồn đó và tạo revision có migration, không nhét field mới vào API004.

Static/schema/model checks trong package chỉ kiểm tính nhất quán tài liệu và ví dụ giả; không kiểm parser VCB/MoMo, API SSI, vàng thật, SQL, APK hay chất lượng end-to-end. ARCH-12 tiếp theo chốt Agent/model/evals; ARCH-13 vận hành; các source PoC là release gates độc lập.
''')
    md('source-options-and-decisions.md','''
# Lựa chọn nguồn và quyết định

Ngày kiểm09/10/2026, desk research tài liệu công khai; không tạo account/key, gọi market API, scrape bảng giá hay lấy thông báo thật. [Research register](research-sources.json) ghi nguồn primary và giới hạn. Đây là lựa chọn kiến trúc adapter; provider thật cần entitlement và PoC, không coi im lặng là phê duyệt.

## Cổ phiếu Việt Nam

| Option | Phù hợp và trade-off | Kết luận |
| --- | --- | --- |
| M0 Synthetic + owner manual dated quote | Không phụ thuộc quota/keys; manual không đáp ứng tự cập nhật giá thật | Baseline để xây và kiểm đủ feature; không gắn nhãn live |
| M1 SSI FastConnect V3 REST read-only | Official documented catalogue/daily data; cần tài khoản SSI, read-only scope, quyền dùng theo consumer và quota thật. Finality/price scale/time mapping phải chứng minh | **Ứng viên ưu tiên cho PoC**, chưa activate/đăng ký; không trading |
| M2 Licensed market data provider | Có thể có SLA/rights rõ cho nhiều user; cần báo giá/license/contract cụ thể | Adapter cùng interface, không vendor/chi phí ngầm được chọn |
| M3 Vnstock như connector tùy điều kiện | Software license riêng, upstream rights riêng; thêm dependency/Python nếu dùng bản Python, không tự nhiên khớp Fastify TS | Không bắt buộc trong stack; chưa cài, chưa chọn tier/nguồn |

SSI xác định V3 là hướng thay V2, V2 hết phát triển tính năng mới01/01/2027 và cần chuyển trước30/06/2027. Không khởi tạo adapter mới bằng V2 hoặc lấy unit/page limits V2 áp sang V3. [SSI migration](https://developers.ssi.com.vn/docs/faq/v2-to-v3-migration).

SSI hiện chưa thu phí FastConnect, yêu cầu tài khoản chứng khoán; key có thể scope chỉ đọc Market Data, quota theo key/endpoint/method; UAT còn tùy việc SSI công bố sẵn sàng. Đây chưa chứng minh quyền SaaS, cache hay redisplay. [SSI overview](https://developers.ssi.com.vn/docs/faq/service-overview).

Tài liệu V3 catalogue/summary/OHLC được ghi riêng trong research. Field giá chuỗi, tradingDate và paging không tự xác nhận scale/quote timestamp/finality/adjusted basis. Không chạy interactive API explorer hoặc dùng credentials. UAT endpoint, pagination hard cap và reset-header units chưa được suy đoán.

Vnstock license-2026.09 phân biệt phần mềm và dữ liệu; có các use case chuyên môn/thương mại trong phạm vi cấp và điều kiện riêng cho tổ chức/redistribution/data-service. Không kết luận mọi thương mại bị cấm, cũng không coi một free account cấp quyền SaaS toàn bộ user. Cần rà đúng tier/use case và từng nguồn upstream. [License chính thức](https://vnstocks.com/onboard/giay-phep-su-dung). Không mặc định license MIT theo bài cũ.

## Vàng

G0 synthetic/manual chốt. G1 PNJ hoặc G2 SJC chỉ là nguồn bảng giá đối chiếu để đánh giá quyền automation/API, product/brand/purity/region/side/unit/time. [PNJ](https://www.pnj.com.vn/blog/gia-vang/) dùng nghìn VND/chỉ; [SJC](https://www.sjc.com.vn/) ghi nghìn VND/lượng. Đây không phải API contract hoặc grant sao chép. Tài liệu truy xuất PNJ chưa có thời điểm cập nhật điền đầy đủ; SJC chưa trả đủ dòng giá trong HTML đã đọc. Không lấy thời gian tải trang thay quoteAsOf, không truy tìm endpoint nội bộ để vượt giới hạn.

Giữ profile vàng versioned; người dùng chỉ nhập số chỉ sau bước xác nhận profile đúng. Đề xuất giá mua vào cho ước tính bán tài sản, phải thể hiện side rõ; giá bán là basis khác. Không lấy nhẫn PNJ thay vàng miếng SJC, không lấy XAU/USD thay vàng bán lẻ VN. Quote là tham khảo, không cam kết giá mua lại thực tế.

## Ngân hàng/ví và dữ liệu còn cần owner cung cấp

VCB Digibank (package `com.VCB`) và MoMo (`com.mservice.momotransfer`) xác nhận được từ trang Play chính thức, **không xác nhận signer/appVersion/template đang cài**. Đây chỉ shortlist khi chưa biết app owner dùng. Chọn app không có nghĩa hỗ trợ capture mọi giao dịch. Quyền Notification Access khác quyền thông báo của app ngân hàng và không cung cấp lịch sử sao kê.

VCB mô tả OTT/Voice OTT nhận thông báo; MoMo công bố luồng pending và thông báo khi có kết quả. Không từ đó suy ra mọi debit/credit đều có external Android notification đầy đủ. [VCB Voice OTT](https://vietcombank.com.vn/vi-VN/Trang-thong-tin-dien-tu/Articles/2025/02/24/20250224_VCB_Thong-tin-bao-chi-Voice-OTT), [MoMo lifecycle](https://www.momo.vn/tin-tuc/thong-bao/chuyen-tien-muot-hon-bao-gio-het-khong-can-doi-8878).

Các thông tin đang mở: tên app thực dùng; điện thoại/Android/OEM; mục đích cá nhân hay SaaS nhiều user; tài khoản/entitlement provider nếu owner có. Chưa trả lời vẫn thiết kế khả năng nhiều user theo least privilege, **không** tự nhận quyền thương mại. Không xin mật khẩu/OTP/raw notification trong chat. Mẫu thật chỉ kiểm trên máy owner có consent và tạo bản cấu trúc đã thay dữ liệu nhạy cảm nếu cần fixture.
''')
    md('collector-profiles.md','''
# Collector source profiles và an toàn ghi sổ

## Support registry, không có regex ngân hàng bịa

Một profile immutable gồm source ID/package case-sensitive, signer policy/lineage, app versions đã kiểm, OS/OEM matrix, template IDs/version, locale/amount/direction/finality semantics, account discriminator, reference namespace và revision policy. Metadata/schema ở [registry](provider-registry.json)/[schemas](profile-schemas.json). Hai source thật hiện supported=false; parser versions/profile IDs là **candidate placeholder**, không có implementation hay pattern đã chứng minh. Synthetic app/profile hoàn toàn riêng, không bắt chước signer thật.

Kiểm package + signer + version + profile trước extract theo ARCH10. Android API28+ SigningInfo có lineage cho rotation; một signer rotated cần lineage đã kiểm, multi-signer cần exact approved set. API24–27 là compatibility branch phải PoC riêng; không chấp nhận bất kỳ cert nào chỉ vì cùng package hoặc có một cert cũ trong history. Cert fingerprints/version ranges chưa biết là null/empty và REAL bị chặn, không lấy từ Play page.

Template chỉ cho `complete` khi đã chứng minh amount/direction/currency/account/finality. Pending, failed, refund/reversal, fee, multiple amount, redacted/OTP, account ambiguous và changed format cần disposition riêng. Complete trong DTO **không phải** bằng chứng bank xác thực; native signature chỉ xác thực collector được cấp quyền. Không dùng LLM đọc raw hoặc đoán parse để ghi actual.

## Binding và nội dung được phép

Owner dùng `bindCollector` chọn account thuộc workspace, exact device/package/parser và expectedVersion; mobile encrypted config lưu masked discriminator để phân biệt nhiều account. API không nhận số tài khoản đầy đủ trong binding. Không thấy discriminator đáng tin/khớp nhiều bindings thì **local setup/Review warning + gap**, không chọn account đầu tiên. API004 ingest bắt buộc bindingId nên **không gửi** unbound/ambiguous item bằng null/sentinel/fake binding. Mapping mới chỉ áp dụng capture sau đó; lịch sử thiếu dùng manual/CSV hoặc owner nhập bằng port hiện hành, không retag outbox cũ. ARCH11 làm rõ câu “unmapped→Review” trong ARCH10: local warning, chưa có server receipt.

Binding rõ nhưng template incomplete/redacted có thể gửi DTO tối thiểu hợp lệ theo API để server Review. `amount=null`, direction unknown khi không chắc; không amount0 thay missing. API004 không có field lifecycle/reason/raw/fee: pending chỉ được ánh xạ incomplete ở profile đã duyệt, server không được tuyên bố biết pending subtype từ DTO nếu không có dữ liệu. Template chỉ báo thất bại và không có economic movement có thể discard + gap/health reason; không tạo expense. Nếu cần preserve thêm lifecycle để hợp nhất exact event, mở revision contract riêng trước implementation.

Normalized payload chỉ bảy fields của API: amount integer VND string/null, currency VND, direction, sourceAccountRef mask/null, transactionRef opaque/null, sourceOccurredAt/null, ruleStatus. Không names/memo/full account/card/balance/raw/OTP. Ref cần thiết là private financial evidence, không log/model/Ops; không coi hash OTP/raw là vô danh. Missing bank time vẫn null, observedAt riêng. Non-VND hoặc mixed fee/net/gross unsupported/incomplete, không tự FX hoặc cộng trừ. SourceAccountRef không đủ phân biệt thì Review, không đoán account.

## Identity, finality và reconciliation

EventKey/revision/digest native chỉ transport occurrence (ARCH09/10), không bank economic ID. Cùng verified reference namespace + account + economic type + direction + source version có thể giúp server dedupe; không loại giao dịch dựa mỗi amount/time. Cross-device/CSV/manual cần same trusted economic identity hoặc owner Review. Exact digest repeat không tác động ledger hai lần. Bank ref và wallet ref không tự cùng namespace; một ref có thể có fee/multi-leg, phải profile-specific economic key.

Pending/final notification có thể reuse hoặc đổi OS key/postTime; không tự gộp theo đó. Khi không có trusted lifecycle/ref, tạo Review, không hoàn tất actual bằng inference. Hủy/điều chỉnh sau posting dùng immutable correction/reversal+replacement của Engine trong một UnitOfWork, giữ source lineage; không update amount của ledger đã đóng. Refund phải có linkage hoặc owner xác nhận, không match bừa cùng tiền/ngày.

Chuyển giữa tài khoản của owner kế thừa ARCH08: debit đã xác minh có thể đi vào transfer-clearing/needs_review, destination chưa nhận không bịa credit; khi đã có bằng chứng leg nhận thì settle clearing đúng một lần. Cùng một movement đã ghi từ manual/CSV thì thêm provenance, delta=0. Không biến bank→wallet thành expense+income làm sai cashflow full scope; fee chỉ expense khi xác minh riêng. Nếu không xác định được internal transfer, owner Review trước phân loại hoàn tất.

## Privacy, mẫu và support lifecycle

Raw chỉ memory bounded của native, không Room/WAL/upload/log/crash/WorkData/temp/chat/LLM. Fixture bank thật không lấy từ email/chat; sample review có consent ngay thiết bị, thay identity/reference/free-text bằng dữ liệu giả nhất quán trước export; OTP luôn loại. Không hash raw làm evidence. Dùng synthetic test app cho callback/summary/update/lock/OEM trước, rồi consented real matrix. Source format/version mới → pause affected profile, outbox cũ giữ parser/binding/owner epoch; không auto chạy parser mới trên raw đã xóa.

Coverage luôn là **các notification đã quan sát**, không bảo đảm mọi giao dịch/số dư/sao kê. Permission/OEM/offline/force-stop/no external notification gây gap; activeNotifications không là lịch sử. Reconcile bằng manual/CSV/owner statement, giữ gap/lastSuccess truthful. Admin chỉ health/error code/parser rollout, không payload/account refs/amount. Collector optional; từ chối quyền OS vẫn dùng đầy đủ manual/CSV/Plan–Goals.
''')
    md('market-normalization.md','''
# Chuẩn hóa giá và thời điểm

## Stock catalogue/price

Identity là instrumentId + exchange + listing lifecycle/version, không chỉ symbol. Source V3 catalogue adapter xác minh loại cổ phiếu cơ sở/đơn vị VND/share, listing/trading status; không coi CW/future/ETF hoặc ticker trùng sàn là cash stock được hỗ trợ. Delisted/suspended/unknown vẫn giữ holding/history, giá không trở thành0. Không tự đổi symbol identity khi tái niêm yết. User vẫn nhập mã+số lượng; ambiguity cần xác nhận catalogue, không bắt nhập giá hằng ngày.

V3 candidate GET `/api/v3/data/securitiesByBoard`, `/api/v3/data/securitiesSummary`, `/api/v3/data/ohlc`; read-only API origin `https://api.ssi.com.vn` theo docs. Không endpoint trading/order/asset account, không dùng API token có quyền giao dịch nếu không cần. Các endpoints/paging/filter/units cần kiểm lại khi PoC và pin adapter version; chưa gọi các endpoints này. Không lấy scale1000 hoặc page cap của V2 áp V3. Header reset format/unit chưa được xác nhận, retry deny until parse semantics known.

Stock basis dùng **unadjusted close** nếu nguồn xác nhận đáp ứng; adjusted series không thay close cho số share owner đang giữ. Split/dividend/corporate action ảnh hưởng quantity cần Engine command/owner evidence; price worker không đổi quantity/cash/ledger. Volume không quantity của owner. Decimal strings → exact decimal/rational → canonical VND/share tối đa8fraction digits và18integer digits theo API; không JS float, không truncate/round silently khi nguồn vượt precision. Positive finite only, missing/zero/NaN/HTML/error-body/duplicate page mismatch bị reject, giữ last-good.

## Gold profiles và locale

Profile frozen: product/purity/brand/region/sourceRef/side/currency/unit/version. Canonical valuation VND/chỉ, 1lượng=10chỉ; source scale nghìn nhân1000 **đúng một lần**. Quote observation lưu giá đã bỏ scale nghìn nhưng **giữ sourceUnit** để khớp ARCH08: ví dụ hoàn toàn giả `12345` nghìnVND/lượng → stored price12345000VND/lượng → valuation1234500VND/chỉ. `1234.5` nghìnVND/chỉ → stored1234500VND/chỉ. Không vừa chia10 giá stored vừa để unit=luong, không rounding unit price trước nhân quantity. Derived price/valuation dùng exact rational khi chia10 tạo nhiều hơn8fraction digits; không buộc ghi một quote mới đã làm tròn. Giá đã là giá product không nhân purity thêm. Tất cả ví dụ là fixture giả, không live market quote.

Locale/decimal/group separators được pin cho đúng source field/version; không tự đoán `1,234` là1.234 hay1234. Invalid grouping/Unicode digit/currency lẫn trong field machine/precision vượt schema → reject. Display format không được chạy ngược thành parser tự đoán. Giá mua/bán lưu riêng side; buy estimate ≠sell replacement; chưa chọn profile thì no compatible quote. Foreign XAU/oz hay khácregion/brand không tự fallback, không tự thêm FX provider ngoài feature đã đặc tả.

## quoteAsOf khác fetchedAt và thời điểm biết dữ liệu

quoteAsOf là thời điểm giá đại diện; fetchedAt là lúc nhận; recordedAt/history cutoff là lúc hệ thống biết. Không stamp fetchedAt để làm quote cũ thành fresh. Timezone thị trường Asia/Ho_Chi_Minh được pin, UTC trên wire. Reject quote time trong tương lai hoặc tradingDate bất khả thi. source time chỉ có ngày cần **verified finality + verified session calendar/time mapping** mới suy ra session bound, lưu `timePrecision=session_bound`, semantics=VERIFIED_SESSION_FINAL_BOUND trong private profile_snapshot và không nói đây là timestamp upstream chính xác. Calendar phải bao phủ sàn/date/holiday/session thực và có version; không đoán14:45 cho mọi market. Chưa có các bằng chứng này thì date-only row không publish quote mới. Gold page missing date/time cũng không publish fresh.

Nếu nguồn cung cấp datetime chính xác, dùng SOURCE_DATETIME sau timezone/format/finality check. Intraday đang giao dịch không gọi final unadjusted close. Daily18:00 là lịch **thử cập nhật**, không bảo đảm lúc đó nguồn đã có giá đóng cửa hôm nay. Khi chưa đủ quote semantics giữ quote cũ/unknown và error code SOURCE_TIME_UNKNOWN hoặc SOURCE_BASIS_UNVERIFIED; không bịa snapshot. Weekend/holiday/suspension giữ last-known, không backfill synthetic ngày thiếu hoặc đổi quoteAsOf sang ngày chạy job.

ARCH08 default stale khi price/FX age>24h (đúng24h chưa stale), source success>48h, quantity>30d. Không đổi ngầm threshold theo calendar; marketClosed diagnostic không reset freshness. `quality` tính lại tại read asOf; row từng fresh không vĩnh viễn fresh. Historical snapshot dùng frozen quote/profile/cutoff, correction mới không sửa bản sealed. Provenance store nguồn+adapter+profile+rights+calendar versions, normalization+time precision và input fingerprint chuẩn hóa, không hash/store unauthorized upstream body.

## Fallback/corrections

Fallback tự động chỉ khi explicitly approved compatible instrument/profile/side/basis/unit/time/rights scope và quota, giữ provider provenance mới. Thay provider/cache entitlement không được sửa history hoặc chia sẻ credential/cache giữa tenants. Chưa xác nhận tương thích thì giữ last-good/unknown, cho owner manual dated quote với nguồn rõ. Manual không được masquerade SSI/PNJ; `compatible` từ client là yêu cầu, server tự validate, không authority. Correction giữ bản observation cũ, append bản mới với revision/lineage; không overwrite actual. Source fingerprint gồm normalizedvalue + source time + identity + profile/adapter/rights versions, cùng value nhưng time mới vẫn observation mới.
''')
    md('entitlements-and-egress.md','''
# Quyền dữ liệu, secrets và egress

## Quyền nhiều chiều, unknown không phải granted

Tách API fee, software connector license, data license và infrastructure cost. “API đang miễn phí” không có nghĩa được cung cấp giá cho SaaS mọi user; trang giá public không có nghĩa public automation API. Per-provider/per-entitlement cần access method, permitted asset/venue, user/device/audience, automated server/non-display usage, cache scope/TTL, historical retention/backup, redistribution/display/export, derived portfolio/forecast use, **external model/LLM egress**, attribution/expiry/revocation. Chỉ capability cần dùng được grant mới bật; chưa biết là null và deny, không infer từ key hoạt động.

Rights record là cấu hình quản trị versioned có evidence ref/digest, approver/time và effective dates, không field client tự nâng quyền. Public research findings không là signed entitlement. Owner/BYOK chưa phải phương án chốt và không tự cấp quyền provider; key cá nhân không tự trở thành shared server key. Credential chỉ Market worker secret reference, market-read-only. Không key upstream trong browser/APK/Agent/admin logs; không gửi account ngân hàng/password/OTP để lấy giá.

## Storage/history compat gate

Current DB quote/history retention workspace lifecycle. Muốn bật nguồn có cache TTL ngắn/xóa lịch sử/backup ban phải chứng minh policy đáp ứng đồng thời finance audit/sealed history/T1 erasure. **Chưa có implementation retention revision thì không admit nguồn đó**. Không chỉ xóa quote row rồi vẫn để giá trong snapshots/forecast/export/backups. Rights expiry/revoke lập tức chặn new egress/refresh/display/derived/model theo phạm vi, purge phải theo từng granted policy + retained audit tối thiểu hợp lệ; không giữ plaintext market history “vì đã từng được phép”. Nếu nguồn không cho retention sản phẩm cần, chọn provider khác hoặc revision storage/history được review, không âm thầm bỏ feature.

Forecast/Agent dùng giá trị derived vẫn cần use-specific grant; không suy ra đã “ẩn giá” thì được gửi model. Tool truyền owner-scoped snapshots/derived allowlisted fields khi cả privacy và provider rights cho phép; raw notification/transactionRef/accountRef/upstream credentials luôn không gửi. Tool thiếu live data phải trả unavailable/stale/citation chính xác, agent vẫn làm Plan–Goals với manual/synthetic/owner-confirmed assumptions và không ghi actual. ARCH12 sẽ chốt model/runtime/eval, chưa chọn external model ở ARCH11.

## Egress và quota

Egress default deny theo server config provider+HTTPS origin+exact route/method/query allowlist; không client URL/redirect/arbitrary fetch, không SSRF qua symbol hoặc nextPage link. DNS/resolved addresses must public allowed destination; reject private/loopback/link-local/metadata/port/redirect except riêng SYNTHETIC stub. Pin CA/hostname standard TLS; API path v3 pin không tự chuyển version theo redirect. Max response bytes/time/pages/schema bounds cần PoC, tới đó gate closed thay vì set vendor limit giả. Error body không log nguyên văn.

Kế thừa MarketQuota/ARCH09: `provider_entitlements.quota_daily` là configuredcap (unknown→0), **không số lượt đã dùng**. Global credential namespace + entitlement + endpoint/method + every applicable window buckets reserve atomically trước từng HTTP/pagination/retry; unknown outcome charged. Không “mỗi workspace có quota riêng” để nhân vượt key shared. Cooldown manual không thay quota. Header limit/remaining/reset cần verified adapter units và nhiều concurrency; Retry-After floor persistent, không cap xuống; restore chặn egress đến trusted usage/reset. 401/403 suspend authorization, 429 cooldown, 5xx boundedretry, HTML/captcha/schema drift → pause, không né chặn hoặc scrape fallback.

I0 scripted/local không external spend. SSI currentfee0 chưa chứng minh SaaSfee0; gold license/backup/model/APK có điều kiện riêng. Budget external hiện0; paid source/plan cần báo giá và owner cho phép trước dùng. Không rotatekeys/accounts để né quota, không miễn phí giả nhờ bỏ backup hoặc retention safeguards.
''')
    md('contract-storage-addendum.md','''
# API/storage/consumer addendum

**Không thay wire API004, DB005, Android bridge2.** [Machine mapping](contract-storage-map.json) có operation/field/table ownership chính xác; [bundle](implementation-bundle.json) pin hashes. Consumer migration cần implementation riêng, không mặc định frontend hybrid1.1/2.0 đã nối API004.

## Notification mapping và hai giới hạn phải xử lý đúng

`bindCollector` owner-only → collector_bindings workspace/account/device/package/parser/expectedVersion; sourceAccount discriminator được native owner setup giữ encrypted private local config, **không nhét field mới vào bindCollector**. Server cũng kiểm caller owns device/account và source support; disabled/revoked/old epochs reject. `listCollectorBindings`, `disableCollectorBinding`, `listSourceSupport` projection đúng schema. Profile IDs opaque stable versioned (<=80ASCII), không executable code download.

`ingestNotifications`: DeviceBearer+proof+epochs+exact allowed normalizedEvidence → durable ingestion_receipts → J2 `processIngestionReceipt` → Engine validation/Review/posting UoW. ACK≠posted. bindingId mandatory: unbound/ambiguous account chỉ native warning/gap, chưa có cloud Review/receipt; bound incomplete vào server Review. Không gán fake account để làm schema pass. API không lifecycle/reason/fee, không suy ra từ raw đã xóa; nhu cầu preserve mới phải version wire trước.

DB `sources.kind` nhận bank/wallet/price/manual/csv, nhưng API `listSources` hiện chỉ bank/price. **Compatibility projection**: DB bank/wallet→wire bank (legacy financial-source group), DB price→price; manual/csv không xuất qua endpoint hai-kind này, vẫn có feature/ports manual/import riêng. Source name/support profile và private registry phân biệt wallet. Không gửi enum wallet vào API004; nếu cần public subtype/filter riêng tạo revision. Ops source health tương tự chỉ allowed projection, không private finance. connection=connected chỉ trạng thái kết nối, không supported/licensed/fullcoverage.

## Market/storage ownership

Market sở hữu instruments, gold_profiles, provider_entitlements, quote_observations và adapter/profile registry. Collector parser catalog do Ingestion/native build versioned; binding/source_records do Ingestion; Engine là authority actual/correction. `requestPriceRefresh` owner input holdingIds → frozen scope/rights/profile/request_payload_id; host scheduler internal enqueue cùng semantics; `executePriceRefresh` worker only. `listPriceQuotes` owner query, `recordPriceQuote` manual owner command validatecompatibility/time/positive/range server-side; client `compatible=true` không bỏ gate.

Registry phân hai lớp: (1) global non-secret versioned release config: public source identity/templates/unit/calendar/rights-policy schema, no workspace/accounts/token/private license attachment; (2) tenant private entitlement snapshot có evidenceRef/rightsVersion/config digest trong registered `payload_objects` kind `market_entitlement_snapshot`, owner_module Market, schema pin, bounded <=256KiB, immutable object identity/version theo existing registry rules. Đây là **registry addendum SPECIFIED**, không genericCRUD/newtable/migration; refs lifecycle/retention phải validate runtime. `rights_version` resolves exact private snapshot, credential_ref chỉ secret reference. Không globalize finance/private license vì cùng provider.

Quote `profile_snapshot` chứa bounded typed source/normalization/instrument-or-gold profile/calendar/timePrecision/rights version+digest và basis; new [schemas](profile-schemas.json) là private metadata validators cho candidate VN/VND, **không public API fields** và không xóa manual USD+FX port đã có. Stored price là scale-expanded VND/sourceUnit (share/chi/luong), canonical chi chỉ ở exact valuation; scale gốc trong snapshot là provenance, không multiplier áp lại vào stored price. `quote_as_of`/`fetched_at` giữ source semantics; quality derived read asOf. DB numeric28,8 rộng hơn API18integer+8fraction: reject overflow trước insert/publication để không row impossible-to-serialize. Preserve immutable previous history; no arbitrary source body payload. New config reference/kind phải được registered domain capability validation trước implementation pass.

## Không đổi schema để che tính chưa biết

Mọi actual write qua Engine exact commands, role grants/UoW/replay theo ARCH06–09. Source parser không bypass authorization hay lấy app-admin làm owner. Unknown time/finality/unit/quota/rights/source-signature gate REAL closed. Nếu source cụ thể đòi raw retention, lifecycle ngoài DTO, account mapping public fields hoặc license short-history không tương thích, báo finding + tạo versioned contract/schema migration trước activate, không sửa package niêm phong. None of these are SQL/runtime acceptance.
''')
    md('operational-policy.md','''
# Vận hành nguồn và phục hồi

## Daily và chủ động

18:00 Asia/Ho_Chi_Minh hằng ngày, host timer mỗi60s enqueue durable work; clients đóng vẫn chạy nếu host hoạt động. Khi host chết/cạn quota/không có final quote, không claim daily success. Catch-up lấy latest eligible actual quote, không tạo giá lịch sử giả. Manual button cooldown60s, exact compatible unfinished request coalesce; source/rights/profile/basis/holdings đóng băng tại accept. Market job không đổi asset quantity/cash/Plan; valuation update khác ledger actual.

Parent manifest/child entitlement credential partitions và J2 lease/fence/reserved→sent_unknown→observed theo ARCH09. Timeout25s là target ứng dụng, chưa benchmark; response/pagination bounds/ratelimits chưa xác nhận vendor thì nguồn real chưa runnable. Partial symbols/profile failures ghi item outcomes; giữ last-good từng holding, aggregate job không báo allfresh chỉ vì HTTP200. GET polling không advance job. Unknown secret/license/quota/time/basis trả allowlisted code, không leak raw response/endpointsecret.

## Health, rollout và restore

Per profile lifecycle CANDIDATE→SYNTHETIC_VERIFIED→REAL_POC→SUPPORTED (exact observed app/OS/OEM/template)/PAUSED/RETIRED. Candidate không được supported=true chỉ vì có Play page hoặc README pattern. Source update package/version/signer/template/time/terms drift → pause affected profile, không fallback generic parser. Rollout via signed APK/config integrity + versioned built-in parser; server có kill switch metadata, app phải revalidate offline config expiry. Không remote executable code hoặc downloaded regex tùy ý từ admin.

Owner thấy source/quoteAsOf/fetchedAt/lastAttempt/lastSuccess/coverage gap/support reason và pending/review; nếu schema chưa có subtype chỉ render metadata hiện có hoặc local warnings, không payload field mới. Admin thấy aggregate operational outcomes/error codes/job health/quota state theo approved coarse metadata, không amount/accountRef/transactionRef/holdings/quote private selections. Monitor không dựa vào bank raw/memo, labels không chứa tenant financial identifiers.

Restore theo T1 witness: revoke/delete applied trước data serving, credential/quota/rights current heads reconcile trước egress. Không tự retry receipt mất sau restore; owner investigation/ACK journal protocol ARCH09. License/key rotation không reset used quota namespace; unknownquota charged. Historic parser/profile/rights/calendar phải còn exact refs để đọc provenance được phép; không rerun oldsource raw vì raw không tồn tại. Revocation hoặc license incompatibility cần incident checklist và explicit data-retention decision trước resume.

## Các PoC phải thực hiện sớm

1. Synthetic test app → native listener/background/summary/duplicate/update/offline/binding isolation → durable ACK/Review; không cần ngân hàng thật.
2. Owner-selected app/device: verify package/signer/version; consented local capture test incoming/outgoing/pending/final/refund/fee/internal transfer/redaction/multi-account. Không yêu cầu raw/OTP gửi chat; unsupported cases hiển thị gap/manual.
3. SSI authorized read-only test: identity/catalogue, price scale, finality/date/timezone, paging, error bodies/headers/quota concurrency, cash-stock basis và allowed asset rights. UAT only if actually available; production calls cần quyền rõ và cap approved, chưa được cho phép ở task này.
4. Gold authorized channel: source permission/API stability/locale/scalex1000/chỉ-lượng/product/region/side/source timestamp; public board thiếu quyền/time thì chỉ manual reference, không scraper ngầm.
5. License/storage/derived/model/backup compatibility, rights expiry/revoke, shared-key quotas + restore, last-good and fallback provenance. Staging fixtures là dữ liệu giả, không copy quotes/vendor errorbody thật vào repo.

32 acceptance IDs chi tiết trong [plan](acceptance-plan.md). Chưa run bất kỳ PoC/runtime nào trong ARCH11; static checks không đổi trạng thái đó. Không cắt source-dependent feature khỏi backlog khi gate mở; giữ adapter implementation + failure UX + tests và đánh dấu real integration bị chặn bởi evidence cụ thể.
''')
    research=[
      ('SSI-OVERVIEW','https://developers.ssi.com.vn/docs/faq/service-overview','Hiện chưa phí API; tài khoản SSI, scopes/key và per-endpoint quota; UAT tùy availability. Không có grant redistribution trong nội dung đã đọc.'),
      ('SSI-MIGRATION','https://developers.ssi.com.vn/docs/faq/v2-to-v3-migration','V3 official long-term; V2 bug support hết2026, duy trì đến30/06/2027; không suy ra V3 scale từ V2.'),
      ('SSI-ENV','https://developers.ssi.com.vn/docs/getting-started/terms-and-environments','Public production API origin và key/environment separation; terms acceptance không tự xác nhận SaaS entitlement.'),
      ('SSI-MARKET','https://developers.ssi.com.vn/docs/faq/market-data','REST/daily vs intraday/stream semantics; chưa proof field scale/finality/time mapping đáp ứng portfolio.'),
      ('SSI-CATALOG','https://developers.ssi.com.vn/docs/api-reference/data-securitiesByBoard','V3 symbol/board/index catalogue candidate; không dùng tất cả securities như cổ phiếu cơ sở.'),
      ('SSI-SUMMARY','https://developers.ssi.com.vn/docs/api-reference/data-securitiesSummary','V3 daily summary page/date/string fields đã desk-read; repeat fetch lỗi tại cuối review, không API probe; unit/finality/time gates vẫn mở.'),
      ('SSI-OHLC','https://developers.ssi.com.vn/docs/api-reference/data-ohlc','V3 OHLC/timeFrame/paging candidate; repeat fetch lỗi, không giả hard limits/adjusted basis.'),
      ('SSI-V2-HISTORICAL','https://guide.ssi.com.vn/ssi-products/tieng-viet/fastconnect-data/huong-dan-ket-noi','Tham chiếu cũ, không current adapter selection.'),
      ('PNJ','https://www.pnj.com.vn/blog/gia-vang/','Bảng public nghìnVND/chỉ và product/side; update-date trong truy xuất trống, không source timestamp/API/license proof.'),
      ('SJC','https://www.sjc.com.vn/','Bảng public nghìnVND/lượng; HTML đọc chưa có đầy đủ quote rows; no automation grant xác minh.'),
      ('VNSTOCK-LICENSE','https://vnstocks.com/onboard/giay-phep-su-dung','license-2026.09, software phạm vi/tier khác upstream data rights; không blanket commercial ban/grant.'),
      ('VNSTOCK-REPO','https://github.com/thinh-vu/vnstock/blob/main/README.md','Connector không data entitlement; không cài/import vào project.'),
      ('VCB-PLAY','https://play.google.com/store/apps/details?id=com.VCB','Official publisher/package com.VCB; signer/installed version/template chưa xác minh.'),
      ('MOMO-PLAY','https://play.google.com/store/apps/details?id=com.mservice.momotransfer','Official package com.mservice.momotransfer; không proof template coverage.'),
      ('VCB-OTT','https://vietcombank.com.vn/vi-VN/Trang-thong-tin-dien-tu/Articles/2025/02/24/20250224_VCB_Thong-tin-bao-chi-Voice-OTT','Voice OTT incoming announcement option; không đảm bảo every debit/credit external payload.'),
      ('MOMO-RECEIVE','https://www.momo.vn/hoi-dap/sau-bao-lau-nguoi-nhan-se-nhan-duoc-tien','Thông báo trong ứng dụng khi nhận; không đồng nghĩa every event external NLS notification.'),
      ('MOMO-LIFECYCLE','https://www.momo.vn/tin-tuc/thong-bao/chuyen-tien-muot-hon-bao-gio-het-khong-can-doi-8878','26/06/2026 pending/final transfer notifications; parser phải phân finality, không ingest Zalo như source MoMo.'),
      ('SIGNING','https://developer.android.com/reference/android/content/pm/SigningInfo','API28+ signing history/rotation vs multi-signer; cần actual installed-app proof, không package-only trust.'),
    ]
    put(D/'research-sources.json',{'asOf':'2026-10-09','method':'Public primary-source desk research only; no account/login/vendor API/notification capture','sources':[{'id':i,'url':u,'finding':f,'liveIntegration':'NOT_RUN'} for i,u,f in research]})
    rights=['automation','serverNonDisplay','ownerDisplay','saasRedistribution','cache','historicalRetention','backup','derivedValuation','forecast','externalModel']
    provider=[]
    for id,kind,version,package,status in [
      ('synthetic-market','market','fixture1',None,'SYNTHETIC_ONLY'),
      ('owner-manual','market','owner-confirmed',None,'MANUAL_ONLY'),
      ('ssi-fastconnect-v3','stock','3',None,'CANDIDATE_POC'),
      ('pnj-board','gold','public-board',None,'REFERENCE_ONLY'),
      ('sjc-board','gold','public-board',None,'REFERENCE_ONLY'),
      ('vnstock-connector','connector','license-2026.09',None,'NOT_SELECTED'),
      ('vcb-digibank','bank','unknown','com.VCB','CANDIDATE_POC'),
      ('momo','wallet','unknown','com.mservice.momotransfer','CANDIDATE_POC')]:
        provider.append({'id':id,'kind':kind,'upstreamVersion':version,'packageName':package,'status':status,'supportedReal':False,'selectedByOwner':False,
          'signerCertificates':[],'testedAppVersions':[],'parserImplemented':False,'verifiedTemplateIds':[],
          'rights':{k:None for k in rights},'verifiedQuotaWindows':[],'credentialRef':None,'verifiedTimeMapping':False,'verifiedPriceScale':False,
          'note':'No vendor capability/license inferred; manual/synthetic not real automated sources'})
    put(D/'provider-registry.json',{'id':'FW-SOURCE-REGISTRY-001','asOf':'2026-10-09','externalCallsMade':0,'providers':provider})
    policy={'id':'FW-SOURCES-POLICY-001','apiRevision':'FW-API-T1-D1J2-004','databaseRevision':'FW-PHYS-T1-ASYNC-005','status':'DESIGN_ONLY',
      'externalBudgetVnd':0,'realActivated':False,'userBankSelection':None,'userDevice':None,'commercialUseConfirmed':False,
      'realMarketGates':['accessApproved','scopeReadOnly','rightsForUseApproved','quotaVerified','responseBoundsVerified','priceScaleVerified','identityVerified','basisFinalityVerified','timeMappingVerified','storageRetentionCompatible','runtimePocPassed'],
      'realCollectorGates':['ownerSelectedApp','consent','packageVerified','signerVerified','appVersionVerified','deviceMatrixVerified','templateVerified','bindingUnambiguous','privacyPassed','nativePocPassed'],
      'rawNotification':{'persist':False,'upload':False,'log':False,'model':False,'chat':False},
      'unboundDisposition':'LOCAL_WARNING_AND_GAP_NO_UPLOAD','pendingAutoPost':False,'deviceSignatureIsBankProof':False,
      'bankWireCurrency':'VND','wireLifecycleFieldAdded':False,'wireWalletProjection':'bank','stockBasis':'VERIFIED_UNADJUSTED_CLOSE',
      'goldCanonicalUnit':'chi','goldCurrency':'VND','chiPerLuong':10,'thousandVndMultiplier':1000,'multiplyPurityAgain':False,
      'quoteTimeModes':['SOURCE_DATETIME','VERIFIED_SESSION_FINAL_BOUND'],'missingTimeDisposition':'REJECT_NEW_QUOTE_KEEP_LAST_GOOD',
      'priceStaleAfterSeconds':86400,'sourceStaleAfterSeconds':172800,'quantityStaleAfterDays':30,
      'fetchedAtSubstitutesQuoteAsOf':False,'priceJobCanWriteCashOrQuantity':False,'crossTenantCacheDefault':False,'unknownQuotaCap':0,
      'daily':{'hourLocal':18,'timezone':'Asia/Ho_Chi_Minh','timerSeconds':60,'manualCooldownSeconds':60,'exactSuccessGuarantee':False},
      'unknownRights':'DENY','runtime':'NOT_RUN'}
    put(D/'source-policy.json',policy)
    string={'type':'string','minLength':1,'maxLength':120}
    defs={
      'ParserProfile':{'type':'object','properties':{
        'id':{'type':'string','pattern':'^[A-Za-z0-9_-]{1,80}$'},'packageName':string,'version':string,
        'supportedReal':{'type':'boolean'},'signerCertificates':{'type':'array','uniqueItems':True,'items':{'type':'string','pattern':'^[a-f0-9]{64}$'},'maxItems':16},
        'appVersions':{'type':'array','uniqueItems':True,'items':string,'maxItems':100},'templateIds':{'type':'array','uniqueItems':True,'items':string,'maxItems':100},
        'deviceEvidenceRefs':{'type':'array','uniqueItems':True,'items':string,'maxItems':100},
        'currency':{'const':'VND'},'locale':{'enum':['vi-VN','en-US']},'economicKeyVersion':string,
        'finalityVerified':{'type':'boolean'},'privacyPassed':{'type':'boolean'},'sourceAccountMaskOnly':{'const':True}},
        'required':['id','packageName','version','supportedReal','signerCertificates','appVersions','templateIds','deviceEvidenceRefs','currency','locale','economicKeyVersion','finalityVerified','privacyPassed','sourceAccountMaskOnly'],'additionalProperties':False,
        'allOf':[{'if':{'properties':{'supportedReal':{'const':True}},'required':['supportedReal']},'then':{'properties':{'signerCertificates':{'minItems':1},'appVersions':{'minItems':1},'templateIds':{'minItems':1},'deviceEvidenceRefs':{'minItems':1},'finalityVerified':{'const':True},'privacyPassed':{'const':True}}}}]},
      'QuoteProfileSnapshot':{'type':'object','properties':{
        'sourceId':string,'adapterVersion':string,'instrumentOrGoldProfileId':string,'profileVersion':string,'rightsVersion':string,'rightsDigest':{'type':'string','pattern':'^[a-f0-9]{64}$'},
        'sourceCurrency':{'const':'VND'},'sourceUnit':{'enum':['share','chi','luong']},'canonicalUnit':{'enum':['share','chi']},'priceScale':{'enum':['1','1000']},'side':{'enum':['buy','sell','close']},
        'basis':{'enum':['UNADJUSTED_CLOSE','RETAIL_PRODUCT_BUY','RETAIL_PRODUCT_SELL','OWNER_MANUAL']},
        'locale':{'enum':['vi-VN','en-US']},'timePrecision':{'enum':['source_datetime','session_bound']},'timeSemantics':{'enum':['SOURCE_DATETIME','VERIFIED_SESSION_FINAL_BOUND']},
        'sourceBusinessDate':{'type':['string','null'],'format':'date'},'calendarVersion':{'type':['string','null'],'minLength':1,'maxLength':120},
        'finalityVerified':{'const':True},'sourceTimeZone':{'const':'Asia/Ho_Chi_Minh'},'normalizationVersion':{'const':'FW-SOURCE-NORMALIZATION-001'}},
        'required':['sourceId','adapterVersion','instrumentOrGoldProfileId','profileVersion','rightsVersion','rightsDigest','sourceCurrency','sourceUnit','canonicalUnit','priceScale','side','basis','locale','timePrecision','timeSemantics','sourceBusinessDate','calendarVersion','finalityVerified','sourceTimeZone','normalizationVersion'],'additionalProperties':False,
        'allOf':[{'if':{'properties':{'timeSemantics':{'const':'VERIFIED_SESSION_FINAL_BOUND'}}},'then':{'properties':{'timePrecision':{'const':'session_bound'},'calendarVersion':{'type':'string','minLength':1},'sourceBusinessDate':{'type':'string','format':'date'}}},'else':{'properties':{'timePrecision':{'const':'source_datetime'}}}},
                 {'if':{'properties':{'sourceUnit':{'const':'share'}}},'then':{'properties':{'canonicalUnit':{'const':'share'}}},'else':{'properties':{'canonicalUnit':{'const':'chi'}}}}]},
      'EntitlementSnapshot':{'type':'object','properties':{
        'id':string,'providerId':string,'rightsVersion':string,'evidenceRef':string,'evidenceDigest':{'type':'string','pattern':'^[a-f0-9]{64}$'},
        'use':{'enum':['OWNER_DISPLAY','SAAS_DISPLAY','FORECAST','EXTERNAL_MODEL']},'grantedCapabilities':{'type':'array','uniqueItems':True,'items':{'enum':rights},'maxItems':len(rights)},
        'approvedAt':{'type':'string','format':'date-time'},'approvedBy':string,'expiresAt':{'type':['string','null'],'format':'date-time'},
        'cacheScope':{'enum':['WORKSPACE','ENTITLEMENT']},'storageCompatible':{'const':True},'quotaConfigVersion':string,'configDigest':{'type':'string','pattern':'^[a-f0-9]{64}$'}},
        'required':['id','providerId','rightsVersion','evidenceRef','evidenceDigest','use','grantedCapabilities','approvedAt','approvedBy','expiresAt','cacheScope','storageCompatible','quotaConfigVersion','configDigest'],'additionalProperties':False}
    }
    for side,basis in [('close','UNADJUSTED_CLOSE'),('buy','RETAIL_PRODUCT_BUY'),('sell','RETAIL_PRODUCT_SELL')]:
        defs['QuoteProfileSnapshot']['allOf'].append({'if':{'properties':{'side':{'const':side}}},'then':{'properties':{'basis':{'enum':[basis,'OWNER_MANUAL']},'canonicalUnit':{'const':'share' if side=='close' else 'chi'}}}})
    base_caps=['automation','serverNonDisplay','cache','historicalRetention','backup','derivedValuation']
    defs['EntitlementSnapshot']['allOf']=[{'properties':{'grantedCapabilities':{'contains':{'const':cap}}}} for cap in base_caps]
    for use,cap in [('OWNER_DISPLAY','ownerDisplay'),('SAAS_DISPLAY','saasRedistribution'),('FORECAST','forecast'),('EXTERNAL_MODEL','externalModel')]:
        defs['EntitlementSnapshot']['allOf'].append({'if':{'properties':{'use':{'const':use}}},'then':{'properties':{'grantedCapabilities':{'contains':{'const':cap}}}}})
    put(D/'profile-schemas.json',{'$schema':'https://json-schema.org/draft/2020-12/schema','$id':'https://schemas.finweave.invalid/source-profiles-001','$defs':defs})
    maps=[
      ('bindCollector','owner','Ingestion',['collector_bindings'],['deviceId','packageName','accountId','parserProfileId','expectedVersion'],'No extra account discriminator wire field'),
      ('listCollectorBindings','owner','Ingestion',['collector_bindings'],None,'Owner scoped exact versioned bindings'),
      ('disableCollectorBinding','owner','Ingestion',['collector_bindings'],None,'Captured old versions never retagged'),
      ('listSourceSupport','owner','Ingestion',[],None,'Versioned public support registry; no cert/package guess'),
      ('ingestNotifications','device','Ingestion',['ingestion_receipts'],['deviceId','items','deviceEpoch','recoveryEpoch'],'Mandatory binding; no lifecycle/raw/fee fields'),
      ('processIngestionReceipt','worker','Ingestion',['ingestion_receipts','source_records'],None,'ACK not posted; Engine UoW authority'),
      ('listSources','owner','Ingestion',['sources'],None,'DB wallet maps to legacy bank group; manual/csv excluded here'),
      ('requestPriceRefresh','owner','Market',['refresh_jobs','jobs'],['holdingIds'],'Frozen rights/profile/basis'),
      ('executePriceRefresh','worker','Market',['refresh_jobs','quote_observations','provider_quota_buckets'],None,'Shared-key quota before every HTTP'),
      ('listPriceQuotes','owner','Market',['quote_observations'],None,'Derived quality at asOf'),
      ('recordPriceQuote','owner','Market',['quote_observations'],['holdingId','price','at','sourceId','fxVndPerUsd','fxAt','compatible'],'Manual; compatible client flag is not authority'),
      ('opsListSources','admin','Ops',['sources'],None,'Authorized health projection only, no private finance'),
    ]
    put(D/'contract-storage-map.json',{'apiRevision':policy['apiRevision'],'databaseRevision':policy['databaseRevision'],'wireChanges':False,'postgresChanges':False,
      'operations':[{'operationId':op,'actor':actor,'ownerModule':owner,'tables':tables,'exactInputFields':fields,'rule':rule} for op,actor,owner,tables,fields,rule in maps],
      'privatePayloadRegistryAddendum':{'objectKind':'market_entitlement_snapshot','ownerModule':'Market','schemaFile':'docs/sources/profile-schemas.json','schemaDef':'EntitlementSnapshot','maxBytes':262144,'genericCrud':False,'runtime':'NOT_RUN'},
      'metadataMappings':[{'table':'quote_observations','column':'profile_snapshot','schemaDef':'QuoteProfileSnapshot','wireFieldAdded':False},{'table':'provider_entitlements','column':'rights_version','resolves':'Exact tenant entitlement snapshot plus configDigest; not public grant'},{'table':'collector_bindings','column':'parser_profile_id','resolves':'Exact built-in parser metadata/version'}],
      'walletProjection':{'bank':'bank','wallet':'bank','price':'price','manual':None,'csv':None},
      'unbound':{'uploadable':False,'serverReceiptCreated':False,'nativeOutcome':'LOCAL_WARNING_AND_GAP_NO_UPLOAD'}})
    reqs=[
      ('source-options-and-decisions.md','Không cắt feature; synthetic/manual riêng live'),
      ('source-options-and-decisions.md','Provider/app/device thực chưa tự chọn thay owner'),
      ('collector-profiles.md','Package + signer lineage/set, không package-only'),
      ('collector-profiles.md','Exact tested app/OS/OEM/template/version support'),
      ('collector-profiles.md','Raw/OTP không disk/server/log/chat/model'),
      ('collector-profiles.md','Ambiguous/unbound local warning không fake binding'),
      ('collector-profiles.md','Bound incomplete/redacted exact DTO→Review'),
      ('collector-profiles.md','Pending/failed không auto actual'),
      ('collector-profiles.md','Locale/amount/direction/fee/FX conservative parse'),
      ('collector-profiles.md','Transport identity khác economic identity'),
      ('collector-profiles.md','Cross-device/manual/CSV dedupe có trusted evidence'),
      ('collector-profiles.md','Internal transfer/clearing/fee/refund correction'),
      ('collector-profiles.md','No complete coverage/bank proof claim'),
      ('market-normalization.md','SSI V3 read-only không V2/new trading'),
      ('market-normalization.md','Instrument/exchange/listing/type identity'),
      ('market-normalization.md','Price basis unadjusted/corporate actions separate'),
      ('market-normalization.md','Exact numeric range/locale/precision'),
      ('market-normalization.md','Gold scale1000/lượng10/purity/profile/side'),
      ('market-normalization.md','quoteAsOf/fetchedAt/recordedAt distinct'),
      ('market-normalization.md','Date-only/finality/calendar gate, no fake time'),
      ('market-normalization.md','Stale24h/versioned history/corrections'),
      ('market-normalization.md','Fallback compatibility/provenance'),
      ('entitlements-and-egress.md','Access/redisplay/derived/LLM rights distinct'),
      ('entitlements-and-egress.md','Retention/backup/history compatibility before activation'),
      ('entitlements-and-egress.md','Credential read-only/private and allowlisted egress'),
      ('entitlements-and-egress.md','Shared-key quota/header semantics/restore'),
      ('contract-storage-addendum.md','Exact API/DB/storage/private registry mappings'),
      ('contract-storage-addendum.md','Wallet DB→legacy bank wire projection'),
      ('operational-policy.md','Daily/manual source-independent scheduler honest'),
      ('operational-policy.md','Partial failure/last-good/typed error no raw logs'),
      ('operational-policy.md','Support drift/revoke/restore/health projections'),
      ('source-options-and-decisions.md','Free-first no unapproved fee/account/vendor calls'),
    ]
    procedures=[
      ('Rà inventory user/admin/mobile, chạy synthetic và manual/CSV khi mọi nguồn thật bị disable.','Đủ tính năng và41 AC vẫn trong backlog; UI báo synthetic/manual, không gọi hoặc gắn nhãn nguồn thật.'),
      ('Chưa chọn app/thiết bị rồi nhập một app khác shortlist; kiểm profile và setup.','Không tự enable VCB/MoMo, không quét rộng app; only selected/consented source đủ gates mới bật.'),
      ('Synthetic cùng package nhưng sai signer; kiểm rotation hợp lệ, unknown rotation và multi-signer thêm cert.','Signer giả/lineage chưa duyệt/multi-set sai đều bị chặn trước extract; phiên bản API24–27 có evidence riêng.'),
      ('Đổi appVersion/template/OEM/OS ra ngoài matrix đã kiểm; thử callback và source config cũ.','Pause profile không hỗ trợ, gap/reason có nhãn; source support chỉ true đúng matrix, không fallback regex chung.'),
      ('Phát synthetic notification chứa OTP/full account/memo; inspect Room/WAL/WorkData/log/crash/network/export sau crash và reboot.','Không raw/OTP/identity ngoài allowlist; chỉ masked normalized evidence encrypted được giữ đúng retention.'),
      ('Hai bindings cùng masked suffix hoặc không binding; sửa mapping khi queue cũ vẫn có dữ liệu.','Local warning+gap, không HTTP ingest/sentinel account; mapping mới không retag old items hoặc tạo cloud receipt giả.'),
      ('Binding hợp lệ nhưng masked/redacted/incomplete template; gửi đúng DTO và poll receipt/Review.','amount null/direction unknown khi thiếu; durable ACK có thể có nhưng actual không tự post; owner Review rõ.'),
      ('Pending→settled/failed, OS key thay/reuse, repeated final; include pending có debit source nhưng chưa credit destination.','Pending không actual; final chỉ đủ profile semantics mới Engine xử lý đúng một lần, failure/uncertain Review, không giả wire status.'),
      ('Số dùng separator sai locale, nhiều amount/net/fee, non-VND, balance-only, missing source time.','Không đoán tiền/phí/FX/số dư; unsupported/incomplete hoặc discard đúng profile, sourceOccurredAt null khác observedAt.'),
      ('Replay event/digest rồi gửi same amount/time nhưng different trusted reference hoặc revision.','Transport repeat không tác động lại; weak amount/time không suppress economic event; revisions không overwrite actual.'),
      ('Cùng movement từ hai devices rồi manual/CSV với trusted same reference; thêm record ref namespace khác.','Chỉ proven same economic identity link provenance delta0; namespace/weak match vào Review, không tự xóa event khác.'),
      ('Owner transfer bank→wallet hai legs đến đảo thứ tự, duplicate, delay; thêm fee/refund/correction.','Clearing/settlement/fee đúng một lần theo Engine; full-scope không double income/expense; immutable reversal+replacement khi sửa.'),
      ('Tắt quyền/force-stop/app không phát external notification; đối chiếu owner statement có giao dịch bị thiếu.','Hiện coverage gap/unknown, không suy đầy đủ từ lastSuccess hoặc activeNotifications; manual/CSV reconcile được.'),
      ('Authorized stub/PoC kiểm V3 paths/scopes; cố gọi trading/V2/redirect khác origin.','Read-only routes đúng version; không order/trading/V2 fallback, key không đi client; upstream V3 không đổi FinWeave v2.'),
      ('Catalogue ticker trùng sàn/tái niêm yết, CW/future, suspended/delisted và unknown symbol.','Đúng instrument/exchange/lifecycle; không auto cash-stock cho mọi securities, không xóa quantity/history hoặc định giá0.'),
      ('Nguồn trả adjusted close/corporate action, volume và quote close với cùng symbol.','Chỉ verified unadjusted close được chọn basis tương ứng; price job không sửa shares/cash hoặc suy dividend tự động.'),
      ('Giá fraction8/9digits, quá18integer, zero/NaN/exponent/HTMLerrorbody, grouping locale ambiguous.','Exact lexical/range trước cast; không round/clamp/Number; reject sai và giữ last-good, không insert row không serialize được.'),
      ('Hai synthetic bảng nghìnVND/chỉ và nghìnVND/lượng cùng giá quy đổi; đổi purity/brand/region/side.','Stored scale-expanded/sourceUnit đúng; valuation chia10 đúng một lần và không nhân purity; profile/side khác không tự tương thích.'),
      ('Fetch lại quote cũ sau thời gian dài và đọc sealed snapshot trước correction mới.','quoteAsOf không thay fetchedAt; read quality stale đúng elapsed; snapshot/cutoff frozen không đổi theo quote/rights/profile mới.'),
      ('Date-only final bar với/không verified calendar, quote tương lai, gold update time trống và session chưa đóng.','Chưa final/time mapping thì không publish; session-bound có provenance derived rõ, không bịa timestamp từ fetch hoặc weekday heuristic.'),
      ('Clock synthetic tại24h và24h+1s, weekend/suspension; provider correction sau snapshot.','Đúng24h chưa stale, hơn ngưỡng stale; marketClosed không reset age, correction append không sửa sealed history.'),
      ('Primary lỗi rồi fallback khác provider nhưng cùng profile; thử PNJ ring→SJC bar hoặc entitlement khác scope.','Chỉ explicit compatible rights/profile/basis/time mới fallback; provenance mới rõ, không cross-tenant cache hoặc thay quote history.'),
      ('Grant owner display nhưng không SaaS/export/derived/model; gọi các consumers tương ứng.','Mỗi use kiểm grant riêng; deny unknown/ngoài quyền trước egress/display; Agent không gửi licensed values/refs bí mật khi bị chặn.'),
      ('Entitlement TTL/history/backup không tương thích DB hiện hành; expiry/revoke khi snapshots/backups còn refs.','Không activate incompatible source; retention/purge quyết định bao phủ mọi copies, không xóa quote rồi vẫn leak qua history/export/forecast.'),
      ('Inject symbol/URL/query/nextPage trỏ metadata/private IP; redirect, TLS lỗi; inspect client APK/admin bundle/logs.','Allowlisted HTTPS routes/schema/public destination only; reject SSRF/redirect, không upstream secret/errorbody/raw trên clients/logs.'),
      ('Concurrent tenants chung credential, pagination/retry/unknowntimeout,429 Retry-After, restore bucket/key rotation.','Reserve mọi quota window atomically trước call, unknown charged, Retry-After floor giữ, restore/unknown reset semantics chặn egress; không vượt shared cap.'),
      ('Serialize API004 requests/replies và private metadata; test extra lifecycle/raw/account fields, tenant ref sai.','Exact schemas/owner refs reject; private registry bounded/capability-specific; không thêm table/column/field ngầm để qua test.'),
      ('Sources DB bank/wallet/price/manual/csv qua user/Ops list endpoints.','bank/wallet→legacy bank, price→price; manual/CSV dùng ports riêng, no enum wallet public; Ops không finance payload.'),
      ('Đóng mọi clients, chạy daily18h rồi stop host/miss days/manual doubleclick/cooldown.','Host enqueue durable jobs ngoài browser; catch-up latest eligible only, coalesce đúng scope, không đảm bảo price fresh khi provider chưa ready.'),
      ('Batch nhiều holdings có success/schema error/timeout/noquote; poll job và portfolio totals.','Per-item outcomes/partial/unknown honest, last-good từng holding; không allfresh từ HTTP200 hoặc fulltotal giả khi thiếu dữ liệu.'),
      ('Profile/source revoke hoặc format drift trong offline queue; restore oldDB với witness và missing receipts.','Live fences kiểm trước commit/egress; olditems không retag, missing receipt investigation; admin health only, source resume cần current rights/config.'),
      ('Cạn free quota/nguồn đòi trả phí/chưa có account, theo dõi external access và billing config.','Budget0 fail closed, không signup/pay/fallback né giới hạn; synthetic toàn feature vẫn chạy và real gates chưa được tính PASS.'),
    ]
    assert len(procedures)==len(reqs)==32
    put(D/'requirement-traceability.json',{'id':'FW-SOURCES-RTM-001','scope':'Adds source detail without replacing parent41 AC','requirements':[{'id':f'SRC-{i:02}','description':desc,'spec':doc,'acceptanceId':f'SRCR-{i:02}','procedure':procedures[i-1][0],'expectedRuntimeOutcome':procedures[i-1][1],'status':'SPECIFIED','runtime':'NOT_RUN'} for i,(doc,desc) in enumerate(reqs,1)]})
    md('acceptance-plan.md','''
# Source acceptance — runtime NOT RUN

32 SRCR dưới đây kế thừa41 AC hiện hành, không tuyên bố frontend/native/backend nghiệm thu mới. Static schema/model examples không kiểm bank parser hoặc giá thật. Evidence mỗi ca: immutable source/build/config/license refs, environment/device/app/template versions nếu liên quan, inputs **synthetic hoặc sanitized có consent**, expected/observed outcome, exact API/revision, negative cases, reviewer và date. Không raw/OTP/credentials/private transaction payload trong evidence repo/log.

| ID | Thao tác/đầu vào thực tế | Kết quả cần chứng minh | Trạng thái |
| --- | --- | --- | --- |
'''+ '\n'.join(f'| SRCR-{i:02} | {step} | {expected} | NOT RUN |' for i,(step,expected) in enumerate(procedures,1))+'''

Ưu tiên PoC rủi ro:03–09/12 notification và binding/finality,17–20 unit/time,23–26 rights/retention/quota,29–31 daily/partial/restore. Không bắt mua nguồn để kiểm synthetic adapters; real source hợp đồng chưa rõ thì đánh dấu BLOCKED_REAL_SOURCE, không PASS hoặc bỏ feature.

Không assert “API không phí nên SaaS0đ”, “package đúng nên notification tin cậy”, “67browser pass nên Android source supported”, “HTTP200 nên mọi holding fresh”, hoặc “device signed nên bank verified”. Real end-to-end phải từ capture/authorized provider→durable receipt/quote→Engine/valuation→user web/APK, admin chỉ metadata. SQL/native/cron/concurrency/restore/security/UAT/source licensing chưa được thực thi bởi package này.
''')
    files={
      'api':'docs/contracts/v2-t1-r4/openapi.json','database':'docs/data/target-t1-async/target-model.json',
      'asyncBundle':'docs/async/implementation-bundle.json','androidBundle':'docs/android/implementation-bundle.json',
      'security':'docs/security/t1/security-policy.json','domain':'docs/domain/domain-policy.json',
      'policy':'docs/sources/source-policy.json','registry':'docs/sources/provider-registry.json','profileSchemas':'docs/sources/profile-schemas.json','mapping':'docs/sources/contract-storage-map.json'}
    # Resolve existing immutable policy filenames from prior bundle if named differently.
    for key in ['security','domain']:
        if not (R/files[key]).exists():
            candidates=list((R/('docs/security/t1' if key=='security' else 'docs/domain')).glob('*policy*.json'))
            assert len(candidates)==1,(key,candidates)
            files[key]=candidates[0].relative_to(R).as_posix()
    put(D/'implementation-bundle.json',{'id':'FW-SOURCES-BUNDLE-20261009','status':'DESIGN_ONLY','apiRevision':policy['apiRevision'],'databaseRevision':policy['databaseRevision'],'nativeBridgeRevision':'FW-NATIVE-BRIDGE-002','files':{k:{'path':n,'sha256':sha(R/n)} for k,n in files.items()},'realProviders':'NOT_ACTIVATED','runtime':'NOT_RUN'})
    print(json.dumps({'status':'BUILT_DESIGN_ONLY','protectedFiles':len(json.loads((E/'preservation-before.json').read_text(encoding='utf-8'))['files']),'sourceFiles':len(list(D.glob('*'))),'runtime':'NOT_RUN'}))

if __name__=='__main__':main()
