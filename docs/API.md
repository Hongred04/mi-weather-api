# 小米天气接口说明（weatherapi.market.xiaomi.com）

> 免费接口，无需 API Key，实测可直连。本文档基于 2026-09 实测整理。

## 1. 接口

```
GET https://weatherapi.market.xiaomi.com/wtr-v3/weather/all
```

### 参数

| 参数 | 必填 | 说明 |
|---|---|---|
| `latitude` / `longitude` | 建议 | 经纬度。配合 `isLocated=true` 就近取数；不传会报 `errCode:5` |
| `locationKey` | 可选 | `weathercn:` + 城市代码，如 `weathercn:101270105`(金堂县)。**镇级代码实测返回空 `{}`** |
| `isLocated` | 可选 | `true` 时按坐标反查最近站点 |
| `days` | 可选 | 今日起预报天数，默认 5 |
| `appKey` | 固定 | `weather20151024` |
| `sign` | 固定 | `zUFJoAR2ZVrDy1vF3D07` |
| `isGlobal` | 固定 | `false` |
| `locale` | 固定 | `zh_cn` |

### 完整示例（石龙社区 30.68,104.67，isLocated 定位）

```
https://weatherapi.market.xiaomi.com/wtr-v3/weather/all
  ?latitude=30.68&longitude=104.67&isLocated=true&days=1
  &appKey=weather20151024&sign=zUFJoAR2ZVrDy1vF3D07&isGlobal=false&locale=zh_cn
```

## 2. 定位结论（实测）

| 方式 | 结果 |
|---|---|
| `locationKey=weathercn:101270105003`（高板镇） | ❌ 返回 `{}`，**镇级代码不可用** |
| `locationKey=weathercn:101270105`（金堂县） | ✅ 可用 |
| 省略 locationKey + `isLocated=true` + 真实坐标 | ✅ 可用，**坐标反查归到最近县级站点** |

- 响应中 `sourceMaps` 字段可确认数据源，如 `{"current":{"temperature":"weatherbj(locationKey=101270105)"}}` 表示数据来自金堂县站点。
- 精度上限为**区县级**（weatherbj 站点）；`isLocated` 只是省去手动查代码，粒度不变。
- 北京坐标对照实测：23℃/1014hPa/晴 vs 石龙 22℃/960hPa/阴——确认按坐标就近取数。

## 3. 请求头要求（实测）

- **ESP32 直连无需 UA/Referer**，裸请求即返回 200。
- 浏览器前端受 CORS 限制，需走同源代理（见 `server/` 目录：Vercel 代理 / Nginx 反代）。

## 4. 响应结构（关键字段）

```
current               实况
  ├ temperature.value 温度(℃)
  ├ humidity.value    相对湿度(%)
  ├ pressure.value    气压(hPa, 当地站点气压, 与本地传感器同口径)
  ├ feelsLike.value   体感温度(℃)
  ├ visibility.value  能见度(km, 可能为空串)
  ├ weather           天气码(字符串, 中国天气网 wtr-v3 体系, 如 "7"=小雨)
  ├ wind.speed.value  风速(km/h)
  ├ wind.direction.value 风向(°)
  └ pubTime           发布时间
forecastDaily
  ├ precipitationProbability.value[0]  今日降水概率(%)
  ├ temperature.value[]  未来N天 高/低温
  ├ weather.value[]      未来N天 天气码(白天/夜间)
  └ sunRiseSet.value[]   日出日落
forecastHourly          24小时逐时(温度/天气码/AQI/风)
aqi                     空气质量(aqi/pm25/pm10/so2/no2/o3/co/primary)
alerts[]                官方预警(实测常为空数组; 字段名 title/text, type/level)
indices.indices[]       生活指数(uvIndex/humidity/feelsLike/pressure/carWash/sports)
yesterday               昨日实况
```

## 5. 天气码表（中国天气网 wtr-v3 体系）

| 码 | 天气 | 码 | 天气 | 码 | 天气 |
|---|---|---|---|---|---|
| 0 | 晴 | 22 | 中到大雨 | 44 | 中到大雪 |
| 1 | 多云 | 23 | 大到暴雨 | 45 | 大到暴雪 |
| 2 | 阴 | 24 | 暴雨到大暴雨 | 46 | 强沙尘暴 |
| 3 | 阵雨 | 25 | 大暴雨到特大暴雨 | 47 | 霾 |
| 4 | 雷阵雨 | 26 | 小到中雪 | 48 | 雾 |
| 5 | 雷阵雨伴冰雹 | 27 | 中到大雪 | 49 | 冻雨 |
| 6 | 雨夹雪 | 28 | 大到暴雪 | 50 | 阵雨 |
| 7 | 小雨 | 29 | 浮尘 | 51 | 小雨 |
| 8 | 中雨 | 30 | 扬沙 | 52 | 中雨 |
| 9 | 大雨 | 31 | 强沙尘暴 | 53 | 大雨 |
| 10 | 暴雨 | 32 | 霾 | 54 | 暴雨 |
| 11 | 大暴雨 | 33 | 晴间多云 | 55 | 大暴雨 |
| 12 | 特大暴雨 | 34 | 阴间多云 | 56 | 特大暴雨 |
| 13 | 阵雪 | 35 | 阵雨 | 57 | 阵雪 |
| 14 | 小雪 | 36 | 强阵雨 | 58 | 小雪 |
| 15 | 中雪 | 37 | 雷阵雨伴冰雹 | 59 | 中雪 |
| 16 | 大雪 | 38 | 小到中雨 | 60 | 大雪 |
| 17 | 暴雪 | 39 | 中到大雨 | 61 | 暴雪 |
| 18 | 雾 | 40 | 大到暴雨 | 62 | 雨夹雪 |
| 19 | 冻雨 | 41 | 暴雨到大暴雨 | 63 | 雨 |
| 20 | 沙尘暴 | 42 | 大暴雨到特大暴雨 | 64 | 雪 |
| 21 | 小到中雨 | 43 | 小到中雪 | | |

## 6. 附：金堂县乡镇 weathercn 代码（中国天气网）

县代码 `101270105`，乡镇代码 = 县代码 + 3 位序号（中国天气网 town 页面可用，**小米接口不可用**）：

`101270105001`白果镇 `...002`福兴镇 `...003`高板镇 `...004`官仓镇 `...005`广兴镇 `...006`淮口镇 `...007`金龙镇 `...008`隆盛镇 `...009`平桥乡 `...010`栖贤乡 `...011`清江镇 `...012`三溪镇 `...013`三星镇 `...014`土桥镇 `...015`五凤镇 `...016`又新镇 `...017`云合镇 `...018`赵家镇 `...019`赵镇街道 `...020`竹篙镇 `...021`转龙镇

## 7. 风险提示

- 民间逆向接口，**无 SLA**；参数/签名/限制可能随时变化，生产环境建议走自己服务器的代理兜底。
- 免费非商用；数据源为 weatherbj（中国天气网体系）/ caiyun（彩云）/ moji（墨迹）等。
- 气压为**当地站点气压**（非海平面气压）；高海拔地区与 Open-Meteo 的 `pressure_msl`（海平面）差约 50hPa，勿混用。
