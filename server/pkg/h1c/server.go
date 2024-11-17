// h1c is for creating an http/1.1 non-TLS server
// whose only purpose is to redirect to the TLS port
// it will also respond to healthchecks as that is
// sometimes useful
package h1c

import (
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"time"
)

func NewH1CRedirectServer(
	h1cPort string,
	httpsPort string,
	handleGetHealth func(version string) http.HandlerFunc,
	version string,
) *http.Server {
	h1cMux := http.NewServeMux()
	h1cMux.Handle("/healthz", handleGetHealth(version))
	h1cMux.HandleFunc("/", redirectHandler(httpsPort))
	h1c := &http.Server{
		Addr:              ":" + h1cPort,
		Handler:           h1cMux,
		ReadHeaderTimeout: time.Second,
		ReadTimeout:       5 * time.Minute,
		WriteTimeout:      5 * time.Minute,
		MaxHeaderBytes:    8 * 1024, // 8KiB
	}
	return h1c
}

func GetCertPaths(getenv func(string) string) (string, string) {
	home := getenv("HOME")
	kaRoot := getenv("KA_ROOT")
	if kaRoot == "" {
		kaRoot = filepath.Join(home, "khan", "webapp")
	}
	genFilesPath := filepath.Join(kaRoot, "genfiles")
	tlsPemPath := filepath.Join(genFilesPath, "tlsproxy.pem")
	tlsKeyPemPath := filepath.Join(genFilesPath, "tlsproxy-key.pem")
	if checkIfFileExists(tlsPemPath) && checkIfFileExists(tlsKeyPemPath) {
		return tlsPemPath, tlsKeyPemPath
	}
	return "", ""
}

func checkIfFileExists(abspath string) bool {
	_, err := os.Open(abspath)
	return err == nil
}

func redirectHandler(httpsPort string) http.HandlerFunc {
	return func(w http.ResponseWriter, req *http.Request) {
		// remove/add not default ports from req.Host
		addr := req.Host
		host, port, err := net.SplitHostPort(addr)
		if err == nil && port != "" {
			fmt.Println("Got error splitting host port", err)
			addr = host + ":" + httpsPort
		}
		target := "https://" + addr + req.URL.Path
		if len(req.URL.RawQuery) > 0 {
			target += "?" + req.URL.RawQuery
		}
		log.Printf("redirect to: %s", target)
		http.Redirect(w, req, target,
			// consider the codes 308, 302, or 301 for prod
			http.StatusTemporaryRedirect)
	}
}
