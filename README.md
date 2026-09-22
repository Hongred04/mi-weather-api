# 小米天气接口调用方案

免费调用小米天气接口（`weatherapi.market.xiaomi.com/wtr-v3/weather/all`）的完整方案，无需 API Key。

## 目录

```
xiaomi-weather-api/
├── esp32/
│   └── esp32_xiaomi_weather.ino   # ESP32 直连示例（免代理，含天气码表/解析）
├── server/
│   ├── vercel-proxy.js            # Vercel Serverless 同源代理（浏览器前端用）
│   └── nginx-reverse-proxy.conf   # Nginx 同源反代配置
└── docs/
    └── API.md                     # 接口参数/响应结构/天气码表/定位结论
```

## 快速开始

**ESP32 设备直连**（推荐，免代理）：

```cpp
// 详见 esp32/esp32_xiaomi_weather.ino
String url = String("https://weatherapi.market.xiaomi.com/wtr-v3/weather/all")
  + "?latitude=30.68&longitude=104.67&isLocated=true&days=1"
  + "&appKey=weather20151024&sign=zUFJoAR2ZVrDy1vF3D07&isGlobal=false&locale=zh_cn";
```

**浏览器前端**：受 CORS 限制不能直连，部署 `server/` 中的 Vercel 代理或 Nginx 反代后，请求自己的域名。

## 关键结论（实测 2026-09）

| 事项 | 结论 |
|---|---|
| 认证 | 无 API Key；`appKey=weather20151024&sign=zUFJoAR2ZVrDy1vF3D07` 固定 |
| 定位 | `isLocated=true` + 真实经纬度就近取数，**反查归到县级站点**；镇级 `locationKey` 不可用（返回 `{}`） |
| 请求头 | ESP32 裸请求即可（无需 UA/Referer）；浏览器受 CORS 限制 |
| 数据 | 温/湿/压(当地气压)/风/天气码/体感/能见度/AQI/官方预警/降水概率/15天预报 |
| 风险 | 逆向接口无 SLA，建议服务器代理兜底 |

详细参数、响应结构、天气码表见 [docs/API.md](docs/API.md)。

## 依赖

- ESP32 示例：`WiFi` / `HTTPClient` / `ArduinoJson 6.x`
- Vercel 代理：Node.js 18+（原生 `fetch`）
- Nginx 反代：Nginx 1.19+（`proxy_ssl_server_name` 需要）
