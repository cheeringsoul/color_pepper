package main

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"
)

var exMgr *ExchangeManager

func main() {
	exMgr = NewExchangeManager()

	wsHub := NewWSHub()
	wsHub.StartWatching()

	mux := http.NewServeMux()

	mux.HandleFunc("GET /api/market/overview", handleMarketOverview)
	mux.HandleFunc("GET /api/symbols", handleSymbols)
	mux.HandleFunc("GET /api/ticker/{symbol}", handleTicker)
	mux.HandleFunc("GET /api/klines/{symbol}", handleKlines)
	mux.HandleFunc("GET /api/orderbook/{symbol}", handleOrderBook)
	mux.HandleFunc("GET /api/sparkline/{symbol}", handleSparkline)
	mux.HandleFunc("GET /api/rotation/heatmap", handleRotationHeatmap)
	mux.HandleFunc("GET /api/rotation/analysis", handleRotationAnalysis)
	mux.HandleFunc("GET /api/btc/klines", handleBtcKlines)
	mux.HandleFunc("GET /api/similarity", handleSimilarity)
	mux.HandleFunc("POST /api/agent/chat", handleAgentChat)
	mux.HandleFunc("GET /api/agent/alerts", handleAgentAlerts)
	mux.HandleFunc("/ws/tickers", wsHub.HandleWS)
	mux.HandleFunc("/ws/kline", HandleKlineWS)
	mux.HandleFunc("/ws/orderbook", HandleOrderBookWS)

	handler := corsMiddleware(mux)

	log.Println("color_pepper_backend listening on :8080")
	log.Fatal(http.ListenAndServe(":8080", handler))
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func writeJSON(w http.ResponseWriter, v any) {
	w.Header().Set("Content-Type", "application/json")
	err := json.NewEncoder(w).Encode(v)
	if err != nil {
		return
	}
}

func queryInt(r *http.Request, key string, def int) int {
	s := r.URL.Query().Get(key)
	if s == "" {
		return def
	}
	n, err := strconv.Atoi(s)
	if err != nil {
		return def
	}
	return n
}

func queryFloat(r *http.Request, key string, def float64) float64 {
	s := r.URL.Query().Get(key)
	if s == "" {
		return def
	}
	n, err := strconv.ParseFloat(s, 64)
	if err != nil {
		return def
	}
	return n
}

func queryString(r *http.Request, key, def string) string {
	s := r.URL.Query().Get(key)
	if s == "" {
		return def
	}
	return s
}
