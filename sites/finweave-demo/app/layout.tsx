import type { ReactNode } from 'react';
export const metadata = { title: 'FinWeave · Demo', description: 'Trải nghiệm FinWeave với dữ liệu mẫu, frontend hiện tại và backend demo trên cloud.' };
export default function RootLayout({ children }: { children: ReactNode }) { return <html lang="vi"><body>{children}</body></html>; }
