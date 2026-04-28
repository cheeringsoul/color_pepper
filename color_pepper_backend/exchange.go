package main

import (
	"fmt"
	"log"
	"math"
	"os"
	"strings"
	"sync"
	"time"

	ccxt "github.com/ccxt/ccxt/go/v4"
)

type SymbolMeta struct {
	Sym    string
	Name   string
	Color  string
	Sector string
	Mcap   float64
}

var symbolMetas = []SymbolMeta{
	{"BTC", "Bitcoin", "#f7931a", "主流币", 1320e9},
	{"ETH", "Ethereum", "#627eea", "主流币", 426e9},
	{"SOL", "Solana", "#9945ff", "Solana", 82e9},
	{"BNB", "BNB", "#f3ba2f", "Layer 1", 90e9},
	{"XRP", "Ripple", "#23292f", "支付", 32e9},
	{"DOGE", "Dogecoin", "#c2a633", "Meme", 22e9},
	{"TON", "Toncoin", "#0088cc", "Layer 1", 18e9},
	{"AVAX", "Avalanche", "#e84142", "Layer 1", 14e9},
	{"LINK", "Chainlink", "#2a5ada", "DeFi", 9.6e9},
	{"MATIC", "Polygon", "#8247e5", "Layer 2", 8.4e9},
	{"DOT", "Polkadot", "#e6007a", "Layer 1", 9.2e9},
	{"SHIB", "Shiba Inu", "#ffa409", "Meme", 13e9},
	{"ARB", "Arbitrum", "#28a0f0", "Layer 2", 4.6e9},
	{"OP", "Optimism", "#ff0420", "Layer 2", 4.2e9},
	{"INJ", "Injective", "#00d2ff", "DeFi", 2.8e9},
	{"SUI", "Sui", "#6fbcf0", "Layer 1", 3.8e9},
	{"WIF", "dogwifhat", "#9b56e0", "Meme", 2.4e9},
	{"PEPE", "Pepe", "#52b788", "Meme", 3.7e9},
	{"FET", "Fetch.ai", "#3b3b3b", "AI", 1.6e9},
	{"RNDR", "Render", "#ee2362", "AI", 3.0e9},
	{"AAVE", "Aave", "#b6509e", "DeFi", 1.3e9},
	{"UNI", "Uniswap", "#ff007a", "DeFi", 4.4e9},
	{"NEAR", "Near Protocol", "#00ec97", "Layer 1", 5.0e9},
	{"TIA", "Celestia", "#7b1cff", "Layer 1", 1.4e9},
}

var sectorList = []string{"主流币", "Layer 1", "Layer 2", "DeFi", "Meme", "AI", "Solana", "支付"}

// token renames: exchange base currency -> our display symbol
var tokenAliases = map[string]string{
	"POL":    "MATIC",
	"RENDER": "RNDR",
}

func findMeta(sym string) *SymbolMeta {
	for i := range symbolMetas {
		if symbolMetas[i].Sym == sym {
			return &symbolMetas[i]
		}
	}
	return nil
}

// ─── Cached entries ──────────────────────────────────────────

type cachedTicker struct {
	data ccxt.Ticker
	ts   time.Time
}

type cachedOHLCV struct {
	data []ccxt.OHLCV
	ts   time.Time
}

type cachedOrderBook struct {
	data ccxt.OrderBook
	ts   time.Time
}

// ─── exchange wrapper ───────────────────────────────────────

type exchange struct {
	name    string
	fetch   exchangeMethods
	pairMap map[string]string // our sym -> exchange pair, e.g. "MATIC" -> "POL/USDT"
}

type exchangeMethods struct {
	fetchTicker    func(string, ...ccxt.FetchTickerOptions) (ccxt.Ticker, error)
	fetchTickers   func(...ccxt.FetchTickersOptions) (ccxt.Tickers, error)
	fetchOHLCV     func(string, ...ccxt.FetchOHLCVOptions) ([]ccxt.OHLCV, error)
	fetchOrderBook func(string, ...ccxt.FetchOrderBookOptions) (ccxt.OrderBook, error)
	loadMarkets    func(...interface{}) (map[string]ccxt.MarketInterface, error)
}

// ─── ExchangeManager ────────────────────────────────────────

type ExchangeManager struct {
	exchanges []*exchange

	mu         sync.RWMutex
	tickers    map[string]cachedTicker
	ohlcvs     map[string]cachedOHLCV
	orderbooks map[string]cachedOrderBook
}

