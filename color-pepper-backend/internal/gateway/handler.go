package gateway

import (
	"encoding/json"
	"fmt"
	"log"
	"math"
	"net/http"
	"sort"
	"strings"
	"time"

	ccxt "github.com/ccxt/ccxt/go/v4"
)

// ─── Market Overview ─────────────────────────────────────────

func handleMarketOverview(w http.ResponseWriter, r *http.Request) {
	tickers, err := exMgr.GetAllTickers()
	if err != nil {
		log.Printf("market overview: %v", err)
		writeJSON(w, map[string]any{
			"totalMcap":    map[string]any{"value": 0, "change": 0, "label": "N/A"},
			"volume24h":    map[string]any{"value": 0, "change": 0, "label": "N/A"},
			"btcDominance": map[string]any{"value": 0, "change": 0, "label": "N/A"},
			"fearGreed":    map[string]any{"value": 0, "change": 0, "label": "N/A"},
		})
		return
	}

	var totalVol float64
	for _, t := range tickers {
		totalVol += derefFloat(t.QuoteVolume)
	}

	btcTicker := tickers["BTC"]
	btcPrice := derefFloat(btcTicker.Last)
	btcChg := derefFloat(btcTicker.Percentage)

	var totalMcap float64
	for _, m := range symbolMetas {
		totalMcap += m.Mcap
	}
	btcMeta := findMeta("BTC")
	btcDom := 0.0
	if totalMcap > 0 && btcMeta != nil {
		btcDom = btcMeta.Mcap / totalMcap * 100
	}

	fgValue := 72
	fgLabel, fgSentiment := fearGreedLabel(fgValue)

	writeJSON(w, map[string]any{
		"totalMcap":    map[string]any{"value": totalMcap, "change": btcChg, "label": fmtLargeNum(totalMcap)},
		"volume24h":    map[string]any{"value": totalVol, "change": 0, "label": fmtLargeNum(totalVol)},
		"btcDominance": map[string]any{"value": btcDom, "change": 0, "label": fmt.Sprintf("%.1f%%", btcDom)},
		"fearGreed":    map[string]any{"value": fgValue, "change": 8, "label": fgLabel, "sentiment": fgSentiment},
		"btcPrice":     btcPrice,
	})
}

func fearGreedLabel(v int) (label, sentiment string) {
	switch {
	case v >= 75:
		return "极度贪婪", "极度贪婪"
	case v >= 56:
		return "贪婪", "偏贪婪"
	case v >= 45:
		return "中性", "中性"
	case v >= 25:
		return "恐惧", "偏恐惧"
	default:
		return "极度恐惧", "极度恐惧"
	}
}

func fmtLargeNum(v float64) string {
	switch {
	case v >= 1e12:
		return fmt.Sprintf("$%.2fT", v/1e12)
	case v >= 1e9:
		return fmt.Sprintf("$%.1fB", v/1e9)
	case v >= 1e6:
		return fmt.Sprintf("$%.1fM", v/1e6)
	default:
		return fmt.Sprintf("$%.0f", v)
	}
}

// ─── Symbols ─────────────────────────────────────────────────

func handleSymbols(w http.ResponseWriter, r *http.Request) {
	tickers, err := exMgr.GetAllTickers()
	if err != nil {
		log.Printf("symbols: %v", err)
	}

	out := make([]map[string]any, 0, len(symbolMetas))
	for _, m := range symbolMetas {
		price := 0.0
		chg := 0.0
		vol := 0.0
		high := 0.0
		low := 0.0
		if t, ok := tickers[m.Sym]; ok {
			price = derefFloat(t.Last)
			chg = derefFloat(t.Percentage)
			vol = derefFloat(t.QuoteVolume)
			high = derefFloat(t.High)
			low = derefFloat(t.Low)
		}
		out = append(out, map[string]any{
			"sym": m.Sym, "name": m.Name, "color": m.Color,
			"sector": m.Sector, "price": price, "chg": chg,
			"mcap": m.Mcap, "vol": vol,
			"high24h": high, "low24h": low,
		})
	}
	writeJSON(w, out)
}

