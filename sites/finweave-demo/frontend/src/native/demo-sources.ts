// Local display metadata, never sent as a package/profile/binding to API005.
// Missing verified Android input means there is no live source profile to enable.
export const demoSources = [
  { id: 'vcb', name: 'Vietcombank (VCB)', logo: '/source-logos/vcb.png', reason: 'Parser văn bản ứng viên v1 · 2 fixture tổng hợp. Chưa xác minh notification Android, package, signer, phiên bản, timezone và finality trên thiết bị.' },
  { id: 'zalopay', name: 'ZaloPay', logo: '/source-logos/zalopay.png', reason: 'Có bộ đọc ứng viên theo câu chữ chung và bài test dữ liệu giả. Phiên Android đọc thử số tiền/hướng tiền cục bộ; chưa đối chiếu mẫu giao dịch ZaloPay thật hoặc tự ghi sổ.' },
] as const;
