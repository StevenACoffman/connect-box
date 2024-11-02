// middleware provide standard HTTP middleware
// TODO(steve): streaming connections seem to break these
// or rather, these break streaming connections so need some changes
package middleware

import (
	"bufio"
	"fmt"
	"log/slog"
	"net"
	"net/http"
	"runtime"
	"time"
)

// AccessLog is a middleware that logs request and response details,
// including latency, method, path, query parameters, IP address, response status, and bytes sent.
func AccessLog(next http.Handler, log *slog.Logger) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		wr := responseRecorder{ResponseWriter: w}

		next.ServeHTTP(&wr, r)

		log.InfoContext(r.Context(), "accessed",
			slog.String("latency", time.Since(start).String()),
			slog.String("method", r.Method),
			slog.String("path", r.URL.Path),
			slog.String("query", r.URL.RawQuery),
			slog.String("ip", r.RemoteAddr),
			slog.Int("status", wr.status),
			slog.Int("bytes", wr.numBytes))
	})
}

// Recovery is a middleware that recovers from panics during HTTP handler execution and logs the
// error details.
// It must be the last middleware in the chain to ensure it captures all panics.
func Recovery(next http.Handler, log *slog.Logger) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		wr := responseRecorder{ResponseWriter: w}
		defer func() {
			if err := recover(); err != nil {
				if err == http.ErrAbortHandler { // Handle the abort gracefully
					return
				}

				stack := make([]byte, 1024)
				n := runtime.Stack(stack, true)

				log.ErrorContext(r.Context(), "panic!",
					slog.Any("error", err),
					slog.String("stack", string(stack[:n])),
					slog.String("method", r.Method),
					slog.String("path", r.URL.Path),
					slog.String("query", r.URL.RawQuery),
					slog.String("ip", r.RemoteAddr))

				if wr.status == 0 { // response is not written yet
					http.Error(w, fmt.Sprintf("%v", err), http.StatusInternalServerError)
				}
			}
		}()
		next.ServeHTTP(&wr, r)
	})
}

// responseRecorder is a wrapper around [http.ResponseWriter] that records the status and bytes
// written during the response.
// It implements the [http.ResponseWriter] interface by embedding the original ResponseWriter.
type responseRecorder struct {
	http.ResponseWriter
	status   int
	numBytes int
}

// Flush is Necessary for Streaming connections
func (re *responseRecorder) Flush() {
	if flusher, ok := re.ResponseWriter.(http.Flusher); ok {
		flusher.Flush()
	}
}

// Necessary for Streaming connections
func (re *responseRecorder) FlushError() error {
	if flusher, ok := re.ResponseWriter.(interface{ FlushError() error }); ok {
		return flusher.FlushError()
	}
	return nil
}

func (re *responseRecorder) Hijack() (net.Conn, *bufio.ReadWriter, error) {
	if hijacker, ok := re.ResponseWriter.(http.Hijacker); ok {
		return hijacker.Hijack()
	}
	// TODO(steve): ???
	return nil, nil, fmt.Errorf("the hijacker interface is not supported")
}

func (re *responseRecorder) SetReadDeadline(deadline time.Time) error {
	if deadliner, ok := re.ResponseWriter.(interface {
		SetReadDeadline(deadline time.Time) error
	}); ok {
		return deadliner.SetReadDeadline(deadline)
	}
	return nil
}

func (re *responseRecorder) SetWriteDeadline(deadline time.Time) error {
	if deadliner, ok := re.ResponseWriter.(interface {
		SetWriteDeadline(deadline time.Time) error
	}); ok {
		return deadliner.SetWriteDeadline(deadline)
	}
	return nil
}

// Necessary for streaming like HTTP/2, SSE, Websockets
func (re *responseRecorder) EnableFullDuplex() error {
	if duplexer, ok := re.ResponseWriter.(interface{ EnableFullDuplex() error }); ok {
		return duplexer.EnableFullDuplex()
	}
	return nil
}

// The ResponseWriter should be the original value passed to the [Handler.ServeHTTP] method,
// or have an Unwrap method returning the original ResponseWriter.
//
// If the ResponseWriter implements any of the following methods, the ResponseController
// will call them as appropriate:
//
//	Flush()
//	FlushError() error // alternative Flush returning an error
//	Hijack() (net.Conn, *bufio.ReadWriter, error)
//	SetReadDeadline(deadline time.Time) error
//	SetWriteDeadline(deadline time.Time) error
//	EnableFullDuplex() error
//
// If the ResponseWriter does not support a method, ResponseController returns
// an error matching [ErrNotSupported].
func (re *responseRecorder) Unwrap() http.ResponseWriter {
	return re.ResponseWriter
}

// Header implements the [http.ResponseWriter] interface.
func (re *responseRecorder) Header() http.Header {
	return re.ResponseWriter.Header()
}

// Write implements the [http.ResponseWriter] interface.
func (re *responseRecorder) Write(b []byte) (int, error) {
	re.numBytes += len(b)
	return re.ResponseWriter.Write(b)
}

// WriteHeader implements the [http.ResponseWriter] interface.
func (re *responseRecorder) WriteHeader(statusCode int) {
	re.status = statusCode
	re.ResponseWriter.WriteHeader(statusCode)
}
