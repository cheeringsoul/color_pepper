package gateway

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/gorilla/websocket"

	ccxt "github.com/ccxt/ccxt/go/v4"
	ccxtpro "github.com/ccxt/ccxt/go/v4/pro"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

func proConfig() map[string]interface{} {
	cfg := map[string]interface{}{
		"enableRateLimit": true,
	}
	for _, env := range []string{"HTTPS_PROXY", "https_proxy", "HTTP_PROXY", "http_proxy"} {
		if proxy := os.Getenv(env); proxy != "" {
			cfg["httpsProxy"] = proxy
			break
		}
	}
	return cfg
}

type tickerMsg struct {
	Sym     string  `json:"sym"`
	Price   float64 `json:"price"`
	Chg     float64 `json:"chg"`
	High24h float64 `json:"high24h"`
	Low24h  float64 `json:"low24h"`
	Vol     float64 `json:"vol"`
}

type wsClient struct {
	conn *websocket.Conn
	send chan []byte
}

func newWSClient(conn *websocket.Conn) *wsClient {
	return &wsClient{conn: conn, send: make(chan []byte, 64)}
}

func (c *wsClient) writePump() {
	defer c.conn.Close()
	for msg := range c.send {
		if err := c.conn.WriteMessage(websocket.TextMessage, msg); err != nil {
			return
		}
	}
}

// ─── Ticker Hub (broadcast to all clients) ──────────────────

type WSHub struct {
	clients map[*wsClient]bool
	mu      sync.RWMutex
}

func NewWSHub() *WSHub {
	return &WSHub{clients: make(map[*wsClient]bool)}
}

func (h *WSHub) addClient(c *wsClient) {
	h.mu.Lock()
	h.clients[c] = true
	h.mu.Unlock()
}

func (h *WSHub) removeClient(c *wsClient) {
	h.mu.Lock()
	if _, ok := h.clients[c]; ok {
		delete(h.clients, c)
		close(c.send)
	}
	h.mu.Unlock()
}

func (h *WSHub) broadcast(data []byte) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	for c := range h.clients {
		select {
		case c.send <- data:
		default:
			go h.removeClient(c)
		}
	}
}

func (h *WSHub) HandleWS(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("ws upgrade error: %v", err)
		return
	}
	c := newWSClient(conn)
	h.addClient(c)
	log.Printf("ws client connected (total: %d)", len(h.clients))

	go c.writePump()

	defer h.removeClient(c)
	for {
		if _, _, err := conn.ReadMessage(); err != nil {
			break
		}
	}
}

func (h *WSHub) StartWatching() {
	cfg := proConfig()

	go h.watchExchange("Binance", func() watcher {
		ex := ccxtpro.NewBinance(copyMap(cfg))
		return &binanceWatcher{ex: ex}
	})

	go h.watchExchange("OKX", func() watcher {
		ex := ccxtpro.NewOkx(copyMap(cfg))
		return &okxWatcher{ex: ex}
	})
}

type watcher interface {
	loadMarkets() (map[string]ccxt.MarketInterface, error)
	watchTickers(symbols []string) (ccxt.Tickers, error)
}

type binanceWatcher struct{ ex *ccxtpro.Binance }

func (w *binanceWatcher) loadMarkets() (map[string]ccxt.MarketInterface, error) {
	return w.ex.LoadMarkets()
}
func (w *binanceWatcher) watchTickers(symbols []string) (ccxt.Tickers, error) {
	return w.ex.WatchTickers(ccxt.WithWatchTickersSymbols(symbols))
}

type okxWatcher struct{ ex *ccxtpro.Okx }

func (w *okxWatcher) loadMarkets() (map[string]ccxt.MarketInterface, error) {
	return w.ex.LoadMarkets()
}
func (w *okxWatcher) watchTickers(symbols []string) (ccxt.Tickers, error) {
	return w.ex.WatchTickers(ccxt.WithWatchTickersSymbols(symbols))
}

