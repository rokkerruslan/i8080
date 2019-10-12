package main

import (
	"log"
	"os"
	"strconv"
	"time"

	"i8080/internal"
)

var (
	Commit  string
	Version string
	Date    string
)

func main() {
	logger := log.New(os.Stdout, "", log.LstdFlags)

	i, err := strconv.ParseInt(Date, 10, 64)
	if err != nil {
		logger.Println("can't retrieve date")
	}

	logger.Println("Application Starts, build date:", time.Unix(i, 0).UTC(), "version:", Version, "commit hash:", Commit)

	internal.Run(logger, Commit, Version, Date)
}
