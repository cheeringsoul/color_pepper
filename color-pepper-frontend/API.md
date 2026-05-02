# Color Pepper API 接口文档

当前版本使用 mock 数据。接入真实后端时，在 `.env` 中设置 `VITE_API_BASE_URL`（如 `http://localhost:8080`），前端会自动切换到 HTTP 请求模式。

## 切换方式

```bash
# 使用 mock 数据（默认）
npm run dev

# 使用真实后端
VITE_API_BASE_URL=http://localhost:8080 npm run dev
```

---

## 1. 市场总览

### `GET /api/market/overview`

返回市场概览数据。

**Response:**
```json
{
  "totalMcap": { "value": 2670000000000, "change": 1.4, "label": "$2.67T" },
  "volume24h": { "value": 76200000000, "change": 12, "label": "$76.2B" },
  "btcDominance": { "value": 58.1, "change": -0.2, "label": "58.1%" },
  "fearGreed": { "value": 72, "change": 8, "label": "贪婪" }
}
```

---

## 2. 币种列表

### `GET /api/symbols`

返回所有支持的交易对。

**Response:**
```json
[
  {
    "sym": "BTC",
    "name": "Bitcoin",
    "color": "#f7931a",
    "sector": "主流币",
    "price": 67234.50,
    "chg": 2.34,
    "mcap": 1320000000000,
    "vol": 14200000000
  }
]
```

| 字段 | 类型 | 说明 |
|------|------|------|
| sym | string | 交易对符号，如 BTC、ETH |
| name | string | 全名 |
| color | string | 品牌色（hex） |
| sector | string | 所属板块 |
| price | number | 最新价（USDT） |
| chg | number | 24h 涨跌幅（%） |
| mcap | number | 市值（USD） |
| vol | number | 24h 成交额（USD） |

---

## 3. 单币行情

### `GET /api/ticker/:symbol`

返回指定币种的详细行情。

**Params:** `symbol` — 币种符号，如 `BTC`

**Response:**
```json
{
  "symbol": "BTC",
  "price": 67234.50,
  "change24h": 2.34,
  "high24h": 69923.88,
  "low24h": 64545.12,
  "volume24h": 14200000000,
  "mcap": 1320000000000,
  "name": "Bitcoin",
  "color": "#f7931a",
  "sector": "主流币"
}
```

---

## 4. K 线数据

### `GET /api/klines/:symbol`

返回指定币种的 K 线（OHLCV）数据。

**Params:** `symbol` — 币种符号

**Query:**
| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| interval | string | "1h" | K 线周期：1m, 5m, 15m, 1h, 4h, 1d, 1w |
| limit | number | 80 | 返回数量 |

**Response:**
```json
[
  {
    "time": 1714300800,
    "open": 67100.20,
    "high": 67450.80,
    "low": 67050.10,
    "close": 67234.50,
    "volume": 1842.35
  }
]
```

| 字段 | 类型 | 说明 |
|------|------|------|
| time | number | Unix 时间戳（秒） |
| open | number | 开盘价 |
| high | number | 最高价 |
| low | number | 最低价 |
| close | number | 收盘价 |
| volume | number | 成交量 |

> **Note:** `time` 为 Unix 秒级时间戳，TradingView Lightweight Charts 要求此格式。

---

## 5. 订单簿

### `GET /api/orderbook/:symbol`

返回指定币种的订单簿快照。

**Params:** `symbol` — 币种符号

**Query:**
| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| limit | number | 9 | 每侧档位数 |

