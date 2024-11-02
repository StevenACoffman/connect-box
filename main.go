package main

import (
	"context"
	"embed"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"io/fs"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"path"
	"runtime/debug"
	"strings"
	"syscall"
	"time"

	"connectrpc.com/connect"
	"golang.org/x/net/http2"
	"golang.org/x/net/http2/h2c"
	"golang.org/x/sync/errgroup"

	server "github.com/Khan/hackathon-khanmigogo/server/pkg"
	"github.com/Khan/hackathon-khanmigogo/server/pkg/middleware"
	pollv1connect "github.com/Khan/hackathon-khanmigogo/server/poll/v1/v1connect"
)

// Version is set at build time using ldflags.
// It is optional and can be omitted if not required.
// Refer to [handleGetHealth] for more information.
var Version string

func main() {
	ctx := context.Background()
	if err := run(ctx, os.Stdout, os.Args, os.Getenv, Version); err != nil {
		fmt.Fprintf(os.Stderr, "%s\n", err)
		os.Exit(1)
	}
}

// TODO(steve):
// structured log (slog) instead of fmt.Printf
// update all players when host leaves
// allow resubscribe by any player
// not crypto grade random numbers for room codes
// odd: when time runs out, the server gets an end voting request from host client?
func run(
	ctx context.Context,
	w io.Writer,
	args []string,
	getenv func(string) string,
	version string,
) error {
	ctx, cancel := signal.NotifyContext(ctx,
		os.Interrupt,    // interrupt = SIGINT = Ctrl+C
		syscall.SIGQUIT, // Ctrl-\
		syscall.SIGTERM, // "the normal way to politely ask a program to terminate"
	)
	defer cancel()

	var port uint
	flags := flag.NewFlagSet(args[0], flag.ExitOnError)
	flags.SetOutput(w)
	flags.UintVar(&port, "port", 8080, "port for http api")
	if err := flags.Parse(args[1:]); err != nil {
		return err
	}

	slog.SetDefault(slog.New(slog.NewJSONHandler(w, nil)))

	addr := fmt.Sprintf(":%d", port)
	slog.Info(fmt.Sprintf("Starting connectrpc on %s", addr))
	handler := route(slog.Default(), version)

	h2cServer := &http.Server{
		Addr: addr,
		Handler: h2c.NewHandler(
			handler,
			&http2.Server{},
		),
		ReadHeaderTimeout: time.Second,
		ReadTimeout:       5 * time.Minute,
		WriteTimeout:      5 * time.Minute,
		MaxHeaderBytes:    8 * 1024, // 8KiB
	}

	eg, egCtx := errgroup.WithContext(ctx)
	eg.Go(func() error {
		slog.InfoContext(
			ctx,
			"h2cServer started",
			slog.Uint64("port", uint64(port)),
			slog.String("version", version),
		)
		return h2cServer.ListenAndServe()
	})
	eg.Go(func() error {
		<-egCtx.Done()
		slog.Info("Shutdown because Server context Done:" + context.Cause(egCtx).Error())
		// new context and cancel just for shutdown
		sdCtx, sdCancel := context.WithTimeoutCause(
			context.Background(),
			10*time.Second,
			fmt.Errorf("shutdown 10s exceeded"))
		defer sdCancel()
		return h2cServer.Shutdown(sdCtx)
	})
	err := eg.Wait()
	return err
}

// route sets up and returns an [http.Handler] for all the server routes.
// It is the single source of truth for all the routes.
// You can add custom [http.Handler] as needed.
func route(log *slog.Logger, version string) http.Handler {
	pollServer := &server.PollServer{
		Rooms:       make(map[string]*server.Room),
		StreamDelay: 1 * time.Second,
	}
	mux := http.NewServeMux()
	mux.HandleFunc("/", StaticHandler)
	mux.Handle("GET /healthz", handleGetHealth(version))
	compress1KB := connect.WithCompressMinBytes(1024)
	pollPath, pollHandler := pollv1connect.NewPollServiceHandler(pollServer, compress1KB)
	mux.Handle(pollPath, pollHandler)
	// request context is getting cancelled. Maybe middleware?
	handler := middleware.AccessLog(mux, log)
	handler = middleware.Recovery(mux, log)

	return handler
}

//go:embed ui/build
var files embed.FS

func StaticHandler(w http.ResponseWriter, r *http.Request) {
	subPath, err := fs.Sub(files, "ui/build")
	if err != nil {
		// ui/build *is* the constant
		fmt.Println("Impossible:", err)
	}
	fileServer := http.FileServer(http.FS(subPath))
	if r.URL.Path == "/" {
		fileServer.ServeHTTP(w, r)
		return
	}
	f, err := subPath.Open(strings.TrimPrefix(path.Clean(r.URL.Path), "/"))
	if err == nil {
		defer f.Close()
	}
	if os.IsNotExist(err) {
		r.URL.Path = "/"
	}
	fileServer.ServeHTTP(w, r)
}

// handleGetHealth returns an [http.HandlerFunc] that responds with the health status of the
// service.
// It includes the service version, VCS revision, build time, and modified status.
// The service version can be set at build time using the VERSION variable (e.g., 'make build
// VERSION=v1.0.0').
func handleGetHealth(version string) http.HandlerFunc {
	type responseBody struct {
		Version        string    `json:"Version"`
		Uptime         string    `json:"Uptime"`
		LastCommitHash string    `json:"LastCommitHash"`
		LastCommitTime time.Time `json:"LastCommitTime"`
		DirtyBuild     bool      `json:"DirtyBuild"`
	}

	res := responseBody{Version: version}
	buildInfo, _ := debug.ReadBuildInfo()
	for _, kv := range buildInfo.Settings {
		if kv.Value == "" {
			continue
		}
		switch kv.Key {
		case "vcs.revision":
			res.LastCommitHash = kv.Value
		case "vcs.time":
			res.LastCommitTime, _ = time.Parse(time.RFC3339, kv.Value)
		case "vcs.modified":
			res.DirtyBuild = kv.Value == "true"
		}
	}

	up := time.Now()
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)

		res.Uptime = time.Since(up).String()
		if err := json.NewEncoder(w).Encode(res); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
	}
}
