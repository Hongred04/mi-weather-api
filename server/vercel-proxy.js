// ============================================================================
// 小米天气接口 同源代理 —— Vercel Serverless (Node.js)
// ----------------------------------------------------------------------------
// 解决: 小米接口跨域(CORS)且校验 User-Agent，浏览器不能直连。
// 用法: 部署到 Vercel 后，前端请求 /api/proxy/wtr-v3/weather/all?xxx
//       → 服务器转发到 https://weatherapi.market.xiaomi.com/wtr-v3/weather/all?xxx
// 说明: 代理本身不改变定位能力，定位由请求参数决定：
//         - locationKey=weathercn:<县代码> 县级 可用
//         - locationKey=weathercn:<县代码+3位镇序号> 镇级 实测返回 {} 不可用
//         - 省略 locationKey + isLocated=true + 真实经纬度 → 就近取数(反查为县级站点)
// ============================================================================
export default async function handler(req, res) {
  // 统一设置 CORS 头（原生 Node.js 用 setHeader 逐个设置）
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  // 预检请求
  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  const host = req.headers.host || 'localhost';
  const url = new URL(req.url, `https://${host}`);
  const pathname = url.pathname;
  const search = url.search;

  if (!pathname.startsWith('/api/proxy')) {
    res.statusCode = 404;
    return res.end(JSON.stringify({ error: 'Not Found' }));
  }

  const targetPath = pathname.replace('/api/proxy', '');
  const targetUrl = `https://weatherapi.market.xiaomi.com/wtr-v3${targetPath}${search}`;
  console.log(`[Proxy] Forwarding to: ${targetUrl}`);

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'zh-CN,zh;q=0.9',
        'Referer': 'https://weather.mi.com/',
      },
    });
    console.log(`[Proxy] Target status: ${response.status}`);
    const data = await response.json();
    res.statusCode = 200;
    return res.end(JSON.stringify(data));
  } catch (error) {
    console.error('[Proxy] Fetch error:', error.name, error.message);
    res.statusCode = 500;
    return res.end(JSON.stringify({
      error: 'Proxy request failed',
      message: error.message,
    }));
  }
}
