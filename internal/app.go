package internal

import (
	"context"
	"log"
	"net/http"
	"os"
	"path"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"golang.org/x/xerrors"
)

type buildInfo struct {
	Commit string
	Version string
	Date string
}

func Run(logger *log.Logger, commit, version, date string) {
	cfg := newConfig(logger)

	newApp(cfg, logger, buildInfo{
		Commit:  commit,
		Version: version,
		Date:    date,
	}).run()
}

type app struct {
	db  *mongo.Database
	mux *http.ServeMux
	log *log.Logger

	cfg config
	server http.Server

	info buildInfo
}

func newApp(cfg config, logger *log.Logger, info buildInfo) *app {
	a := app{
		log: logger,
		cfg: cfg,
		server: http.Server{
			Addr: cfg.addr,
		},

		info: info,
	}

	// Routing
	mux := http.NewServeMux()

	mux.HandleFunc("/api/examples", a.logging(a.exampleList))
	mux.HandleFunc("/api/collections", a.logging(a.collectionsList))
	mux.HandleFunc("/api/auth/sign-in", a.logging(a.singIn))
	mux.HandleFunc("/api/auth/sign-out", a.logging(a.signOut))
	mux.HandleFunc("/api/auth/sign-up", a.logging(a.signUp))
	mux.HandleFunc("/api/info", a.logging(a.infoHandler))

	// Static content
	exec, err := os.Executable()
	if err != nil {
		a.log.Fatal(xerrors.Errorf("can't find executable path: %w", err))
	}
	mux.Handle("/", a.logging(staticGzip(http.FileServer(http.Dir(path.Join(path.Dir(exec), "web"))))))

	a.server.Handler = mux

	// Storage
	client, err := mongo.Connect(context.Background(), options.Client().ApplyURI(cfg.dbURI))
	if err != nil {
		a.log.Fatal(xerrors.Errorf("mongo.Connect fail: %w", err))
	}
	ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
	err = client.Ping(ctx, nil)
	if err != nil {
		a.log.Fatal(xerrors.Errorf("client.Ping fail: %w", err))
	}
	cancel()
	a.db = client.Database(cfg.database)

	return &a
}

func (a *app) run() {
	a.log.Println("daemon i8080 start on", a.server.Addr)
	a.log.Fatal(a.server.ListenAndServe())
}
