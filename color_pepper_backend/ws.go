package main

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
			// client too slow, drop it
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

	// read pump: drain client messages and detect disconnect
	defer h.removeClient(c)
	for {
		if _, _, err := conn.ReadMessage(); err != nil {
			break
		}
	}
}

// StartWatching launches a goroutine that streams live tickers via ccxt pro
func (h *WSHub) StartWatching() {
	cfg := map[string]interface{}{
		"enableRateLimit": true,
	}
	for _, env := range []string{"HTTPS_PROXY", "https_proxy", "HTTP_PROXY", "http_proxy"} {
		if proxy := os.Getenv(env); proxy != "" {
			cfg["httpsProxy"] = proxy
			break
		}
	}

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
				break // break inner loop to recreate exchange and reconnect
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