**Response:**
```json
{
  "asks": [
    { "price": 67300.50, "qty": 1.234, "total": 5.678 }
  ],
  "bids": [
    { "price": 67200.10, "qty": 0.892, "total": 3.456 }
  ],
  "maxTotal": 12.34,
  "midPrice": 67234.50
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| asks | array | 卖单列表（价格从低到高） |
| bids | array | 买单列表（价格从高到低） |
| maxTotal | number | 最大累计量（用于深度条宽度计算） |
| midPrice | number | 中间价 |

---

## 6. 迷你走势图

### `GET /api/sparkline/:symbol`

返回指定币种的简化走势数据，用于列表中的迷你图。

**Params:** `symbol` — 币种符号

**Query:**
| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| points | number | 30 | 数据点数量 |

**Response:**
```json
[50.2, 51.8, 49.3, 52.1, ...]
```

返回一个数值数组，表示归一化后的价格走势。

---

## 7. 板块轮动热力图

### `GET /api/rotation/heatmap`

返回板块轮动热力图数据。

**Query:**
| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| period | string | "7d" | 时间范围：7d, 14d, 30d |

**Response:**
```json
{
  "sectors": ["主流币", "Layer 1", "Layer 2", "DeFi", "Meme", "AI", "Solana", "支付"],
  "heatmap": [
    {
      "sector": "主流币",
      "cells": [2.34, -1.20, 0.80, 3.10, -0.50, 1.90, 2.40]
    }
  ]
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| sectors | string[] | 板块名称列表 |
| heatmap[].sector | string | 板块名 |
| heatmap[].cells | number[] | 每日相对大盘强弱值（%），正=强于大盘 |

---

## 8. 板块轮动分析

### `GET /api/rotation/analysis`

返回完整的板块轮动分析数据，包含 BTC 价格走势、拐点标注、板块贡献排行。

**Query:**
| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| period | string | "30d" | 时间范围：7d, 14d, 30d |

**Response:**
```json
{
  "btcLine": [67100.2, 67250.3, ...],
  "annotations": [
    {
      "t": 25,
      "sector": "Meme",
      "isUp": true,
      "value": 67450.80
    }
  ],
  "sectorStats": [
    {
      "sector": "Meme",
      "contribution": 0.342,
      "count": 4
    }
  ],
  "sectors": ["主流币", "Layer 1", ...],
  "symbolCount": 24
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| btcLine | number[] | BTC 价格序列（120 个点） |
| annotations[].t | number | 时间点索引（0-119） |
| annotations[].sector | string | 该拐点的主导板块 |
| annotations[].isUp | boolean | 是否为上涨拐点 |
| annotations[].value | number | 该点的 BTC 价格 |
| sectorStats[].sector | string | 板块名 |
| sectorStats[].contribution | number | 近期对指数的贡献值 |
| sectorStats[].count | number | 板块内币种数量 |

---

## 9. BTC K 线（简化）

### `GET /api/btc/klines`

返回 BTC 的简化价格序列，用于轮动页图表。

**Query:**
| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| period | string | "30d" | 时间范围 |

**Response:**
```json
[67100.2, 67250.3, 67180.5, ...]
```

返回 BTC 收盘价数组（120 个点）。

---

## 10. 走势相似分析

### `GET /api/similarity`

返回与参考币走势相似的标的。

**Query:**
| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| ref | string | "BTC" | 参考币种 |
| algo | string | "pearson" | 相似度算法：pearson, dtw, euclid |
| period | string | "30d" | 分析区间 |
| minCorr | number | 0.5 | 最小相关系数（0-1） |

**Response:**
```json
{
  "ref": {
    "sym": "BTC",
    "color": "#f7931a",
    "norm": [0, 0.5, -0.3, 1.2, ...]
  },
  "candidates": [
    {
      "sym": "ETH",
      "corr": 0.92,
      "color": "#627eea",
      "norm": [0, 0.4, -0.2, 1.0, ...]
    }
  ]
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| ref.sym | string | 参考币种 |
| ref.norm | number[] | 归一化价格变化序列（%） |
| candidates[].sym | string | 候选币种 |
| candidates[].corr | number | 与参考币的相关系数（0-1） |
| candidates[].norm | number[] | 归一化价格变化序列（%） |

---

## 11. Agent 聊天

### `POST /api/agent/chat`

发送消息给 AI Agent，获取分析回复。

**Body:**
```json
{
  "message": "BTC 现在是不是该回调？",
  "context": {
    "symbol": "BTC",
    "interval": "1h"
  }
}
```

**Response:**
```json
{
  "role": "ag",
  "body": "BTC 当前处于上升通道...",
  "suggestions": [
    "对比 ETH 走势",
    "分析支撑位"
  ]
}
```

---

## 12. Agent 预警

### `GET /api/agent/alerts`

获取 Agent 主动推送的市场异动提醒。

**Response:**
```json
[
  {
    "tag": "hot",
    "tagText": "异动",
    "time": "2m",
    "title": "WIF 30 分钟内放量上涨 12.4%",
    "body": "Meme 板块整体跟涨，$300M 成交。"
  }
]
```

| 字段 | 类型 | 说明 |
|------|------|------|
| tag | string | 标签类型：hot, up, dn, info |
| tagText | string | 标签显示文字 |
| time | string | 时间标签（如 "2m", "1h"） |
| title | string | 标题 |
| body | string | 内容描述 |

---

## WebSocket 接口（规划中）

未来接入实时数据时，建议增加以下 WebSocket 接口：

### `ws://host/ws/ticker`

实时价格推送，订阅指定交易对。

```json
// 订阅
{ "type": "subscribe", "symbols": ["BTC", "ETH"] }

// 推送
{ "type": "ticker", "symbol": "BTC", "price": 67234.50, "chg": 2.34, "volume": 14200000000 }
```

### `ws://host/ws/kline`

实时 K 线推送。

```json
// 订阅
{ "type": "subscribe", "symbol": "BTC", "interval": "1h" }

// 推送
{ "type": "kline", "symbol": "BTC", "time": 1714300800, "open": 67100, "high": 67450, "low": 67050, "close": 67234, "volume": 1842 }
```

### `ws://host/ws/orderbook`

实时订单簿推送（增量更新）。

```json
// 订阅
{ "type": "subscribe", "symbol": "BTC" }

// 推送
{ "type": "orderbook", "symbol": "BTC", "asks": [...], "bids": [...] }
```

### `ws://host/ws/alerts`

Agent 异动预警实时推送。

```json
{ "type": "alert", "tag": "hot", "title": "...", "body": "..." }
```