// ─── Ticker ──────────────────────────────────────────────────

func handleTicker(w http.ResponseWriter, r *http.Request) {
	sym := strings.ToUpper(r.PathValue("symbol"))
	m := findMeta(sym)
	if m == nil {
		http.Error(w, "not found", 404)
		return
	}

	t, err := exMgr.GetTicker(sym)
	if err != nil {
		log.Printf("ticker %s: %v", sym, err)
		http.Error(w, "exchange error", 502)
		return
	}

	writeJSON(w, map[string]any{
		"symbol":    m.Sym,
		"price":     derefFloat(t.Last),
		"change24h": derefFloat(t.Percentage),
		"high24h":   derefFloat(t.High),
		"low24h":    derefFloat(t.Low),
		"volume24h": derefFloat(t.QuoteVolume),
		"mcap":      m.Mcap,
		"name":      m.Name,
		"color":     m.Color,
		"sector":    m.Sector,
	})
}

// ─── Klines ──────────────────────────────────────────────────

func handleKlines(w http.ResponseWriter, r *http.Request) {
	sym := strings.ToUpper(r.PathValue("symbol"))
	interval := queryString(r, "interval", "1h")
	limit := queryInt(r, "limit", 80)

	if findMeta(sym) == nil {
		sym = "BTC"
	}

	candles, err := exMgr.GetOHLCV(sym, interval, limit)
	if err != nil {
		log.Printf("klines %s: %v", sym, err)
		http.Error(w, "exchange error", 502)
		return
	}

	out := make([]map[string]any, len(candles))
	for i, c := range candles {
		out[i] = map[string]any{
			"time":   c.Timestamp / 1000,
			"open":   c.Open,
			"high":   c.High,
			"low":    c.Low,
			"close":  c.Close,
			"volume": c.Volume,
		}
	}
	writeJSON(w, out)
}

// ─── OrderBook ───────────────────────────────────────────────

func handleOrderBook(w http.ResponseWriter, r *http.Request) {
	sym := strings.ToUpper(r.PathValue("symbol"))
	limit := queryInt(r, "limit", 9)

	if findMeta(sym) == nil {
		sym = "BTC"
	}

	ob, err := exMgr.GetOrderBook(sym, limit)
	if err != nil {
		log.Printf("orderbook %s: %v", sym, err)
		http.Error(w, "exchange error", 502)
		return
	}

	type level struct {
		Price float64 `json:"price"`
		Qty   float64 `json:"qty"`
		Total float64 `json:"total"`
	}

	asks := make([]level, 0, len(ob.Asks))
	var cumA float64
	for _, a := range ob.Asks {
		if len(a) < 2 {
			continue
		}
		cumA += a[1]
		asks = append(asks, level{a[0], a[1], cumA})
	}

	bids := make([]level, 0, len(ob.Bids))
	var cumB float64
	for _, b := range ob.Bids {
		if len(b) < 2 {
			continue
		}
		cumB += b[1]
		bids = append(bids, level{b[0], b[1], cumB})
	}

	maxTotal := cumA
	if cumB > maxTotal {
		maxTotal = cumB
	}

	midPrice := 0.0
	if len(ob.Asks) > 0 && len(ob.Bids) > 0 {
		midPrice = (ob.Asks[0][0] + ob.Bids[0][0]) / 2
	}

	writeJSON(w, map[string]any{
		"asks": asks, "bids": bids,
		"maxTotal": maxTotal, "midPrice": midPrice,
	})
}

// ─── Sparkline ───────────────────────────────────────────────

func handleSparkline(w http.ResponseWriter, r *http.Request) {
	sym := strings.ToUpper(r.PathValue("symbol"))
	points := queryInt(r, "points", 30)

	if findMeta(sym) == nil {
		writeJSON(w, []float64{})
		return
	}

	candles, err := exMgr.GetOHLCV(sym, "1h", points)
	if err != nil {
		log.Printf("sparkline %s: %v", sym, err)
		writeJSON(w, []float64{})
		return
	}

	out := make([]float64, len(candles))
	for i, c := range candles {
		out[i] = c.Close
	}
	writeJSON(w, out)
}

