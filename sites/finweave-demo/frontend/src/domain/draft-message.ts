import type { DraftBodyDTO } from '../contracts/operational';
/** A bounded synthetic adapter: explicit edits to a draft, never active financial commands. */
export function reviseDraftMessage(body: DraftBodyDTO, text: string): DraftBodyDTO {
    const next = structuredClone(body), input = text.trim().toLocaleLowerCase('vi');
    const numeric = input.match(/(?:góp|thu nhập|chi tiêu|dự phòng|mục tiêu)[^\d]*(\d[\d.,\s]*)\s*(?:vnd|đ|đồng|mỗi|\/|$)/);
    if (numeric) {
        const amount = numeric[1].replace(/[.,\s]/g, '');
        if (!/^\d{1,13}$/.test(amount) || Number(amount) > 1e12)
            throw Error('Số tiền chưa hợp lệ. Dùng VND, ví dụ “góp 2.000.000 VND mỗi tháng”.');
        if (input.startsWith('góp'))
            next.goal.contribution = amount;
        else if (input.startsWith('thu nhập'))
            next.income = amount;
        else if (input.startsWith('chi tiêu'))
            next.expense = amount;
        else if (input.includes('dự phòng'))
            next.reserve = amount;
        else if (input.startsWith('mục tiêu'))
            next.goal.target = amount;
        else
            throw Error('Chọn ô cụ thể để chỉnh số tiền này.');
        return next;
    }
    const deadline = input.match(/(?:hạn|gia hạn).*?(\d{4}-\d{2}-\d{2})/);
    if (deadline) {
        next.goal.due = deadline[1];
        return next;
    }
    const skip = input.match(/tháng\s*(\d{1,2})[\/\-](\d{4}).*?(?:không|bỏ|ngừng).*?góp/);
    if (skip) {
        const month = skip[2] + '-' + skip[1].padStart(2, '0');
        if (month < next.goal.start.slice(0, 7) || month > next.goal.due.slice(0, 7))
            throw Error('Tháng bỏ góp phải nằm trong lịch góp của mục tiêu.');
        next.goal.skipMonths = [...new Set([...next.goal.skipMonths, month])];
        return next;
    }
    throw Error('Bản minh họa hỗ trợ: “góp 2.000.000 VND mỗi tháng”, “thu nhập 20.000.000 VND”, “chi tiêu 8.000.000 VND”, “dự phòng 30.000.000 VND”, “hạn đến 2028-12-31”, “tháng 12/2026 không góp”. Các điều chỉnh khác dùng biểu mẫu.');
}
