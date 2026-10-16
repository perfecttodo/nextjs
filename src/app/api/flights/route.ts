import { NextResponse } from 'next/server';

// =========================================================
// 香港國際機場官方 REST API 代理
// GET /api/flights?date=YYYY-MM-DD&arrival=true|false
//
// 數據源：HKIA Open Data REST API
// 端點：https://www.hongkongairport.com/flightinfo-rest/rest/flights/past
// 限制：僅提供歷史數據（前一日曆日及之前）
// =========================================================

const HKIA_API_BASE = 'https://www.hongkongairport.com/flightinfo-rest/rest/flights/past';

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// 航班狀態碼 → 中文對照
const STATUS_CODE_MAP = {
  AR: '已抵達',
  DP: '已出發',
  DL: '延誤',
  CN: '取消',
  EX: '預計',
  SC: '已安排',
  DV: '備降',
  LD: '已著陸',
  AT: '到閘口',
  EN: '在途',
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const date = searchParams.get('date');
  const arrival = searchParams.get('arrival') !== 'false'; // 預設抵港
  const cargo = searchParams.get('cargo') === 'true';
  const lang = searchParams.get('lang') || 'zh_HK';

  // 驗證日期
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { success: false, error: '請提供有效日期，格式 YYYY-MM-DD' },
      { status: 400 }
    );
  }

  // 構建請求 URL
  const apiUrl = new URL(HKIA_API_BASE);
  apiUrl.searchParams.set('date', date);
  apiUrl.searchParams.set('arrival', String(arrival));
  apiUrl.searchParams.set('cargo', String(cargo));
  apiUrl.searchParams.set('lang', lang);

  try {
    const res = await fetch(apiUrl.toString(), {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json',
        'Accept-Language': 'zh-HK,zh-TW,zh;q=0.9,en;q=0.8',
        'Referer': 'https://www.hongkongairport.com/',
      },
      // ISR 快取 5 分鐘（歷史數據變動不大）
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      throw new Error(`HKIA API 回應錯誤：HTTP ${res.status}`);
    }

    const rawData = await res.json();

    // 轉換為前端所需的標準格式
    const flights = transformFlightData(rawData, arrival);

    return NextResponse.json({
      success: true,
      arrival,
      cargo,
      date,
      updatedAt: new Date().toISOString(),
      count: flights.length,
      flights,
    });
  } catch (error) {
    console.error('[HKIA Flights API]', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 502 }
    );
  }
}

// =========================================================
// 數據轉換：將官方 API 回應轉為前端格式
// =========================================================

function transformFlightData(rawData, isArrival) {
  // rawData 可能是陣列（多日期）或單一物件
  var dateGroups = Array.isArray(rawData) ? rawData : [rawData];

  var flights = [];

  dateGroups.forEach(function (group) {
    if (!group || !Array.isArray(group.list)) return;

    group.list.forEach(function (item) {
      if (!item || !item.flight || !item.flight.length) return;

      var primaryFlight = item.flight[0];
      var flightNo = primaryFlight.no || '--';
      var airlineCode = primaryFlight.airline || '';
      var statusCode = primaryFlight.statusCode || '';
      var statusText = primaryFlight.status || '';

      // 組合共享航班號（如有）
      var allFlightNos = item.flight.map(function (f) {
        return f.no;
      }).filter(Boolean);

      flights.push({
        id: 'hkia_' + flightNo.replace(/\s+/g, '') + '_' + (item.time || ''),
        time: item.time || '--:--',
        timestamp: parseTimeToTimestamp(item.time),
        flightNo: flightNo,
        allFlightNos: allFlightNos,
        airline: airlineCode,
        airlineCode: airlineCode,
        statusCode: statusCode,
        status: STATUS_CODE_MAP[statusCode] || statusText || '',
        // 抵港用 origin，離港用 destination
        origin: isArrival ? (item.origin || '') : '',
        destination: !isArrival ? (item.destination || '') : '',
        terminal: item.terminal || '',
        hall: item.hall || '',
        stand: item.stand || '',
        baggage: item.baggage || '',
        aisle: item.aisle || '',
        // 異常標記
        isAbnormal: ['DL', 'CN', 'DV'].indexOf(statusCode) !== -1,
      });
    });
  });

  // 去重
  var seen = new Set();
  return flights.filter(function (f) {
    var key = f.flightNo + '_' + f.time;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort(function (a, b) {
    return (a.timestamp || 0) - (b.timestamp || 0);
  });
}

// ---------------------------------------------------------
// 將 "HH:mm" 轉為 timestamp
// ---------------------------------------------------------

function parseTimeToTimestamp(timeStr) {
  if (!timeStr) return null;
  var m = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;

  var now = new Date();
  var d = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    parseInt(m[1], 10),
    parseInt(m[2], 10),
    0, 0
  );

  return d.getTime();
}