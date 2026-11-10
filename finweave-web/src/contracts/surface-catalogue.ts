/** Per-screen v3 catalogue. Implementation is not acceptance; checks require run evidence. */
export interface ScreenSurface {
 id:string; surface:'user'|'auth'|'shared'|'android'|'admin'; title:string; route:string|null;
 source:string; implementation:'mock'|'partial'|'redirect'|'native_pending';
 integration?:{apiRevision:string;nativeRevision:string;transport:string;status:string;evidence:string};
 parentAC:string[]; checks:string[]; contract:string; unverified:string; spec:string;
}
export const screenCatalogue:ScreenSurface[] = [
  {
    "id": "UI-U-01",
    "surface": "user",
    "title": "Tổng quan",
    "route": "/home",
    "source": "src/features/Home.tsx",
    "implementation": "mock",
    "parentAC": [
      "08",
      "13",
      "14",
      "20",
      "21"
    ],
    "checks": [
      "B02",
      "B12"
    ],
    "contract": "v1.1.0 synthetic HTTP + operational prototype 2.0.0 (chưa canonical v2)",
    "unverified": "UAT, dữ liệu thật và nguồn giá lịch sử",
    "spec": "screen-behavior-specification.md"
  },
  {
    "id": "UI-U-02",
    "surface": "user",
    "title": "Báo cáo tích hợp Tổng quan",
    "route": "/home/reports",
    "source": "src/features/Home.tsx",
    "implementation": "redirect",
    "parentAC": [
      "20",
      "21"
    ],
    "checks": [
      "B02",
      "B12"
    ],
    "contract": "v1.1.0 synthetic HTTP + operational prototype 2.0.0 (chưa canonical v2)",
    "unverified": "Không có trang Báo cáo riêng; route cũ về /home theo quyết định người dùng",
    "spec": "screen-behavior-specification.md"
  },
  {
    "id": "UI-U-03",
    "surface": "user",
    "title": "Tài khoản & Tài sản",
    "route": "/home/assets",
    "source": "src/features/Home.tsx",
    "implementation": "mock",
    "parentAC": [
      "01",
      "02",
      "03",
      "04",
      "05",
      "10",
      "34",
      "35",
      "36"
    ],
    "checks": [
      "B01",
      "B05",
      "B14",
      "B15",
      "OP01"
    ],
    "contract": "v1.1.0 synthetic HTTP + operational prototype 2.0.0 (chưa canonical v2)",
    "unverified": "Catalog/giá thực và lịch cập nhật server",
    "spec": "screen-behavior-specification.md"
  },
  {
    "id": "UI-U-04",
    "surface": "user",
    "title": "Tất cả giao dịch",
    "route": "/transactions",
    "source": "src/features/Transactions.tsx",
    "implementation": "mock",
    "parentAC": [
      "08",
      "11",
      "12"
    ],
    "checks": [
      "B03",
      "B06",
      "N01",
      "N07"
    ],
    "contract": "v1.1.0 synthetic HTTP + operational prototype 2.0.0 (chưa canonical v2)",
    "unverified": "Authorization và đồng bộ server thật",
    "spec": "screen-behavior-specification.md"
  },
  {
    "id": "UI-U-05",
    "surface": "user",
    "title": "Thu–chi",
    "route": "/transactions/flow",
    "source": "src/features/Transactions.tsx",
    "implementation": "mock",
    "parentAC": [
      "08",
      "11",
      "12"
    ],
    "checks": [
      "B12",
      "N07"
    ],
    "contract": "v1.1.0 synthetic HTTP + operational prototype 2.0.0 (chưa canonical v2)",
    "unverified": "Nguồn giao dịch thật",
    "spec": "screen-behavior-specification.md"
  },
  {
    "id": "UI-U-06",
    "surface": "user",
    "title": "Chuyển tiền",
    "route": "/transactions/transfers",
    "source": "src/features/Transactions.tsx",
    "implementation": "mock",
    "parentAC": [
      "08",
      "11",
      "15"
    ],
    "checks": [
      "B06",
      "B12"
    ],
    "contract": "v1.1.0 synthetic HTTP + operational prototype 2.0.0 (chưa canonical v2)",
    "unverified": "Thu thập hai chân từ nguồn thật",
    "spec": "screen-behavior-specification.md"
  },
  {
    "id": "UI-U-07",
    "surface": "user",
    "title": "Hoàn tiền",
    "route": "/transactions/refunds",
    "source": "src/features/Transactions.tsx",
    "implementation": "mock",
    "parentAC": [
      "08",
      "11",
      "15"
    ],
    "checks": [
      "B12",
      "N07"
    ],
    "contract": "v1.1.0 synthetic HTTP + operational prototype 2.0.0 (chưa canonical v2)",
    "unverified": "Đối soát nguồn thật",
    "spec": "screen-behavior-specification.md"
  },
  {
    "id": "UI-U-08",
    "surface": "user",
    "title": "Tổng quan kế hoạch",
    "route": "/plan",
    "source": "src/features/Plan.tsx",
    "implementation": "mock",
    "parentAC": [
      "22",
      "23",
      "39"
    ],
    "checks": [
      "B07",
      "OP03",
      "OP04"
    ],
    "contract": "v1.1.0 synthetic HTTP + operational prototype 2.0.0 (chưa canonical v2)",
    "unverified": "Hiệu chỉnh mô hình/Agent/provider thật",
    "spec": "screen-behavior-specification.md"
  },
  {
    "id": "UI-U-09",
    "surface": "user",
    "title": "Thu nhập & Chi tiêu dự kiến",
    "route": "/plan/items",
    "source": "src/features/Plan.tsx",
    "implementation": "mock",
    "parentAC": [
      "22",
      "23"
    ],
    "checks": [
      "B07",
      "B12"
    ],
    "contract": "v1.1.0 synthetic HTTP + operational prototype 2.0.0 (chưa canonical v2)",
    "unverified": "Plan server và đồng bộ nhiều client",
    "spec": "screen-behavior-specification.md"
  },
  {
    "id": "UI-U-10",
    "surface": "user",
    "title": "Đầu tư dự kiến",
    "route": "/plan/investments",
    "source": "src/features/Plan.tsx",
    "implementation": "mock",
    "parentAC": [
      "22",
      "23"
    ],
    "checks": [
      "B07",
      "B12"
    ],
    "contract": "v1.1.0 synthetic HTTP + operational prototype 2.0.0 (chưa canonical v2)",
    "unverified": "Phí/thuế/market assumptions; không auto trade",
    "spec": "screen-behavior-specification.md"
  },
  {
    "id": "UI-U-11",
    "surface": "user",
    "title": "Đặt mục tiêu",
    "route": "/plan/goals",
    "source": "src/features/Plan.tsx",
    "implementation": "mock",
    "parentAC": [
      "24",
      "25",
      "39"
    ],
    "checks": [
      "B08",
      "B13",
      "OP03"
    ],
    "contract": "v1.1.0 synthetic HTTP + operational prototype 2.0.0 (chưa canonical v2)",
    "unverified": "Khả năng đạt theo giả định, chưa là dự báo thị trường",
    "spec": "screen-behavior-specification.md"
  },
  {
    "id": "UI-U-12",
    "surface": "user",
    "title": "Mô phỏng tích hợp Đặt mục tiêu",
    "route": "/plan/simulation",
    "source": "src/features/Plan.tsx",
    "implementation": "redirect",
    "parentAC": [
      "26"
    ],
    "checks": [
      "B09",
      "B20",
      "S6-E11"
    ],
    "contract": "v1.1.0 synthetic HTTP + operational prototype 2.0.0 (chưa canonical v2)",
    "unverified": "Route cũ chuyển về Goals; mô phỏng cục bộ, không vĩ mô trực tiếp",
    "spec": "screen-behavior-specification.md"
  },
  {
    "id": "UI-U-13",
    "surface": "user",
    "title": "Nguồn dữ liệu & CSV",
    "route": "/data",
    "source": "src/features/DataLanding.tsx",
    "implementation": "mock",
    "parentAC": [
      "06",
      "07",
      "31"
    ],
    "checks": [
      "B04",
      "N03",
      "N05"
    ],
    "contract": "v1.1.0 synthetic HTTP + operational prototype 2.0.0 (chưa canonical v2)",
    "unverified": "Nguồn/collector server thật",
    "spec": "screen-behavior-specification.md"
  },
  {
    "id": "UI-U-14",
    "surface": "user",
    "title": "Kiểm tra dữ liệu",
    "route": "/data/review",
    "source": "src/features/Data.tsx",
    "implementation": "mock",
    "parentAC": [
      "15",
      "16",
      "32",
      "38"
    ],
    "checks": [
      "B03",
      "B04",
      "B06",
      "B20",
      "OP02"
    ],
    "contract": "v1.1.0 synthetic HTTP + operational prototype 2.0.0 (chưa canonical v2)",
    "unverified": "Ma trận thông báo/provider thật, AI investigation đầy đủ",
    "spec": "screen-behavior-specification.md"
  },
  {
    "id": "UI-U-15",
    "surface": "user",
    "title": "Trợ lý AI",
    "route": "/ai",
    "source": "src/features/Assistant.tsx",
    "implementation": "mock",
    "parentAC": [
      "27",
      "38",
      "39",
      "40"
    ],
    "checks": [
      "B10",
      "N04",
      "S6-E11",
      "OP03",
      "OP05"
    ],
    "contract": "v1.1.0 synthetic HTTP + operational prototype 2.0.0 (chưa canonical v2)",
    "unverified": "Scripted/rule based; không provider/LLM thật",
    "spec": "screen-behavior-specification.md"
  },
  {
    "id": "UI-U-16",
    "surface": "user",
    "title": "Lịch sử hội thoại",
    "route": "/ai/history",
    "source": "src/features/Assistant.tsx",
    "implementation": "mock",
    "parentAC": [
      "28",
      "40"
    ],
    "checks": [
      "B10",
      "N04",
      "N06"
    ],
    "contract": "v1.1.0 synthetic HTTP + operational prototype 2.0.0 (chưa canonical v2)",
    "unverified": "Persistence server qua restart",
    "spec": "screen-behavior-specification.md"
  },
  {
    "id": "UI-U-17",
    "surface": "user",
    "title": "Thiết lập & phiên",
    "route": null,
    "source": "src/features/Details.tsx",
    "implementation": "mock",
    "parentAC": [
      "01",
      "17",
      "18",
      "29"
    ],
    "checks": [
      "AUTH-UI-01",
      "B11",
      "OP07"
    ],
    "contract": "v1.1.0 synthetic HTTP + operational prototype 2.0.0 (chưa canonical v2)",
    "unverified": "Dialog, không route riêng; auth real/security gate riêng",
    "spec": "screen-behavior-specification.md"
  },
  {
    "id": "UI-U-18",
    "surface": "user",
    "title": "Thiết bị & đồng bộ",
    "route": "/data/devices",
    "source": "src/features/Devices.tsx",
    "implementation": "partial",
    "parentAC": [
      "29",
      "30",
      "31",
      "33"
    ],
    "checks": [
      "OP02",
      "OP07"
    ],
    "contract": "v1.1.0 synthetic HTTP + operational prototype 2.0.0 (chưa canonical v2)",
    "unverified": "Last-reported synthetic; không OS live hoặc background sync thật",
    "spec": "screen-behavior-specification.md"
  },
  {
    "id": "UI-U-19",
    "surface": "user",
    "title": "Chi tiết nguồn",
    "route": "/data/sources/:id",
    "source": "src/features/SourceDetails.tsx",
    "implementation": "partial",
    "parentAC": [
      "07",
      "31",
      "36"
    ],
    "checks": [
      "B04",
      "B05",
      "B16",
      "OP01"
    ],
    "contract": "v1.1.0 synthetic HTTP + operational prototype 2.0.0 (chưa canonical v2)",
    "unverified": "Pipeline thực, remap đúng device và hỗ trợ package thật",
    "spec": "screen-behavior-specification.md"
  },
  {
    "id": "UI-AUTH-01",
    "surface": "auth",
    "title": "Đăng nhập",
    "route": "/auth/login",
    "source": "src/features/Auth.tsx",
    "implementation": "mock",
    "parentAC": [
      "17",
      "29"
    ],
    "checks": [
      "AUTH-UI-01",
      "AUTH-UI-02"
    ],
    "contract": "identity v1.1.0 synthetic; không canonical auth v2",
    "unverified": "Không auth provider thật",
    "spec": "authentication-specification.md"
  },
  {
    "id": "UI-AUTH-02",
    "surface": "auth",
    "title": "Đăng ký",
    "route": "/auth/register",
    "source": "src/features/Auth.tsx",
    "implementation": "mock",
    "parentAC": [
      "17",
      "29"
    ],
    "checks": [
      "AUTH-UI-03"
    ],
    "contract": "identity v1.1.0 synthetic; không canonical auth v2",
    "unverified": "Policy/delivery production",
    "spec": "authentication-specification.md"
  },
  {
    "id": "UI-AUTH-03",
    "surface": "auth",
    "title": "Xác minh",
    "route": "/auth/verify",
    "source": "src/features/Auth.tsx",
    "implementation": "mock",
    "parentAC": [
      "17",
      "29"
    ],
    "checks": [
      "AUTH-UI-02",
      "AUTH-UI-03"
    ],
    "contract": "identity v1.1.0 synthetic; không canonical auth v2",
    "unverified": "OTP thật và abuse control",
    "spec": "authentication-specification.md"
  },
  {
    "id": "UI-AUTH-04",
    "surface": "auth",
    "title": "Quên mật khẩu",
    "route": "/auth/forgot",
    "source": "src/features/Auth.tsx",
    "implementation": "mock",
    "parentAC": [
      "17",
      "29"
    ],
    "checks": [
      "AUTH-UI-04"
    ],
    "contract": "identity v1.1.0 synthetic; không canonical auth v2",
    "unverified": "Email delivery/recovery trust",
    "spec": "authentication-specification.md"
  },
  {
    "id": "UI-AUTH-05",
    "surface": "auth",
    "title": "Đặt lại mật khẩu",
    "route": "/auth/reset",
    "source": "src/features/Auth.tsx",
    "implementation": "mock",
    "parentAC": [
      "17",
      "29"
    ],
    "checks": [
      "AUTH-UI-04"
    ],
    "contract": "identity v1.1.0 synthetic; không canonical auth v2",
    "unverified": "Recovery production",
    "spec": "authentication-specification.md"
  },
  {
    "id": "UI-AUTH-06",
    "surface": "auth",
    "title": "Hết phiên",
    "route": "/auth/expired",
    "source": "src/features/Auth.tsx",
    "implementation": "mock",
    "parentAC": [
      "17",
      "29"
    ],
    "checks": [
      "AUTH-UI-05"
    ],
    "contract": "identity v1.1.0 synthetic; không canonical auth v2",
    "unverified": "Token refresh/uncertain commit server",
    "spec": "authentication-specification.md"
  },
  {
    "id": "UI-AUTH-07",
    "surface": "auth",
    "title": "Từ chối quyền",
    "route": "/auth/denied",
    "source": "src/features/Auth.tsx",
    "implementation": "mock",
    "parentAC": [
      "17",
      "29"
    ],
    "checks": [
      "AUTH-UI-06"
    ],
    "contract": "identity v1.1.0 synthetic; không canonical auth v2",
    "unverified": "Authorization production, không chỉ menu",
    "spec": "authentication-specification.md"
  },
  {
    "id": "UI-AUTH-08",
    "surface": "auth",
    "title": "Tài khoản & phiên",
    "route": null,
    "source": "src/features/Details.tsx",
    "implementation": "mock",
    "parentAC": [
      "17",
      "29"
    ],
    "checks": [
      "AUTH-UI-05",
      "OP07"
    ],
    "contract": "identity v1.1.0 synthetic; không canonical auth v2",
    "unverified": "Native queue quarantine và logout server thật",
    "spec": "authentication-specification.md"
  },
  {
    "id": "UI-S-01",
    "surface": "shared",
    "title": "Tài khoản: chi tiết & nhập tay",
    "route": null,
    "source": "src/features/Details.tsx",
    "implementation": "mock",
    "parentAC": [
      "01",
      "02",
      "03",
      "09"
    ],
    "checks": [
      "B01",
      "B03"
    ],
    "contract": "v1.1.0 + operational prototype; local forecast engine",
    "unverified": "Persistence/ownership production",
    "spec": "screen-behavior-specification.md"
  },
  {
    "id": "UI-S-02",
    "surface": "shared",
    "title": "Tài sản: catalog/profile & chi tiết",
    "route": null,
    "source": "src/features/AssetSetup.tsx",
    "implementation": "mock",
    "parentAC": [
      "04",
      "05",
      "10",
      "34",
      "35"
    ],
    "checks": [
      "B05",
      "B14",
      "OP01"
    ],
    "contract": "v1.1.0 + operational prototype; local forecast engine",
    "unverified": "Catalog/provider thật",
    "spec": "screen-behavior-specification.md"
  },
  {
    "id": "UI-S-03",
    "surface": "shared",
    "title": "Giao dịch: nhập/chi tiết/lịch sử",
    "route": null,
    "source": "src/features/Details.tsx",
    "implementation": "mock",
    "parentAC": [
      "08",
      "11",
      "12"
    ],
    "checks": [
      "B03",
      "B06",
      "N01"
    ],
    "contract": "v1.1.0 + operational prototype; local forecast engine",
    "unverified": "Server concurrency/security",
    "spec": "screen-behavior-specification.md"
  },
  {
    "id": "UI-S-04",
    "surface": "shared",
    "title": "Quyết định Review",
    "route": null,
    "source": "src/features/Details.tsx",
    "implementation": "mock",
    "parentAC": [
      "15",
      "16",
      "32",
      "38"
    ],
    "checks": [
      "B03",
      "B04",
      "B20",
      "OP02"
    ],
    "contract": "v1.1.0 + operational prototype; local forecast engine",
    "unverified": "Native/parser/review matrix đầy đủ",
    "spec": "screen-behavior-specification.md"
  },
  {
    "id": "UI-S-05",
    "surface": "shared",
    "title": "Bản nháp liên kết Plan/Goal",
    "route": "/plan/drafts/:id",
    "source": "src/features/AgentPlanning.tsx",
    "implementation": "mock",
    "parentAC": [
      "22",
      "24",
      "26",
      "39",
      "40"
    ],
    "checks": [
      "OP03",
      "OP04"
    ],
    "contract": "v1.1.0 + operational prototype; local forecast engine",
    "unverified": "Không canonical PlanDraft API hoặc provider thật",
    "spec": "screen-behavior-specification.md"
  },
  {
    "id": "UI-S-06",
    "surface": "shared",
    "title": "Preview → xác nhận",
    "route": null,
    "source": "src/components/ActionForm.tsx",
    "implementation": "mock",
    "parentAC": [
      "08",
      "12",
      "22",
      "24",
      "41"
    ],
    "checks": [
      "N01",
      "S6-E01",
      "S6-E02",
      "S6-E03",
      "OP04"
    ],
    "contract": "v1.1.0 + operational prototype; local forecast engine",
    "unverified": "Atomic DB/recovery hạ tầng thật",
    "spec": "screen-behavior-specification.md"
  },
  {
    "id": "UI-S-07",
    "surface": "shared",
    "title": "Agent run & ràng buộc",
    "route": null,
    "source": "src/features/AgentPlanning.tsx",
    "implementation": "partial",
    "parentAC": [
      "38",
      "39",
      "40"
    ],
    "checks": [
      "OP03",
      "OP05"
    ],
    "contract": "v1.1.0 + operational prototype; local forecast engine",
    "unverified": "Rule based; budget/model/tool security chưa nghiệm thu production",
    "spec": "screen-behavior-specification.md"
  },
  {
    "id": "UI-S-08",
    "surface": "shared",
    "title": "Panel ngữ cảnh & linh vật",
    "route": null,
    "source": "src/components/FloatingPet.tsx",
    "implementation": "mock",
    "parentAC": [
      "19",
      "27",
      "28",
      "40"
    ],
    "checks": [
      "B10",
      "B11",
      "B13",
      "PET"
    ],
    "contract": "v1.1.0 + operational prototype; local forecast engine",
    "unverified": "Android TalkBack và native Back",
    "spec": "screen-behavior-specification.md"
  },
  {
    "id": "UI-S-09",
    "surface": "shared",
    "title": "CSV wizard",
    "route": null,
    "source": "src/features/ImportWizard.tsx",
    "implementation": "mock",
    "parentAC": [
      "06",
      "41"
    ],
    "checks": [
      "B04",
      "N03",
      "N05",
      "S6-E05"
    ],
    "contract": "v1.1.0 + operational prototype; local forecast engine",
    "unverified": "Production limits/retention",
    "spec": "screen-behavior-specification.md"
  },
  {
    "id": "UI-S-10",
    "surface": "shared",
    "title": "Jobs & receipt",
    "route": null,
    "source": "src/features/ImportJobs.tsx",
    "implementation": "partial",
    "parentAC": [
      "06",
      "32",
      "33",
      "36",
      "41"
    ],
    "checks": [
      "N03",
      "OP01",
      "OP02"
    ],
    "contract": "v1.1.0 + operational prototype; local forecast engine",
    "unverified": "Daily server scheduler, outbox native, restore infra",
    "spec": "screen-behavior-specification.md"
  },
  {
    "id": "UI-M-01",
    "surface": "android",
    "title": "Giải thích & xin quyền",
    "route": "/data/android",
    "source": "src/features/Devices.tsx",
    "implementation": "native_pending",
    "parentAC": [
      "30",
      "31"
    ],
    "checks": [
      "OP02",
      "OP07"
    ],
    "contract": "bridge interface + synthetic setup; chưa native/server canonical",
    "unverified": "Browser chỉ minh họa consent; OS handoff chưa chạy trên Android",
    "spec": "android-ui-specification.md"
  },
  {
    "id": "UI-M-02",
    "surface": "android",
    "title": "Chọn ứng dụng nguồn",
    "route": "/data/android",
    "source": "src/features/Devices.tsx",
    "implementation": "native_pending",
    "parentAC": [
      "31"
    ],
    "checks": [
      "OP02"
    ],
    "contract": "bridge interface + synthetic setup; chưa native/server canonical",
    "unverified": "Allowlist synthetic; chưa matrix appVersion/package thật",
    "spec": "android-ui-specification.md"
  },
  {
    "id": "UI-M-03",
    "surface": "android",
    "title": "Gắn tài khoản",
    "route": "/data/android",
    "source": "src/features/Devices.tsx",
    "implementation": "native_pending",
    "parentAC": [
      "31",
      "32"
    ],
    "checks": [
      "OP02"
    ],
    "contract": "bridge interface + synthetic setup; chưa native/server canonical",
    "unverified": "Binding synthetic; chưa multi-account native",
    "spec": "android-ui-specification.md"
  },
  {
    "id": "UI-M-04",
    "surface": "android",
    "title": "Kiểm tra thiết lập",
    "route": "/data/android",
    "source": "src/features/Devices.tsx",
    "implementation": "native_pending",
    "parentAC": [
      "30",
      "31",
      "32"
    ],
    "checks": [
      "OP02"
    ],
    "contract": "bridge interface + synthetic setup; chưa native/server canonical",
    "unverified": "Receipt minh họa thiếu thông tin; không notification thật",
    "spec": "android-ui-specification.md"
  },
  {
    "id": "UI-M-05",
    "surface": "android",
    "title": "Trạng thái & hàng đợi",
    "route": "/data/android",
    "source": "src/native/collector.ts",
    "implementation": "native_pending",
    "parentAC": [
      "31",
      "33",
      "41"
    ],
    "checks": [
      "OP02",
      "OP07"
    ],
    "contract": "bridge interface + synthetic setup; chưa native/server canonical",
    "unverified": "Chưa native persistence/restart/reboot/OEM/offline ACK",
    "spec": "android-ui-specification.md"
  },
  {
    "id": "UI-M-06",
    "surface": "android",
    "title": "Cài/cập nhật APK",
    "route": "/data/devices",
    "source": "src/features/Devices.tsx",
    "implementation": "native_pending",
    "parentAC": [
      "30"
    ],
    "checks": [
      "OP07"
    ],
    "contract": "bridge interface + synthetic setup; chưa native/server canonical",
    "unverified": "Chưa signed APK, signing metadata, cài/update/real-device evidence",
    "spec": "android-ui-specification.md"
  },
  {
    "id": "UI-ADM-01",
    "surface": "admin",
    "title": "Tổng quan vận hành",
    "route": "/admin/overview",
    "source": "admin/AdminApp.tsx",
    "implementation": "mock",
    "parentAC": [
      "29",
      "37"
    ],
    "checks": [
      "OP06"
    ],
    "contract": "adminGateway in-memory + strict metadata DTO; không HTTP canonical v2",
    "unverified": "Admin API/session thật chưa triển khai",
    "spec": "admin-ui-specification.md"
  },
  {
    "id": "UI-ADM-02",
    "surface": "admin",
    "title": "Tài khoản SaaS & thiết bị",
    "route": "/admin/accounts",
    "source": "admin/AdminApp.tsx",
    "implementation": "mock",
    "parentAC": [
      "29",
      "37"
    ],
    "checks": [
      "OP06"
    ],
    "contract": "adminGateway in-memory + strict metadata DTO; không HTTP canonical v2",
    "unverified": "Metadata only, không bank accounts; quyền server chưa chứng minh",
    "spec": "admin-ui-specification.md"
  },
  {
    "id": "UI-ADM-03",
    "surface": "admin",
    "title": "Nguồn & bộ đọc",
    "route": "/admin/sources",
    "source": "admin/AdminApp.tsx",
    "implementation": "mock",
    "parentAC": [
      "37"
    ],
    "checks": [
      "OP06"
    ],
    "contract": "adminGateway in-memory + strict metadata DTO; không HTTP canonical v2",
    "unverified": "Disable preview/audit cục bộ; change pipeline thật chưa có",
    "spec": "admin-ui-specification.md"
  },
  {
    "id": "UI-ADM-04",
    "surface": "admin",
    "title": "Tác vụ",
    "route": "/admin/jobs",
    "source": "admin/AdminApp.tsx",
    "implementation": "mock",
    "parentAC": [
      "37"
    ],
    "checks": [
      "OP06"
    ],
    "contract": "adminGateway in-memory + strict metadata DTO; không HTTP canonical v2",
    "unverified": "Retry/lease/idempotency mock, chưa worker server",
    "spec": "admin-ui-specification.md"
  },
  {
    "id": "UI-ADM-05",
    "surface": "admin",
    "title": "Hạn mức",
    "route": "/admin/quotas",
    "source": "admin/AdminApp.tsx",
    "implementation": "mock",
    "parentAC": [
      "37"
    ],
    "checks": [
      "OP06"
    ],
    "contract": "adminGateway in-memory + strict metadata DTO; không HTTP canonical v2",
    "unverified": "Read-only quota fixture, không provider billing thật",
    "spec": "admin-ui-specification.md"
  },
  {
    "id": "UI-ADM-06",
    "surface": "admin",
    "title": "Phiên bản Android",
    "route": "/admin/releases",
    "source": "admin/AdminApp.tsx",
    "implementation": "mock",
    "parentAC": [
      "30",
      "37"
    ],
    "checks": [
      "OP06"
    ],
    "contract": "adminGateway in-memory + strict metadata DTO; không HTTP canonical v2",
    "unverified": "Không artifact verified hoặc download APK giả",
    "spec": "admin-ui-specification.md"
  },
  {
    "id": "UI-ADM-07",
    "surface": "admin",
    "title": "Sự cố & nhật ký",
    "route": "/admin/incidents",
    "source": "admin/AdminApp.tsx",
    "implementation": "mock",
    "parentAC": [
      "37",
      "41"
    ],
    "checks": [
      "OP06"
    ],
    "contract": "adminGateway in-memory + strict metadata DTO; không HTTP canonical v2",
    "unverified": "Audit in-memory, chưa immutable storage/restore",
    "spec": "admin-ui-specification.md"
  }
];
for(const screen of screenCatalogue)screen.integration={apiRevision:'FW-API-T1-D1J2-005',nativeRevision:'FW-NATIVE-BRIDGE-003',transport:screen.surface==='admin'?'Ops HTTP cookie/CSRF':screen.surface==='android'?'Native owner/collector broker':'User HTTP cookie/CSRF or native owner broker',status:screen.surface==='android'?'BUILD_JVM_DEVICE_E2E_NOT_RUN':'LOCAL_HTTP_ADAPTER_SEE_TESTED_SUBSET',evidence:'docs/frontend/be19-report.md'};
