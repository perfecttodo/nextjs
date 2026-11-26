import { NextRequest, NextResponse } from 'next/server';

interface PlaceSuccess {
  success: true;
  source: 'geocode' | 'expand' | 'direct';
  lat: number;
  lng: number;
  name: string;
  address: string;
  level?: string;
}

interface PlaceError {
  success: false;
  error: string;
  attempted: string[];
}

// ─────────────────────────────────────────────
// POST /api/amap-place
// Body: { input: string; key?: string; city?: string }
// ─────────────────────────────────────────────
export async function POST(
  req: NextRequest
): Promise<NextResponse<PlaceSuccess | PlaceError>> {
  let body: { input?: string; key?: string; city?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: '請求體必須是合法 JSON', attempted: [] },
      { status: 400 }
    );
  }

  const input = (body.input || '').trim();
  if (!input) {
    return NextResponse.json(
      { success: false, error: '缺少 input 參數', attempted: [] },
      { status: 400 }
    );
  }

  const amapKey = (body.key || '').trim() || process.env.AMAP_WEB_SERVICE_KEY || '';
  const city = (body.city || '').trim();

  // 從混合文本中分離 URL 與純文字
  const urls = extractUrls(input);
  const plainText = extractPlainText(input);
  const attempted: string[] = [];

  // ═══════════════════════════════════════════
  // 情況 A：純地名（無 URL）→ 優先 geocode
  // ═══════════════════════════════════════════
  if (urls.length === 0) {
    if (amapKey) {
      attempted.push('geocode');
      try {
        const geo = await tryGeocode(input, amapKey, city);
        if (geo) {
          return NextResponse.json({ success: true, source: 'geocode', ...geo });
        }
      } catch (e: any) {
        console.warn('[amap-place] geocode failed:', e.message);
      }
    }

    // 純座標文本
    attempted.push('direct');
    const direct = parseAmapShareText(input);
    if (direct) {
      return NextResponse.json({ success: true, source: 'direct', ...direct });
    }

    return NextResponse.json(
      {
        success: false,
        error: amapKey
          ? '無法解析此地址，請確認地名是否正確'
          : '未配置高德 Key，無法解析純地址。請貼上連結或座標，或在後端設定 AMAP_WEB_SERVICE_KEY。',
        attempted,
      },
      { status: 422 }
    );
  }

  // ═══════════════════════════════════════════
  // 情況 B：包含 URL → 優先處理 URL（更精確）
  // ═══════════════════════════════════════════
  attempted.push('url');
  for (const url of urls) {
    const result = await tryParseUrl(url, plainText);
    if (result) {
      return NextResponse.json({
        success: true,
        source: result.source,
        ...result.data,
      });
    }
  }

  // URL 處理失敗，對整段輸入做直接解析（兜底）
  attempted.push('direct');
  const directAll = parseAmapShareText(input);
  if (directAll) {
    return NextResponse.json({ success: true, source: 'direct', ...directAll });
  }

  // 最後對純文字部分做 geocode（有 Key 時）
  if (amapKey && plainText) {
    attempted.push('geocode-text');
    try {
      const geo = await tryGeocode(plainText, amapKey, city);
      if (geo) {
        return NextResponse.json({ success: true, source: 'geocode', ...geo });
      }
    } catch (e: any) {
      console.warn('[amap-place] geocode plain text failed:', e.message);
    }
  }

  return NextResponse.json(
    {
      success: false,
      error: amapKey
        ? '連結與地址均無法解析，請確認輸入是否正確'
        : '未配置高德 Key，且短連結無法展開。請在後端設定 AMAP_WEB_SERVICE_KEY，或貼上完整長連結。',
      attempted,
    },
    { status: 422 }
  );
}