func (h *WSHub) watchExchange(name string, create func() watcher) {
	for {
		w := create()
		log.Printf("ws: loading %s markets...", name)
		markets, err := w.loadMarkets()
		if err != nil {
			log.Printf("ws: %s loadMarkets failed: %v, retrying in 10s", name, err)
			time.Sleep(10 * time.Second)
			continue
		}

		pairMap := buildPairMap(markets)
		var pairs []string
		pairToSym := make(map[string]string)
		for _, meta := range symbolMetas {
			if p, ok := pairMap[meta.Sym]; ok {
				pairs = append(pairs, p)
				pairToSym[p] = meta.Sym
			}
		}
		if len(pairs) == 0 {
			log.Printf("ws: %s no matching pairs, retrying in 10s", name)
			time.Sleep(10 * time.Second)
			continue
		}
		log.Printf("ws: %s watching %d pairs", name, len(pairs))

		for {
			tickers, err := w.watchTickers(pairs)
			if err != nil {
				errStr := err.Error()
				if strings.Contains(errStr, "closed") || strings.Contains(errStr, "EOF") {
					log.Printf("ws: %s connection lost, reconnecting...", name)
				} else {
					log.Printf("ws: %s watch error: %v", name, err)
				}
				time.Sleep(2 * time.Second)
				break
			}

			for p, t := range tickers.Tickers {
				sym, ok := pairToSym[p]
				if !ok {
					continue
				}
				msg := tickerMsg{
					Sym:     sym,
					Price:   derefFloat(t.Last),
					Chg:     derefFloat(t.Percentage),
					High24h: derefFloat(t.High),
					Low24h:  derefFloat(t.Low),
					Vol:     derefFloat(t.QuoteVolume),
				}
				data, _ := json.Marshal(msg)
				h.broadcast(data)
			}
		}
	}
}

// ─── Per-client Kline WebSocket ─────────────────────────────

func resolvePairAndExchange(sym string) (pair, exName string) {
	for _, ex := range exMgr.exchanges {
		if p, ok := ex.resolve(sym); ok {
			return p, ex.name
		}
	}
	return "", ""
}

func createWatchOHLCV(exName string) (func(string, ...ccxt.WatchOHLCVOptions) ([]ccxt.OHLCV, error), error) {
	cfg := proConfig()
	switch exName {
	case "Binance":
		ex := ccxtpro.NewBinance(copyMap(cfg))
		if _, err := ex.LoadMarkets(); err != nil {
			return nil, err
		}
		return ex.WatchOHLCV, nil
	case "OKX":
		ex := ccxtpro.NewOkx(copyMap(cfg))
		if _, err := ex.LoadMarkets(); err != nil {
			return nil, err
		}
		return ex.WatchOHLCV, nil
	}
	return nil, nil
}

func createWatchOrderBook(exName string) (func(string, ...ccxt.WatchOrderBookOptions) (ccxt.OrderBook, error), error) {
	cfg := proConfig()
	switch exName {
	case "Binance":
		ex := ccxtpro.NewBinance(copyMap(cfg))
		if _, err := ex.LoadMarkets(); err != nil {
			return nil, err
		}
		return ex.WatchOrderBook, nil
	case "OKX":
		ex := ccxtpro.NewOkx(copyMap(cfg))
		if _, err := ex.LoadMarkets(); err != nil {
			return nil, err
		}
		return ex.WatchOrderBook, nil
	}
	return nil, nil
}