// ─── Rotation Heatmap ────────────────────────────────────────

func handleRotationHeatmap(w http.ResponseWriter, r *http.Request) {
	period := queryString(r, "period", "7d")
	days := 7
	switch period {
	case "14d":
		days = 14
	case "30d":
		days = 30
	}

	btcCandles, err := exMgr.GetOHLCV("BTC", "1d", days+1)
	if err != nil {
		log.Printf("rotation heatmap: %v", err)
		http.Error(w, "exchange error", 502)
		return
	}
	btcReturns := dailyReturns(btcCandles)

	type row struct {
		Sector string    `json:"sector"`
		Cells  []float64 `json:"cells"`
	}

	heatmap := make([]row, 0, len(sectorList))
	for _, sec := range sectorList {
		sectorSyms := symbolsInSector(sec)
		cells := make([]float64, len(btcReturns))
		for _, sym := range sectorSyms {
			candles, err := exMgr.GetOHLCV(sym, "1d", days+1)
			if err != nil {
				continue
			}
			rets := dailyReturns(candles)
			for d := 0; d < len(cells) && d < len(rets); d++ {
				cells[d] += (rets[d] - btcReturns[d]) / float64(len(sectorSyms))
			}
		}
		for i := range cells {
			cells[i] = math.Round(cells[i]*100) / 100
		}
		heatmap = append(heatmap, row{sec, cells})
	}

	now := time.Now()
	dates := make([]string, days)
	for i := 0; i < days; i++ {
		d := now.AddDate(0, 0, -(days - 1 - i))
		dates[i] = fmt.Sprintf("%d/%d", int(d.Month()), d.Day())
	}

	writeJSON(w, map[string]any{"sectors": sectorList, "heatmap": heatmap, "dates": dates})
}

func dailyReturns(candles []ccxt.OHLCV) []float64 {
	if len(candles) < 2 {
		return nil
	}
	rets := make([]float64, len(candles)-1)
	for i := 1; i < len(candles); i++ {
		if candles[i-1].Close != 0 {
			rets[i-1] = (candles[i].Close - candles[i-1].Close) / candles[i-1].Close * 100
		}
	}
	return rets
}

func symbolsInSector(sector string) []string {
	var out []string
	for _, m := range symbolMetas {
		if m.Sector == sector {
			out = append(out, m.Sym)
		}
	}
	return out
}

// ─── BTC Klines ──────────────────────────────────────────────

func handleBtcKlines(w http.ResponseWriter, r *http.Request) {
	period := queryString(r, "period", "30d")
	limit := 120
	tf := "4h"
	switch period {
	case "7d":
		limit = 120
		tf = "1h"
	case "14d":
		limit = 120
		tf = "2h"
	}

	candles, err := exMgr.GetOHLCV("BTC", tf, limit)
	if err != nil {
		log.Printf("btc klines: %v", err)
		http.Error(w, "exchange error", 502)
		return
	}

	out := make([]float64, len(candles))
	for i, c := range candles {
		out[i] = c.Close
	}
	writeJSON(w, out)
}

// ─── Rotation Analysis ──────────────────────────────────────

