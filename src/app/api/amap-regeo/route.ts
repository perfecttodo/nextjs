import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  if (!lat || !lng) {
    return NextResponse.json({ error: '缺少 lat 或 lng 參數' }, { status: 400 });
  }

  const amapKey = process.env.AMAP_KEY;
  if (!amapKey) {
    return NextResponse.json({ error: '伺服器未配置 AMAP_KEY' }, { status: 500 });
  }

  // 高德位置格式要求：經度(lng),緯度(lat)
  const amapUrl = `https://restapi.amap.com/v3/geocode/regeo?key=${amapKey}&location=${lng},${lat}&extensions=all&output=json`;
console.log(amapKey)
  try {
    const res = await fetch(amapUrl, { next: { revalidate: 3600 } }); // 可設快取時間，降低 API 調用量
    if (!res.ok) {
      throw new Error(`高德 API 響應 HTTP ${res.status}`);
    }

    const data = await res.json();

    if (data.status !== '1' || !data.regeocode) {
      return NextResponse.json({ error: data.info || '高德解析失敗' }, { status: 400 });
    }

    const regeo = data.regeocode;
    const addrComp = regeo.addressComponent || {};
    const streetNumber = addrComp.streetNumber || {};

    // 解析街道名稱
    const road = streetNumber.street || addrComp.township || '';
    const number = streetNumber.number || '';
    const roadFormatted = road ? `${road}${number}` : '';

    // 解析社區/大樓 (AOI 優先，其次 POI)
    const aois = regeo.aois || [];
    const pois = regeo.pois || [];
    const building = aois.length > 0 
      ? aois[0].name 
      : (pois.length > 0 ? pois[0].name : '');

    // 整合統一格式返回給前端
    return NextResponse.json({
      success: true,
      provider: 'amap',
      formatted_address: regeo.formatted_address || '',
      building: building,
      road: roadFormatted,
      raw: data
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || '伺服器網絡錯誤' }, { status: 500 });
  }
}