func NewExchangeManager() *ExchangeManager {
	cfg := map[string]interface{}{
		"enableRateLimit": true,
	}
	for _, env := range []string{"HTTPS_PROXY", "https_proxy", "HTTP_PROXY", "http_proxy"} {
		if proxy := os.Getenv(env); proxy != "" {
			cfg["httpsProxy"] = proxy
			break
		}
	}

	binance := ccxt.NewBinance(copyMap(cfg))
	okx := ccxt.NewOkx(copyMap(cfg))

	m := &ExchangeManager{
		tickers:    make(map[string]cachedTicker),
		ohlcvs:     make(map[string]cachedOHLCV),
		orderbooks: make(map[string]cachedOrderBook),
	}

	binanceEx := &exchange{
		name: "Binance",
		fetch: exchangeMethods{
			fetchTicker:    binance.FetchTicker,
			fetchTickers:   binance.FetchTickers,
			fetchOHLCV:     binance.FetchOHLCV,
			fetchOrderBook: binance.FetchOrderBook,
			loadMarkets:    binance.LoadMarkets,
		},
	}
	okxEx := &exchange{
		name: "OKX",
		fetch: exchangeMethods{
			fetchTicker:    okx.FetchTicker,
			fetchTickers:   okx.FetchTickers,
			fetchOHLCV:     okx.FetchOHLCV,
			fetchOrderBook: okx.FetchOrderBook,
			loadMarkets:    okx.LoadMarkets,
		},
	}

	for _, ex := range []*exchange{binanceEx, okxEx} {
		log.Printf("loading %s markets...", ex.name)
		markets, err := ex.fetch.loadMarkets()
		if err != nil {
			log.Printf("warning: failed to load %s markets: %v", ex.name, err)
			continue
		}
		log.Printf("%s markets loaded (%d)", ex.name, len(markets))
		ex.pairMap = buildPairMap(markets)
		m.exchanges = append(m.exchanges, ex)
	}

	return m
}

// buildPairMap scans exchange markets and maps our base symbols to the
// actual USDT spot pair the exchange uses (handles renames like MATIC→POL).
func buildPairMap(markets map[string]ccxt.MarketInterface) map[string]string {
	pm := make(map[string]string)
	for symbol, mkt := range markets {
		if mkt.QuoteCurrency == nil || *mkt.QuoteCurrency != "USDT" {
			continue
		}
		if mkt.Type != nil && *mkt.Type != "spot" {
			continue
		}
		if mkt.Active != nil && !*mkt.Active {
			continue
		}
		base := ""
		if mkt.BaseCurrency != nil {
			base = *mkt.BaseCurrency
		}
		if base == "" {
			continue
		}
		// map exchange base currency back to our symbol list
		for _, meta := range symbolMetas {
			if strings.EqualFold(base, meta.Sym) {
				pm[meta.Sym] = symbol
			}
		}
		// handle renamed tokens: e.g. exchange has POL, we use MATIC
		if ourSym, ok := tokenAliases[base]; ok {
			pm[ourSym] = symbol
		}
		pm[base] = symbol
	}
	return pm
}

func (ex *exchange) resolve(sym string) (string, bool) {
	if ex.pairMap == nil {
		return "", false
	}
	if p, ok := ex.pairMap[sym]; ok {
		return p, true
	}
	return "", false
}

// ─── Ticker ──────────────────────────────────────────────────

func (m *ExchangeManager) GetTicker(sym string) (ccxt.Ticker, error) {
	m.mu.RLock()
	if c, ok := m.tickers[sym]; ok && time.Since(c.ts) < 10*time.Second {
		m.mu.RUnlock()
		return c.data, nil
	}
	m.mu.RUnlock()

	var lastErr error
	for _, ex := range m.exchanges {
		p, ok := ex.resolve(sym)
		if !ok {
			continue
		}
		ticker, err := ex.fetch.fetchTicker(p)
		if err != nil {
			lastErr = err
			continue
		}
		m.mu.Lock()
		m.tickers[sym] = cachedTicker{data: ticker, ts: time.Now()}
		m.mu.Unlock()
		return ticker, nil
	}
	if lastErr == nil {
		lastErr = fmt.Errorf("symbol %s not found on any exchange", sym)
	}
	return ccxt.Ticker{}, lastErr
}

func (m *ExchangeManager) GetAllTickers() (map[string]ccxt.Ticker, error) {
	for _, ex := range m.exchanges {
		var pairs []string
		pairToSym := make(map[string]string)
		for _, meta := range symbolMetas {
			p, ok := ex.resolve(meta.Sym)
			if !ok {
				continue
			}
			pairs = append(pairs, p)
			pairToSym[p] = meta.Sym
		}
		if len(pairs) == 0 {
			continue
		}

		tickers, err := ex.fetch.fetchTickers(ccxt.WithFetchTickersSymbols(pairs))
		if err != nil {
			log.Printf("GetAllTickers %s failed: %v", ex.name, err)
			continue
		}

		result := make(map[string]ccxt.Ticker)
		now := time.Now()
		m.mu.Lock()
		for p, sym := range pairToSym {
			if t, ok := tickers.Tickers[p]; ok {
				result[sym] = t
				m.tickers[sym] = cachedTicker{data: t, ts: now}
			}
		}
		m.mu.Unlock()
		return result, nil
	}
	return nil, fmt.Errorf("all exchanges failed")
}