// ─────────────────────────────────────────────
// 從單一 URL 解析座標（先長連結，再短連結展開）
// ─────────────────────────────────────────────
async function tryParseUrl(
  url: string,
  fallbackName: string
): Promise<{
  source: 'expand' | 'direct';
  data: { lat: number; lng: number; name: string; address: string };
} | null> {
  // 1. 直接解析（可能是長連結）
  const direct = parseAmapShareText(url);
  if (direct) {
    if (!direct.name && fallbackName) {
      direct.name = extractNameFromPlainText(fallbackName);
    }
    return { source: 'direct', data: direct };
  }

  // 2. 短連結展開
  if (/surl\.amap\.com\//i.test(url)) {
    try {
      const expanded = await expandShortLink(url);
      if (expanded) {
        const parsed = parseAmapShareText(expanded);
        if (parsed) {
          if (!parsed.name && fallbackName) {
            parsed.name = extractNameFromPlainText(fallbackName);
          }
          return { source: 'expand', data: parsed };
        }
      }
    } catch (e: any) {
      console.warn('[amap-place] expand failed for', url, ':', e.message);
    }
  }

  return null;
}

// ─────────────────────────────────────────────
// 地理編碼（高德 Web 服務 API）
// ─────────────────────────────────────────────
async function tryGeocode(
  address: string,
  key: string,
  city?: string
): Promise<{ lat: number; lng: number; name: string; address: string; level: string } | null> {
  const params = new URLSearchParams({
    key,
    address,
    output: 'JSON',
  });
  if (city) params.set('city', city);

  const url = `https://restapi.amap.com/v3/geocode/geo?${params.toString()}`;
  const resp = await fetch(url, { method: 'GET' });
  if (!resp.ok) throw new Error(`高德地理編碼 HTTP ${resp.status}`);

  const data = await resp.json();
  if (data.status !== '1') {
    throw new Error(data.info || `高德地理編碼失敗（infocode: ${data.infocode}）`);
  }

  const geocodes: any[] = Array.isArray(data.geocodes) ? data.geocodes : [];
  if (geocodes.length === 0) return null;

  const loc = String(geocodes[0].location || '');
  const [lngStr, latStr] = loc.split(',');
  const lng = parseFloat(lngStr);
  const lat = parseFloat(latStr);
  if (isNaN(lng) || isNaN(lat)) throw new Error('高德回傳座標格式異常');

  return {
    lat,
    lng,
    name: address,
    address: geocodes[0].formatted_address || '',
    level: geocodes[0].level || '',
  };
}

// ─────────────────────────────────────────────
// 短連結展開：手動跟隨重定向
// ─────────────────────────────────────────────
async function expandShortLink(shortUrl: string): Promise<string | null> {
  let current = shortUrl;

  for (let hop = 0; hop < 5; hop++) {
    const resp = await fetch(current, {
      method: 'GET',
      redirect: 'manual',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-HK,zh;q=0.9,en;q=0.8',
      },
    });

    if (resp.status >= 300 && resp.status < 400) {
      const loc = resp.headers.get('location');
      if (!loc) {
        console.warn(`[expand] Hop ${hop}: 3xx 但 Location 為空`);
        break;
      }
      current = new URL(loc, current).toString();
      console.log(`[expand] Hop ${hop} → ${current}`);
      continue;
    }

    if (resp.status === 200) {
      const html = await resp.text();

      const meta = html.match(
        /http-equiv=["']refresh["'][^>]*content=["'][^"']*url=([^"'\s>]+)/i
      );
      if (meta) {
        current = new URL(meta[1], current).toString();
        console.log(`[expand] meta refresh → ${current}`);
        continue;
      }

      const js = html.match(
        /(?:window\.)?location(?:\.href)?\s*=\s*["']([^"']+)["']/i
      );
      if (js) {
        current = new URL(js[1], current).toString();
        console.log(`[expand] JS redirect → ${current}`);
        continue;
      }

      break;
    }

    console.warn(`[expand] Hop ${hop}: 狀態碼 ${resp.status}，停止`);
    break;
  }

  return current !== shortUrl ? current : null;
}