func handleRotationAnalysis(w http.ResponseWriter, r *http.Request) {
	period := queryString(r, "period", "30d")
	const N = 120
	tf := "4h"
	switch period {
	case "7d":
		tf = "1h"
	case "14d":
		tf = "2h"
	}

	btcCandles, err := exMgr.GetOHLCV("BTC", tf, N)
	if err != nil {
		log.Printf("rotation analysis btc: %v", err)
		http.Error(w, "exchange error", 502)
		return
	}

	btcLine := make([]float64, len(btcCandles))
	for i, c := range btcCandles {
		btcLine[i] = c.Close
	}
	actualN := len(btcLine)

	totalMcap := 0.0
	for _, m := range symbolMetas {
		totalMcap += m.Mcap
	}

	series := make(map[string][]float64)
	for _, meta := range symbolMetas {
		candles, err := exMgr.GetOHLCV(meta.Sym, tf, N)
		if err != nil || len(candles) == 0 {
			continue
		}
		base := candles[0].Close
		if base == 0 {
			base = 1
		}
		norm := make([]float64, len(candles))
		for i, c := range candles {
			norm[i] = c.Close / base
		}
		series[meta.Sym] = norm
	}

	// sector contributions per time step
	type sectorMap = map[string]float64
	sectorContribs := make([]sectorMap, 0, actualN-1)
	for t := 1; t < actualN; t++ {
		c := make(sectorMap)
		for _, sec := range sectorList {
			c[sec] = 0
		}
		for _, meta := range symbolMetas {
			s, ok := series[meta.Sym]
			if !ok || t >= len(s) {
				continue
			}
			c[meta.Sector] += (meta.Mcap / totalMcap) * (s[t] - s[t-1]) * 1000
		}
		sectorContribs = append(sectorContribs, c)
	}

	// smoothed BTC line
	smooth := make([]float64, actualN)
	for i := range btcLine {
		sum := 0.0
		cnt := 0
		for j := max(0, i-3); j <= min(actualN-1, i+3); j++ {
			sum += btcLine[j]
			cnt++
		}
		smooth[i] = sum / float64(cnt)
	}

	topSymbolsInWindow := func(ws, we int, isUp bool) []string {
		symC := make(map[string]float64)
		for _, meta := range symbolMetas {
			symC[meta.Sym] = 0
		}
		for j := ws; j <= we; j++ {
			for _, meta := range symbolMetas {
				s, ok := series[meta.Sym]
				if !ok || j+1 >= len(s) {
					continue
				}
				symC[meta.Sym] += (meta.Mcap / totalMcap) * (s[j+1] - s[j]) * 1000
			}
		}
		type kv struct {
			k string
			v float64
		}
		sorted := make([]kv, 0, len(symC))
		for k, v := range symC {
			sorted = append(sorted, kv{k, v})
		}
		sort.Slice(sorted, func(i, j int) bool {
			if isUp {
				return sorted[i].v > sorted[j].v
			}
			return sorted[i].v < sorted[j].v
		})
		result := make([]string, 0, 3)
		for i := 0; i < 3 && i < len(sorted); i++ {
			result = append(result, sorted[i].k)
		}
		return result
	}

	type annotation struct {
		T          int      `json:"t"`
		Sector     string   `json:"sector"`
		IsUp       bool     `json:"isUp"`
		Value      float64  `json:"value"`
		TopSymbols []string `json:"topSymbols"`
	}

	annotations := make([]annotation, 0)
	for t := 6; t < actualN-6; t++ {
		db := smooth[t] - smooth[t-5]
		da := smooth[t+5] - smooth[t]
		if !((db > 0 && da < 0) || (db < 0 && da > 0)) {
			continue
		}
		if len(annotations) > 0 && t-annotations[len(annotations)-1].T < 12 {
			continue
		}
		ws := max(0, t-8)
		we := min(len(sectorContribs)-1, t-1)
		sums := make(map[string]float64)
		for _, sec := range sectorList {
			sums[sec] = 0
		}
		for j := ws; j <= we; j++ {
			for _, sec := range sectorList {
				sums[sec] += sectorContribs[j][sec]
			}
		}
		isUp := db > 0
		best := sectorList[0]
		bv := -1e18
		for _, sec := range sectorList {
			v := sums[sec]
			if !isUp {
				v = -v
			}
			if v > bv {
				bv = v
				best = sec
			}
		}
		annotations = append(annotations, annotation{
			T: t, Sector: best, IsUp: isUp, Value: btcLine[t],
			TopSymbols: topSymbolsInWindow(ws, we, isUp),
		})
	}

	// fill gaps
	for i := 0; i < len(annotations)-1; i++ {
		if annotations[i+1].T-annotations[i].T > 25 {
			mt := (annotations[i].T + annotations[i+1].T) / 2
			isUp := btcLine[mt] > btcLine[max(0, mt-5)]
			ws := max(0, mt-5)
			we := min(len(sectorContribs)-1, mt)
			sums := make(map[string]float64)
			for _, sec := range sectorList {
				sums[sec] = 0
			}
			for j := ws; j <= we; j++ {
				for _, sec := range sectorList {
					sums[sec] += sectorContribs[j][sec]
				}
			}
			best := sectorList[0]
			bv := -1e18
			for _, sec := range sectorList {
				v := sums[sec]
				if !isUp {
					v = -v
				}
				if v > bv {
					bv = v
					best = sec
				}
			}
			newAnn := annotation{T: mt, Sector: best, IsUp: isUp, Value: btcLine[mt],
				TopSymbols: topSymbolsInWindow(ws, we, isUp)}
			annotations = append(annotations[:i+1], append([]annotation{newAnn}, annotations[i+1:]...)...)
			i++
		}
	}

	// btcNorm: normalized BTC as percentage change from start
	btcBase := btcLine[0]
	if btcBase == 0 {
		btcBase = 1
	}
	btcNorm := make([]float64, actualN)
	for i, v := range btcLine {
		btcNorm[i] = math.Round(((v/btcBase)-1)*100*1000) / 1000
	}

	// sectorLines: market-cap-weighted normalized line per sector
	sectorLines := make(map[string][]float64)
	for _, sec := range sectorList {
		syms := symbolsInSector(sec)
		totalSectorMcap := 0.0
		for _, sym := range syms {
			if m := findMeta(sym); m != nil {
				totalSectorMcap += m.Mcap
			}
		}
		if totalSectorMcap == 0 {
			totalSectorMcap = 1
		}
		line := make([]float64, actualN)
		for t := 0; t < actualN; t++ {
			var weighted float64
			for _, sym := range syms {
				s, ok := series[sym]
				if !ok || t >= len(s) {
					continue
				}
				m := findMeta(sym)
				if m == nil {
					continue
				}
				weighted += (m.Mcap / totalSectorMcap) * (s[t] - 1) * 100
			}
			line[t] = math.Round(weighted*1000) / 1000
		}
		sectorLines[sec] = line
	}

	// dates: x-axis label strings
	days := 30
	switch period {
	case "7d":
		days = 7
	case "14d":
		days = 14
	}
	now := time.Now()
	dates := make([]string, actualN)
	for t := 0; t < actualN; t++ {
		frac := float64(days) * (1 - float64(t)/float64(actualN-1))
		d := now.Add(-time.Duration(frac * float64(24*time.Hour)))
		dates[t] = fmt.Sprintf("%d/%d", int(d.Month()), d.Day())
	}

	// recent sector stats
	recent := make(map[string]float64)
	for _, sec := range sectorList {
		recent[sec] = 0
	}
	start := max(0, len(sectorContribs)-20)
	for t := start; t < len(sectorContribs); t++ {
		for _, sec := range sectorList {
			recent[sec] += sectorContribs[t][sec]
		}
	}

	type sectorStat struct {
		Sector       string  `json:"sector"`
		Contribution float64 `json:"contribution"`
		Count        int     `json:"count"`
	}
	stats := make([]sectorStat, len(sectorList))
	for i, sec := range sectorList {
		stats[i] = sectorStat{sec, recent[sec], len(symbolsInSector(sec))}
	}
	sort.Slice(stats, func(i, j int) bool {
		return stats[i].Contribution > stats[j].Contribution
	})

	writeJSON(w, map[string]any{
		"btcLine":     btcLine,
		"btcNorm":     btcNorm,
		"sectorLines": sectorLines,
		"dates":       dates,
		"annotations": annotations,
		"sectorStats": stats,
		"sectors":     sectorList,
		"symbolCount": len(symbolMetas),
	})
}

