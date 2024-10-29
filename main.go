package main

import (
	"embed"
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"os"
	"path"
	"strings"

	"golang.org/x/net/http2"
	"golang.org/x/net/http2/h2c"

	server "github.com/Khan/hackathon-khanmigogo/server/pkg"
	pollv1connect "github.com/Khan/hackathon-khanmigogo/server/poll/v1/v1connect"
)

const address = "localhost:8080"

// TODO(steve):
// graceful shutdown
// need http timeouts
// slog
// update all players when host leaves
// allow resubscribe by any player
// not crypto grade random numbers for room codes
// odd: when time runs out, the server gets an endvoting request from host client?
func main() {
	pollServer := &server.PollServer{
		Rooms: make(map[string]*server.Room),
	}
	mux := http.NewServeMux()
	mux.HandleFunc("/", StaticHandler)
	mux.HandleFunc("/healthz", HealthHandler)
	pollPath, handler := pollv1connect.NewPollServiceHandler(pollServer)
	mux.Handle(pollPath, handler)

	fmt.Println("Starting Listening on http://" + address)
	// TODO(steve): This is not a graceful shutdown setup
	// and has no default timeouts set
	err := http.ListenAndServe(address,
		h2c.NewHandler(mux, &http2.Server{}), // Use h2c so we can serve HTTP/2 without TLS.
	)
	if err != nil {
		log.Fatalf("failed to serve: %v\n", err)
	}
}

//go:embed ui/build
var files embed.FS

func StaticHandler(w http.ResponseWriter, r *http.Request) {
	subpath, err := fs.Sub(files, "ui/build")
	if err != nil {
		// ui/build *is* the constant
		fmt.Println("Impossible:", err)
	}
	fileServer := http.FileServer(http.FS(subpath))
	if r.URL.Path == "/" {
		fileServer.ServeHTTP(w, r)
		return
	}
	f, err := subpath.Open(strings.TrimPrefix(path.Clean(r.URL.Path), "/"))
	if err == nil {
		defer f.Close()
	}
	if os.IsNotExist(err) {
		r.URL.Path = "/"
	}
	fileServer.ServeHTTP(w, r)
}

func HealthHandler(w http.ResponseWriter, _ *http.Request) {
	w.WriteHeader(http.StatusOK)
	_, _ = fmt.Fprint(w, "Server is healthy")
}
