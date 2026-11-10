> AI-SPEC-001 — 08/10/2026: nguồn chức năng AI hiện hành là [đặc tả hợp nhất](../product/ai-agent-specification.md). Các mô tả scripted/read-only bên dưới ghi implementation/mock cũ; chat/history/mascot được kế thừa, Agent có quyền tạo draft theo spec và owner xác nhận riêng để áp dụng. Không hiểu mô tả mock như yêu cầu xóa capability cũ hoặc cấm draft mới.

# Pattern Library v0.1

DES-PAT-001 · 06/10/2026 · scope-v2/analysis-v2 · patterns đã render và thao tác; AG self-review, PO pending. Snippets dưới đây lấy từ components/consumers đã chạy, giữ API thật. [Gallery](http://127.0.0.1:4179/design), [component specifications](component-specifications.md), [IA/flows](ux-ui-specification.md).

## Templates đủ năm navigation

| Template / route | Hierarchy và composition | Primary action / trạng thái cần giữ |
|---|---|---|
| Home `/home`, `/home/reports`, `/home/assets` | kỳ/scope/coverage → cash hero + tracked assets → income/gross/refund/net → flow/spend → allocation/account list → rule insights. Assets tab tiền3loại, holdings2loại | Ghi giao dịch/thêm account/holding; metric→formula; chart→list/detail. Unknown tách known subtotal; Reports không vẽ biến động giá khi thiếu opening quote |
| Giao dịch `/transactions` | 4 tabs Tất cả/Thu–chi/Chuyển/Hoàn → search/filter → posted list + pending/draft axes → detail/audit | Ghi transaction, category/correction, plan link; filter empty có clear. Mobile card giữ amount/date/source/status |
| Plan `/plan`, `/plan/items`, `/plan/investments`, `/plan/goals`, `/plan/simulation` | Dự kiến/assumptions → forecast + actual/remaining → item table/timeline; Goals backing+progress; Simulation frozen comparison | Create/edit/archive, actual link/unlink, allocate/release/achieve, simulate3modes. CTA simulation disabled khi chưa goal và empty dẫn tạo goal |
| Dữ liệu `/data`, `/data/review` | source capability/connection/time/action → CSV staging/mapping/raw+normalized → subset → job history; Review case/quality → evidence+proposal | Refresh/fail/revoke/reconnect, import/cancel/retry, xử lý từng loại case. Preview chưa xuất bản job/case; lỗi giữ dữ liệu tốt cuối |
| Trợ lý AI `/ai`, `/ai/history` + panel dùng chung | scripted label + captured context → prompt/processing → result/ref/action → composer; history version cũ | Send/cancel/drill/open full/history; failure/no-data không số giả. Header mascot44px ở cả5nav; Escape trả focus; reset clear conversation |

## Filter → drill → back

Một period/scope URL dùng chung cho5nav. Giao dịch thêm category/account/posting/reconciliation/search/type/plan. Chart “Ăn uống” đặt category đúng và xóa filter xung đột; giữ kỳ/scope. Holding mark mở detail `selected=holding:id`; account mark mở account; explanation `selected=formula:cash|assets|flow`. Close bỏ selected, browser Back khôi phục search trước đó. Tắt ví khỏi scope giải thích transfer qua ranh giới là flow, không biến thành chi.

Trong Home, caller sử dụng cùng callback cho chart và native button/table qua FinancialChart:

```tsx
<FinancialChart title="Cơ cấu phần tài sản đã biết" type="pie"
  time={fmtDate(snap.asof)} rows={assetRows}/>
```

`assetRows` do Home tạo từ snapshot, mỗi row chứa `onClick` tới account/holding. Tên/time phụ thuộc đúng source đang chạy; snippets chỉ lược bỏ context bao quanh, không mock số trong component.

## Form → preview → commit → result

ActionSpec mô tả fields và command kind; RHF giữ draft, boundary kiểm money/date/type/reference/version. Preview dùng clone store; người dùng nhìn sáu chỉ tiêu trước/sau tại business clock/full account, khác kỳ đang lọc được giải thích. Quay lại giữ input; Hủy không commit. Confirm reuse command key/version; disabled và lockClose khi busy. Error có restore/re-preview với input giữ. Mutation thành công cập nhật duy nhất Query store và toast/next detail; không auto-post một lần nữa từ visual.

API đang chạy của primitive và consumer:

```tsx
export function Button({variant='',className='',...props}:
  ButtonHTMLAttributes<HTMLButtonElement>&{variant?:string}) {
  return <button className={`btn ${variant} ${className}`} {...props}/>;
}

<Button variant="primary" disabled={busy} onClick={confirm}>
  {busy?'Đang xác nhận…':'Xác nhận'}
</Button>
```

Chữ busy nằm ở caller. Không sử dụng prop loading/busy chưa implement. `ActionForm` có field.when cho conditional fields và Zod+command validation; các business rules không chỉ kiểm ở UI.

## Import → staging → Review

CSV sample hoặc file synthetic UTF-8 ≤20 dòng. Account đích và mapping cột visible. Preview hiển thị raw, normalized, valid/blocked/duplicate; checkbox chỉ valid. Confirm subset qua ActionForm; invalid/duplicate thành Review sau commit, không trước. Cùng batch+payload+account+mapping+selected retry trả cùng kết quả; payload đổi cần batch/preview mới. Hai records cùng tiền/ngày không ref không tự gộp. Source revision amount giữ nguyên chỉ tăng evidence; amount khác correction delta, giữ category override.

Review detail đặt nguyên nhân và evidence trước action. Lựa chọn tùy loại, không nút “Approve all”. Cash count chỉ observation; difference có thể forgotten expense hoặc unknown adjustment, hai impact khác nhau. Transfer một chân chưa có proof không tự tăng wallet/cash. Quote/quantity/source freshness riêng, dẫn đúng form/nguồn; “Để sau” giữ case mở có history.

Evidence container và freshness dùng thật trong Sources:

```tsx
<Freshness time={s.lastSuccess} source={s.id}
  stale={isStale(store.clock,s.lastSuccess,48)}/>
<Evidence>Preview theo snapshot v{result?.version}. Chưa ghi thay đổi.</Evidence>
```

## Plan → actual → Goal → simulation

Plan bắt đầu từ baseline cash/assets thật trong fixture, giữ date/version/reason. Thu5m/chi2m/đầu tư1m không ghi actual; forecast33,1m cash. Sau actual4m/2,5m/0,5m linked10shares: actual32,1m; còn1m/0/0,5m; forecast32,6m, overspend500k và gap−500k. Link preview/confirm trên event detail; transfer khác kind bị chặn. Timeline monthly clamp ngày31 cuối tháng; chưa có market return distribution.

Goal target→allocate từ cash→funded tiến độ. Available account lấy full cash tại business clock, không theo report filter. Khi chi actual làm backing hụt, giữ allocation và giảm funded; achievement kiểm funded, archive/release chỉ earmark. Simulation giữ frozen baseline, góp1m×2 đạt5m vẫn31,1m cash; mua5m còn26,1m cash71,1m assets; invest1m cash30,1m assets76,1m. Cards giữ assumptions và version, mở form tính lại thành scenario mới; không slider chỉ thay text.

## Contextual chat và privacy

Header entry mở panel ở mọi navigation; cùng ChatProvider với `/ai` và history. Hiện context trước gửi. Lúc gửi clone snapshot/context; điều hướng khi pending không đổi nguồn result đang chờ. New context có nhãn khác, stale result giữ căn cứ cũ. Safe allowlist reads từ domain, không model/key/SQL. No authorized data/error/quota/timeout có message+retry, không cards thành công. Explicit cancel không result/ledger change. Source instructions không được thực thi.

Snippet MoneyValue trong preview/table đang chạy:

```tsx
<td className="num"><MoneyValue value={result?.after[k]??null}/></td>
```

Mask là state toàn app: value→••••; chart geometry/tooltip bỏ; goal bar bỏ; quantity/prompt/raw/history qua PrivateText; composer/form input bị chặn khi đang mask. Label source/time/unit vẫn cho biết dữ liệu là gì. Đây là che hiển thị trong prototype synthetic, không encryption/authorization.

## Render review và giới hạn

Wireframe section trong `/design` có5templates và link mở màn thật. Đã render trên1440×900,390×844,360×844, kiểm HTML/keyboard/screenshots; chỉnh hero stacking, long Vietnamese/number wrapping, focus return, mascot trong header và fault commit. [Report](validation-report.md) ghi lỗi, sửa và evidence. Patterns chưa được kiểm với người tham gia; không suy user hiểu vì automated tests pass.

## PAT-AUTH-01 / Auth gate, credential forms và session

Components chạy thật: `AuthProvider`, `AuthGate`, `AuthScreen`, nativefields/Button/Badge và MockAuthService. Gate nằm trước financial AppProvider; ownerdemo→5nav, localmemorydummycredentials, synthetic sessionmarker trong tab sessionStorage khôngsecret. Logout/expiry clears session/query/mockstore/chat/drafts. Register/recovery/challenge forms/error/success và denied routes ở AuthSpec. Không dùng real credentials/production crypto.

Snippet trích cấu trúc đang chạy trong src/main.tsx:

```tsx
<AuthProvider>
  <AuthGate>
    <AppProvider><App /></AppProvider>
  </AuthGate>
</AuthProvider>
```

AuthProvider/QueryClientProvider/BrowserRouter được import và bao như main.tsx; snippet là cấu trúc thật, không app thứhai. Catalogue /design dùng source interface-catalogue.ts, mởroutes/forms hiện có; buttons mởpanel/filter là local, query/mutation sau đó theo contract.

## Network patterns bước5 từ component đã chạy

Snippet đang dùng AppProvider (source đầy đủ tại app/context.tsx):

```tsx
const query = useQuery({queryKey:['fw','1.1.0','W-DEMO','presentation'],
  queryFn:({signal})=>readPresentation(signal),retry:false});
await executeAction(command,store);
await client.invalidateQueries({queryKey:['fw']});
await client.fetchQuery({queryKey:key,queryFn:({signal})=>readPresentation(signal)});
```

Snippet ImportJobs đang chạy: query listImportJobs qua services/queryOptions; refetchInterval250ms chỉ khi pending/running; completed/failed là terminal. ImportWizard gửi selectedRowIds cùng previewId/token; ActionForm previewImpact tới generic typed serverpreview trước confirm. Không tính tác động tiền từ CSV trong client.

Chat pattern: create conversation on first send → getOverview để capture SnapshotRefs → sendAssistantMessage202 → poll getAssistantMessage → invalidate conversation/history. Panel và full page cùng context provider. Cancel explicit mutation, late result không apply. UI filters/table/dialog/privacy local từ shared read snapshot; không gọi mutation chỉ để mở một panel.


## Pattern recovery v0.3 / bước6

Commit → ACKunknown: giữ immutable intent/key/input/options ở service, form cho retry đúng yêu cầu; không regenerate từ version mới. Knownconflict/validation → giữ fields, refetch/repreview; success chỉ đóng sau presentationrefetch. Mẫu chạy: ActionForm/presentation/context; [S6-E03](../execution/evidence/step6-browser-results.json). AIcancel → đợi serverACK;500 giữpending và nút retry, queuedcancel trướcsend không giả serverresult. Import initialloading chặn editCSV cho đến template response; emptydraft sau đó giữempty, epochdiscardoldpreview. Không thêm endpoint cho panel/filter/mask.