// ─── Similarity ──────────────────────────────────────────────

func handleSimilarity(w http.ResponseWriter, r *http.Request) {
	refSymbol := strings.ToUpper(queryString(r, "ref", "BTC"))
	algo := queryString(r, "algo", "pearson")
	period := queryString(r, "period", "30d")
	minCorr := queryFloat(r, "minCorr", 0.5)

	limit := 30
	switch period {
	case "7d":
		limit = 7
	case "90d":
		limit = 90
	}

	refCandles, err := exMgr.GetOHLCV(refSymbol, "1d", limit)
	if err != nil {
		log.Printf("similarity ref %s: %v", refSymbol, err)
		http.Error(w, "exchange error", 502)
		return
	}

	refCloses := make([]float64, len(refCandles))
	for i, c := range refCandles {
		refCloses[i] = c.Close
	}
	refNorm := normalizeSeries(refCloses)

	refColor := "#f7931a"
	if m := findMeta(refSymbol); m != nil {
		refColor = m.Color
	}

	type candidate struct {
		Sym   string    `json:"sym"`
		Corr  float64   `json:"corr"`
		Color string    `json:"color"`
		Norm  []float64 `json:"norm"`
	}

	candidates := make([]candidate, 0)
	for _, meta := range symbolMetas {
		if meta.Sym == refSymbol {
			continue
		}
		candles, err := exMgr.GetOHLCV(meta.Sym, "1d", limit)
		if err != nil || len(candles) < 10 {
			continue
		}
		closes := make([]float64, len(candles))
		for i, c := range candles {
			closes[i] = c.Close
		}
		norm := normalizeSeries(closes)

		minLen := len(refNorm)
		if len(norm) < minLen {
			minLen = len(norm)
		}

		var score float64
		switch algo {
		case "dtw":
			dist := dtwDistance(refNorm[:minLen], norm[:minLen])
			maxDist := float64(minLen) * 20
			score = math.Max(0, 1-dist/maxDist)
		case "euclid":
			dist := euclidDistance(refNorm[:minLen], norm[:minLen])
			maxDist := math.Sqrt(float64(minLen)) * 20
			score = math.Max(0, 1-dist/maxDist)
		default:
			score = pearson(refNorm[:minLen], norm[:minLen])
		}

		if score >= minCorr {
			candidates = append(candidates, candidate{
				Sym: meta.Sym, Corr: math.Round(score*100) / 100,
				Color: meta.Color, Norm: norm,
			})
		}
	}

	sort.Slice(candidates, func(i, j int) bool {
		return candidates[i].Corr > candidates[j].Corr
	})

	writeJSON(w, map[string]any{
		"ref":        map[string]any{"sym": refSymbol, "color": refColor, "norm": refNorm},
		"candidates": candidates,
	})
}