func HandleKlineWS(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("ws/kline upgrade: %v", err)
		return
	}

	sym := strings.ToUpper(r.URL.Query().Get("symbol"))
	interval := r.URL.Query().Get("interval")
	if sym == "" {
		sym = "BTC"
	}
	if interval == "" {
		interval = "1h"
	}

	pair, exName := resolvePairAndExchange(sym)
	if pair == "" {
		log.Printf("ws/kline: no pair for %s", sym)
		conn.Close()
		return
	}

	watchFn, err := createWatchOHLCV(exName)
	if err != nil || watchFn == nil {
		log.Printf("ws/kline: create exchange %s: %v", exName, err)
		conn.Close()
		return
	}

	log.Printf("ws/kline: %s %s via %s", sym, interval, exName)

	done := make(chan struct{})
	go func() {
		defer close(done)
		for {
			if _, _, err := conn.ReadMessage(); err != nil {
				return
			}
		}
	}()

	go func() {
		for {
			select {
			case <-done:
				return
			default:
			}

			ohlcv, err := watchFn(pair, ccxt.WithWatchOHLCVTimeframe(interval))
			if err != nil {
				select {
				case <-done:
					return
				default:
					errStr := err.Error()
					if strings.Contains(errStr, "closed") || strings.Contains(errStr, "EOF") {
						return
					}
					log.Printf("ws/kline %s: %v", sym, err)
					time.Sleep(2 * time.Second)
					continue
				}
			}

			if len(ohlcv) == 0 {
				continue
			}
			last := ohlcv[len(ohlcv)-1]
			data, _ := json.Marshal(map[string]any{
				"type": "kline", "symbol": sym,
				"time": last.Timestamp / 1000,
				"open": last.Open, "high": last.High,
				"low": last.Low, "close": last.Close,
				"volume": last.Volume,
			})
			if err := conn.WriteMessage(websocket.TextMessage, data); err != nil {
				return
			}
		}
	}()

	<-done
	conn.Close()
}

// ─── Per-client OrderBook WebSocket ─────────────────────────

func HandleOrderBookWS(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("ws/orderbook upgrade: %v", err)
		return
	}

	sym := strings.ToUpper(r.URL.Query().Get("symbol"))
	if sym == "" {
		sym = "BTC"
	}
	limit := 9

	pair, exName := resolvePairAndExchange(sym)
	if pair == "" {
		log.Printf("ws/orderbook: no pair for %s", sym)
		conn.Close()
		return
	}

	watchFn, err := createWatchOrderBook(exName)
	if err != nil || watchFn == nil {
		log.Printf("ws/orderbook: create exchange %s: %v", exName, err)
		conn.Close()
		return
	}

	log.Printf("ws/orderbook: %s via %s", sym, exName)

	done := make(chan struct{})
	go func() {
		defer close(done)
		for {
			if _, _, err := conn.ReadMessage(); err != nil {
				return
			}
		}
	}()

	go func() {
		type level struct {
			Price float64 `json:"price"`
			Qty   float64 `json:"qty"`
			Total float64 `json:"total"`
		}

		for {
			select {
			case <-done:
				return
			default:
			}

			ob, err := watchFn(pair, ccxt.WithWatchOrderBookLimit(int64(limit)))
			if err != nil {
				select {
				case <-done:
					return
				default:
					errStr := err.Error()
					if strings.Contains(errStr, "closed") || strings.Contains(errStr, "EOF") {
						return
					}
					log.Printf("ws/orderbook %s: %v", sym, err)
					time.Sleep(2 * time.Second)
					continue
				}
			}

			asks := make([]level, 0, limit)
			var cumA float64
			for _, a := range ob.Asks {
				if len(a) < 2 {
					continue
				}
				cumA += a[1]
				asks = append(asks, level{a[0], a[1], cumA})
				if len(asks) >= limit {
					break
				}
			}

			bids := make([]level, 0, limit)
			var cumB float64
			for _, b := range ob.Bids {
				if len(b) < 2 {
					continue
				}
				cumB += b[1]
				bids = append(bids, level{b[0], b[1], cumB})
				if len(bids) >= limit {
					break
				}
			}

			maxTotal := cumA
			if cumB > maxTotal {
				maxTotal = cumB
			}
			midPrice := 0.0
			if len(ob.Asks) > 0 && len(ob.Bids) > 0 {
				midPrice = (ob.Asks[0][0] + ob.Bids[0][0]) / 2
			}

			data, _ := json.Marshal(map[string]any{
				"type": "orderbook", "symbol": sym,
				"asks": asks, "bids": bids,
				"maxTotal": maxTotal, "midPrice": midPrice,
			})
			if err := conn.WriteMessage(websocket.TextMessage, data); err != nil {
				return
			}
		}
	}()

	<-done
	conn.Close()
}