// ─── OHLCV ───────────────────────────────────────────────────

func (m *ExchangeManager) GetOHLCV(sym, timeframe string, limit int) ([]ccxt.OHLCV, error) {
	cacheKey := fmt.Sprintf("%s:%s:%d", sym, timeframe, limit)

	ttl := 60 * time.Second
	switch timeframe {
	case "1m", "5m":
		ttl = 10 * time.Second
	case "15m", "1h":
		ttl = 30 * time.Second
	case "4h", "1d", "1w":
		ttl = 5 * time.Minute
	}

	m.mu.RLock()
	if c, ok := m.ohlcvs[cacheKey]; ok && time.Since(c.ts) < ttl {
		m.mu.RUnlock()
		return c.data, nil
	}
	m.mu.RUnlock()

	var lastErr error
	for _, ex := range m.exchanges {
		p, ok := ex.resolve(sym)
		if !ok {
			continue
		}
		candles, err := ex.fetch.fetchOHLCV(p,
			ccxt.WithFetchOHLCVTimeframe(timeframe),
			ccxt.WithFetchOHLCVLimit(int64(limit)),
		)
		if err != nil {
			lastErr = err
			continue
		}
		m.mu.Lock()
		m.ohlcvs[cacheKey] = cachedOHLCV{data: candles, ts: time.Now()}
		m.mu.Unlock()
		return candles, nil
	}
	if lastErr == nil {
		lastErr = fmt.Errorf("OHLCV %s not found on any exchange", sym)
	}
	return nil, lastErr
}

// ─── OrderBook ───────────────────────────────────────────────

func (m *ExchangeManager) GetOrderBook(sym string, limit int) (ccxt.OrderBook, error) {
	cacheKey := fmt.Sprintf("%s:%d", sym, limit)

	m.mu.RLock()
	if c, ok := m.orderbooks[cacheKey]; ok && time.Since(c.ts) < 5*time.Second {
		m.mu.RUnlock()
		return c.data, nil
	}
	m.mu.RUnlock()

	var lastErr error
	for _, ex := range m.exchanges {
		p, ok := ex.resolve(sym)
		if !ok {
			continue
		}
		ob, err := ex.fetch.fetchOrderBook(p, ccxt.WithFetchOrderBookLimit(int64(limit)))
		if err != nil {
			lastErr = err
			continue
		}
		m.mu.Lock()
		m.orderbooks[cacheKey] = cachedOrderBook{data: ob, ts: time.Now()}
		m.mu.Unlock()
		return ob, nil
	}
	if lastErr == nil {
		lastErr = fmt.Errorf("orderbook %s not found on any exchange", sym)
	}
	return ccxt.OrderBook{}, lastErr
}

// ─── Helpers ────────────────────────────────────────────────

func copyMap(src map[string]interface{}) map[string]interface{} {
	dst := make(map[string]interface{}, len(src))
	for k, v := range src {
		dst[k] = v
	}
	return dst
}

func derefFloat(p *float64) float64 {
	if p == nil {
		return 0
	}
	return *p
}

func derefStr(p *string) string {
	if p == nil {
		return ""
	}
	return *p
}

func pearson(a, b []float64) float64 {
	n := len(a)
	if n != len(b) || n < 2 {
		return 0
	}
	var sumA, sumB, sumAB, sumA2, sumB2 float64
	for i := 0; i < n; i++ {
		sumA += a[i]
		sumB += b[i]
		sumAB += a[i] * b[i]
		sumA2 += a[i] * a[i]
		sumB2 += b[i] * b[i]
	}
	nf := float64(n)
	num := nf*sumAB - sumA*sumB
	den := math.Sqrt((nf*sumA2 - sumA*sumA) * (nf*sumB2 - sumB*sumB))
	if den == 0 {
		return 0
	}
	return num / den
}

func normalizeSeries(closes []float64) []float64 {
	if len(closes) == 0 {
		return nil
	}
	base := closes[0]
	if base == 0 {
		base = 1
	}
	out := make([]float64, len(closes))
	for i, c := range closes {
		out[i] = (c - base) / base * 100
	}
	return out
}
