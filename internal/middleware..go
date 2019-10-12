package internal

import (
	"net/http"
	"strings"
)

var types = map[string]string{
	"js": "application/javascript",
	"css": "text/css",
}

func staticGzip(next http.Handler) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		for suffix, mime := range types {
			if strings.HasSuffix(r.URL.Path, suffix) {
				w.Header().Set("Content-Type", mime)
				w.Header().Set("Content-Encoding", "gzip")
				r.URL.Path += ".gz"
				break
			}
		}

		next.ServeHTTP(w, r)
	}
}

func (a *app) logging(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		a.log.Println(r.RemoteAddr, r.Method, r.URL.String())

		next.ServeHTTP(w, r)
	}
}
