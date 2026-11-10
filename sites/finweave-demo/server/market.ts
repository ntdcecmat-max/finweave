export type MarketQuote = { price: string; currency: 'VND'; unit: 'share' | 'chi'; date: string; source: string };
export type MarketResult = { quote?: MarketQuote; error?: string };
type Fetcher = typeof fetch;
const publicBtmcKey = '3kd8ub1llcg9t45hnoh8hmn7t5kc2v'; // Published in BTMC's public API guide; not a private credential.
const stockSymbols: Record<string, string> = { VN_FPT: 'FPT', VN_VCB: 'VCB', VN_HPG: 'HPG' };
const goldCatalogs = ['G_RING_BUY', 'G_SJC_BUY', 'G_PNJ_RING_BUY', 'G_PNJ_SJC_BUY'];

function price(value: unknown): string {
  const text = String(value);
  if (!/^[1-9]\d{0,17}$/.test(text)) throw Error('INVALID_PRICE');
  return text;
}
function instant(value: string, now: number): string {
  const time = Date.parse(value);
  if (!Number.isFinite(time) || time > now + 60000 || time < Date.UTC(2000, 0, 1)) throw Error('INVALID_DATE');
  // Domain reporting groups instants by their GMT+7 civil date.
  return value;
}
export function parseStock(data: any, symbol: string, now = Date.now()): MarketQuote {
  const row = data?.data;
  if (data?.code !== 'SUCCESS' || row?.stockSymbol !== symbol || row.exchange !== 'hose' || row.tradingCurrencyISOCode !== 'VND' || !/^\d{8}$/.test(row.tradingDate)) throw Error('INVALID_STOCK');
  const d = row.tradingDate;
  const date = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
  const at = instant(date + 'T00:00:00+07:00', now);
  if (new Date(Date.parse(at) + 7 * 3600000).toISOString().slice(0, 10) !== date) throw Error('INVALID_DATE');
  // SSI's public snapshot supplies the session date, not the last trade timestamp.
  // Do not substitute request time, expectedLastUpdate or the previous close.
  return { price: price(row.matchedPrice), currency: 'VND', unit: 'share', date: at, source: `SSI iBoard · ${symbol}/HOSE · phiên ${date} (không có giờ khớp lệnh)` };
}
export function parseGold(data: any, catalog: string, now = Date.now()): MarketQuote {
  if (!['G_RING_BUY', 'G_SJC_BUY'].includes(catalog) || !Array.isArray(data?.DataList?.Data)) throw Error('INVALID_GOLD');
  const candidates = data.DataList.Data.flatMap((row: any) => {
    const index = row['@row'], name = row['@n_' + index];
    if (typeof name !== 'string' || row['@h_' + index] !== '999.9') return [];
    const matches = catalog === 'G_RING_BUY' ? /^NHẪN TRÒN TRƠN.*Rồng Thăng Long/i.test(name) : /^VÀNG MIẾNG SJC \(Vàng SJC\)$/i.test(name);
    if (!matches) return [];
    const match = /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/.exec(row['@d_' + index]);
    if (!match) return [];
    const [, d, m, y, h, minute] = match, date = `${y}-${m}-${d}T${h}:${minute}:00+07:00`;
    try {
      const at = instant(date, now);
      if (new Date(Date.parse(at) + 7 * 3600000).toISOString().slice(0, 16) !== date.slice(0, 16)) return [];
      return [{ price: price(row['@pb_' + index]), currency: 'VND' as const, unit: 'chi' as const, date: at, source: `BTMC · ${name} · mua vào · VND/chỉ` }];
    } catch { return []; }
  });
  candidates.sort((a: MarketQuote, b: MarketQuote) => Date.parse(b.date) - Date.parse(a.date));
  if (!candidates.length) throw Error('NO_COMPATIBLE_GOLD');
  return candidates[0];
}
async function json(url: string, fetcher: Fetcher) {
  const response = await fetcher(url, { signal: AbortSignal.timeout(8000), redirect: 'manual', headers: { Accept: 'application/json', 'User-Agent': 'FinWeave/1.0 (+https://finweave-demo.export-germany-hest.chatgpt.site)' } });
  if (!response.ok) throw Error(response.status === 429 ? 'RATE_LIMITED' : `UPSTREAM_HTTP_${response.status}`);
  const text = await response.text();
  if (text.length > 512000) throw Error('UPSTREAM_TOO_LARGE');
  return JSON.parse(text);
}
export function parsePnj(data: any, catalog: string, now = Date.now()): MarketQuote {
  const symbol = catalog === 'G_PNJ_RING_BUY' ? 'N24K' : catalog === 'G_PNJ_SJC_BUY' ? 'SJC' : null;
  const name = symbol === 'N24K' ? 'Nhẫn Trơn PNJ 999.9' : 'Vàng miếng SJC 999.9';
  if (!symbol || data?.chinhanh !== 'hochiminh' || !Array.isArray(data?.data)) throw Error('INVALID_PNJ');
  const row = data.data.find((r: any) => r.masp === symbol && r.tensp === name);
  const match = /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})$/.exec(data.updateDate);
  if (!row || !match) throw Error('INVALID_PNJ');
  const [, d, m, y, h, minute, second] = match, date = `${y}-${m}-${d}T${h}:${minute}:${second}+07:00`;
  instant(date, now);
  if (new Date(Date.parse(date) + 7 * 3600000).toISOString().slice(0, 19) !== date.slice(0, 19)) throw Error('INVALID_DATE');
  // PNJ explicitly publishes 1,000 VND/chi; convert exactly once to the domain unit.
  return { price: price(String(BigInt(price(row.giamua)) * BigInt(1000))), currency: 'VND', unit: 'chi', date, source: `PNJ · TP.HCM · ${name} · mua vào · VND/chỉ` };
}
const cache = new Map<string, { until: number; result: MarketResult }>();
const flights = new Map<string, Promise<MarketResult>>();
export async function fetchMarket(catalogs: string[], fetcher: Fetcher = fetch): Promise<Record<string, MarketResult>> {
  let gold: Promise<any> | undefined;
  let pnj: Promise<any> | undefined;
  const entries = await Promise.all([...new Set(catalogs)].map(async catalog => {
    if (!stockSymbols[catalog] && !goldCatalogs.includes(catalog)) return [catalog, { error: 'Mã hoặc bảng giá chưa được hỗ trợ.' }] as const;
    const cached = cache.get(catalog);
    if (fetcher === fetch && cached && cached.until > Date.now()) return [catalog, cached.result] as const;
    let flight = fetcher === fetch ? flights.get(catalog) : undefined;
    if (!flight) {
      flight = (async (): Promise<MarketResult> => {
        try {
          const symbol = stockSymbols[catalog];
          const quote = symbol ? parseStock(await json(`https://iboard-query.ssi.com.vn/stock/${symbol}`, fetcher), symbol) : catalog.startsWith('G_PNJ_') ? parsePnj(await (pnj ??= json('https://edge-cf-api.pnj.io/ecom-frontend/v1/get-gold-price?zone=00', fetcher)), catalog) : parseGold(await (gold ??= json(`https://api.btmc.vn/api/BTMCAPI/getpricebtmc?key=${publicBtmcKey}`, fetcher)), catalog);
          return { quote };
        } catch (error) {
          console.warn('MARKET_FETCH_FAILURE', catalog, (error as Error).message);
          return { error: (error as Error).message === 'RATE_LIMITED' ? 'Nguồn đang giới hạn lượt gọi. Giữ giá gần nhất; thử lại sau.' : 'Chưa lấy được giá hợp lệ từ nguồn. Giữ giá gần nhất; thử lại sau.' };
        }
      })();
      if (fetcher === fetch) { flights.set(catalog, flight); void flight.then(result => { cache.set(catalog, { result, until: Date.now() + 60000 }); flights.delete(catalog); }); }
    }
    return [catalog, await flight] as const;
  }));
  return Object.fromEntries(entries);
}
