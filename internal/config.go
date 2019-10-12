package internal

import (
	"log"
	"os"
)

type config struct {
	addr     string
	dbURI    string
	database string
	salt     string
}

// newConfig - retrieve application parameters from
// environment variables. If environment is inappropriate
// fails immediately with error message.
func newConfig(logger *log.Logger) config {
	var ok bool
	var cfg config

	if cfg.addr, ok = os.LookupEnv("ADDR"); !ok {
		logger.Fatal("ADDR is not set")
	}
	if cfg.dbURI, ok = os.LookupEnv("MONGODB_URI"); !ok {
		logger.Fatal("MONGODB_URI is not set")
	}
	if cfg.database, ok = os.LookupEnv("MONGODB_DATABASE"); !ok {
		logger.Fatal("MONGODB_DATABASE is not set")
	}
	if cfg.salt, ok = os.LookupEnv("SALT"); !ok {
		logger.Fatal("SALT is not set")
	}

	return cfg
}
