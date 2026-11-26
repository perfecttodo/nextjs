import { NextResponse, type NextRequest } from 'next/server';

interface AmapRegeoResponse {
  status: string;
  info?: string;
  regeocode?: {
    formatted_address?: string;
    addressComponent?: {
      township?: string;
      streetNumber?: {
        street?: string;
        number?: string;
      };
      district?:string;
    };
    aois?: { name: string }[];
    pois?: { name: string }[];
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  if (!lat || !lng) {
    return NextResponse.json({ error: '缺少 lat 或 lng 參數' }, { status: 400 });
  }

  const amapKey = process.env.AMAP_KEY;
  if (!amapKey) {
    return NextResponse.json({ error: '伺服器未配置 AMAP_KEY' }, { status: 500 });
  }
  //https://ditu.amap.com/service/regeo?longitude=114.12453809929933&latitude=22.5083746284787
  // 高德位置格式要求：經度(lng),緯度(lat)
  const amapUrl = `https://restapi.amap.com/v3/geocode/regeo?key=${amapKey}&location=${lng},${lat}&extensions=all&output=json`;

  try {
    const res = await fetch(amapUrl, { next: { revalidate: 3600 } }); // 可設快取時間，降低 API 調用量
    if (!res.ok) {
      throw new Error(`高德 API 響應 HTTP ${res.status}`);
    }

    const data: AmapRegeoResponse = await res.json();

    if (data.status !== '1' || !data.regeocode) {
      return NextResponse.json({ error: data.info || '高德解析失敗' }, { status: 400 });
    }

    const regeo = data.regeocode;
    const addrComp = regeo.addressComponent || {};
    const streetNumber = addrComp.streetNumber || {};
    const district = addrComp.district || '';

    // 解析街道名稱
    const road = streetNumber.street || addrComp.township || '';
    const number = streetNumber.number || '';
    const roadFormatted = road ? `${road}${number}` : '';

    // 解析社區/大樓 (AOI 優先，其次 POI)
    const aois = regeo.aois || [];
    const pois = regeo.pois || [];
    const building =
      aois.length > 0
        ? aois[0].name
        : pois.length > 0
          ? pois[0].name
          : '';

    // 整合統一格式返回給前端
    return NextResponse.json({
      success: true,
      provider: 'amap',
      formatted_address: regeo.formatted_address || '',
      district:district,
      building,
      road: roadFormatted,
      raw: data,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '伺服器網絡錯誤';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}