// ─────────────────────────────────────────────
// 工具：從混合文本提取 URL 列表
// ─────────────────────────────────────────────
function extractUrls(text: string): string[] {
  const re = /https?:\/\/[^\s<>"'`，。、；！？]+/gi;
  const matches = text.match(re) || [];
  return matches
    .map((u) => u.replace(/[，。、；！？.,;!?]+$/, ''))
    .filter(Boolean);
}

// ─────────────────────────────────────────────
// 工具：移除 URL 後的純文字
// ─────────────────────────────────────────────
function extractPlainText(text: string): string {
  return text.replace(/https?:\/\/[^\s<>"'`]+/gi, '').trim();
}

// ─────────────────────────────────────────────
// 工具：從純文字提取適合的名稱
// ─────────────────────────────────────────────
function extractNameFromPlainText(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return '';
  const firstLine = trimmed.split('\n')[0].trim();
  return firstLine.length > 30 ? firstLine.slice(0, 30) : firstLine;
}

// ─────────────────────────────────────────────
// 工具：解析高德長連結或座標文本
// ─────────────────────────────────────────────
function parseAmapShareText(raw: string): {
  lat: number;
  lng: number;
  name: string;
  address: string;
} | null {
  const text = String(raw).replace(/&amp;/g, '&').trim();
  if (!text) return null;

  const out = { lat: NaN, lng: NaN, name: '', address: '' };

  let m = text.match(/[?&]position=(-?[\d.]+)\s*[,，]\s*(-?[\d.]+)/i);
  if (m) {
    out.lng = parseFloat(m[1]);
    out.lat = parseFloat(m[2]);
  }

  if (isNaN(out.lat)) {
    m = text.match(/[?&]to=(-?[\d.]+)\s*[,，]\s*(-?[\d.]+)(?:[,，]([^&#\s]*))?/i);
    if (m) {
      out.lng = parseFloat(m[1]);
      out.lat = parseFloat(m[2]);
      if (m[3]) {
        try {
          out.name = decodeURIComponent(m[3]).replace(/\+/g, ' ').trim();
        } catch {
          out.name = m[3].replace(/\+/g, ' ').trim();
        }
      }
    }
  }

  if (isNaN(out.lat)) {
    const dlon = text.match(/[?&]dlon=(-?[\d.]+)/i);
    const dlat = text.match(/[?&]dlat=(-?[\d.]+)/i);
    if (dlon && dlat) {
      out.lng = parseFloat(dlon[1]);
      out.lat = parseFloat(dlat[1]);
    }
  }

  if (isNaN(out.lat)) {
    const lg = text.match(/[?&](?:lng|lon|longitude)=(-?[\d.]+)/i);
    const lt = text.match(/[?&](?:lat|latitude)=(-?[\d.]+)/i);
    if (lg && lt) {
      out.lng = parseFloat(lg[1]);
      out.lat = parseFloat(lt[1]);
    }
  }

  if (!out.name) {
    const nm =
      getParam(text, 'name') ||
      getParam(text, 'dname') ||
      getParam(text, 'pname') ||
      getParam(text, 'title');
    if (nm) out.name = nm.trim();
  }

  const addr = getParam(text, 'address') || getParam(text, 'addr');
  if (addr) out.address = addr.trim();

  if (isNaN(out.lat)) {
    m = text.match(/(-?\d{1,3}\.\d{3,})\s*[,，]\s*(-?\d{1,3}\.\d{3,})/);
    if (m) {
      const a = parseFloat(m[1]);
      const b = parseFloat(m[2]);
      if (Math.abs(a) > 90 && Math.abs(b) <= 90) {
        out.lng = a;
        out.lat = b;
      } else if (Math.abs(b) > 90 && Math.abs(a) <= 90) {
        out.lng = b;
        out.lat = a;
      } else {
        out.lng = a;
        out.lat = b;
      }
    }
  }

  if (isNaN(out.lat) || isNaN(out.lng)) return null;
  if (Math.abs(out.lat) > 90 || Math.abs(out.lng) > 180) return null;

  return { lat: out.lat, lng: out.lng, name: out.name, address: out.address };
}

function getParam(text: string, key: string): string | null {
  const re = new RegExp(`[?&]${key}=([^&#\\s]+)`, 'i');
  const m = text.match(re);
  if (!m) return null;
  let v = m[1];
  try {
    v = decodeURIComponent(v);
  } catch {
    /* ignore */
  }
  return v.replace(/\+/g, ' ');
}