// ─── Agent (mock) ────────────────────────────────────────────

func handleAgentChat(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Message string         `json:"message"`
		Context map[string]any `json:"context"`
	}
	json.NewDecoder(r.Body).Decode(&req)

	symbol := "BTC"
	if s, ok := req.Context["symbol"].(string); ok && s != "" {
		symbol = s
	}

	writeJSON(w, map[string]any{
		"role":        "ag",
		"body":        "正在分析 " + symbol + " 的相关数据... (demo)",
		"suggestions": []string{},
	})
}

func handleAgentAlerts(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, []map[string]any{
		{"tag": "hot", "tagText": "异动", "time": "2m", "title": "WIF 30 分钟内放量上涨 12.4%", "body": "Meme 板块整体跟涨，$300M 成交。"},
		{"tag": "up", "tagText": "走强", "time": "18m", "title": "AI 板块连续 3 日强于大盘", "body": "FET、RNDR 领涨，资金持续流入。"},
		{"tag": "info", "tagText": "关注", "time": "1h", "title": "BTC 接近 $67.8K 阻力位", "body": "近 30 日 4 次未能突破，关注成交量。"},
		{"tag": "dn", "tagText": "走弱", "time": "3h", "title": "TIA 跌破 30 日均线", "body": "成交量放大，需关注是否破位。"},
		{"tag": "info", "tagText": "相似", "time": "5h", "title": "SOL 走势接近 BTC 在 2024Q1", "body": "皮尔森相关 0.91，可参考历史路径。"},
	})
}
