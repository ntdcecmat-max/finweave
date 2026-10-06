# Đưa FinWeave lên GitHub và liên kết Vercel

Repo đề xuất: **finweave-frontend**, tài khoản GitHub **DK999vn**. Repo riêng tư vẫn có thể dùng để xuất bản frontend demo qua Vercel. Hướng dẫn này dành cho repo mới, trống, chưa có README/commit.

## Push code lên GitHub

Mở PowerShell trong thư mục **Information Systems Modeling and Design** (thư mục chứa finweave-web), chạy:

```powershell
git init -b main
git add .
git status --short
git commit -m "Add FinWeave frontend demo"
git remote add origin https://github.com/DK999vn/finweave-frontend.git
git push -u origin main
```

Git có thể yêu cầu đăng nhập GitHub. Nếu chưa cấu hình commit identity, đặt user.name và user.email trong repo theo thông tin của bạn. Nếu repo đã được init/đặt remote, bỏ hai lệnh init và remote-add; không force push.

File .gitignore đã bỏ node_modules, dist, work, References, raw evidence, .env thật và .vercel. Kiểm git status trước commit. Source frontend, package-lock, public/mockServiceWorker.js và vercel.json phải được đưa lên repo.

## Import vào Vercel

1. Vào **Vercel → Add New → Project**.
2. Import repo **DK999vn/finweave-frontend**. Nếu không thấy repo, cấp quyền truy cập repo này cho kết nối GitHub/Vercel của bạn.
3. Thiết lập:

| Mục | Giá trị |
|---|---|
| Framework Preset | Vite |
| Root Directory | finweave-web |
| Build Command | npm run build |
| Output Directory | dist |
| Install Command | npm ci --ignore-scripts |
| Node.js Version | 24.x |
| Environment Variable | VITE_DATA_MODE=synthetic_mock |

4. Bấm **Deploy**, đợi build hoàn tất rồi mở **Visit** / Production URL. Đây là URL thực do Vercel cấp, không phải localhost. Người xem dùng **Điền thông tin mẫu → Đăng nhập demo → 123456**.

finweave-web/vercel.json đã cấu hình SPA rewrite để mở/reload /home/assets, /plan/goals, /data/review và các route khác. Mock worker được xuất bản cùng static bundle; không cần backend hay API key thật. Mỗi tab/người dùng có phiên dữ liệu giả riêng; reload trở về F-COMPLETE, không lưu backend.

## Cập nhật lần sau

```powershell
git add .
git commit -m "Update FinWeave frontend"
git push
```

Vercel Git integration tự tạo deployment từ commit mới. Chia sẻ Production URL sau khi deployment thành công. Tài liệu M2 và manifest cũ vẫn là hồ sơ nghiệm thu lịch sử; cấu hình Vercel là bổ sung theo yêu cầu sau M2.

Tài liệu chính thức: [Vite SPA trên Vercel](https://vercel.com/docs/frameworks/frontend/vite#using-vite-to-make-spas), [GitHub integration](https://vercel.com/docs/git/vercel-for-github).
