package main

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"time"

	"github.com/gorilla/mux"
	"github.com/natefinch/lumberjack"
	"github.com/rs/cors"
	httpSwagger "github.com/swaggo/http-swagger"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

type runtimeConfig struct {
	basePath   string
	certLoc    string
	keyLoc     string
	clientHost string
}

func newServerRouter() *mux.Router {
	router := mux.NewRouter().StrictSlash(false)
	addRoutes(router, ROUTES)
	router.PathPrefix("/api/documentation/").Handler(httpSwagger.WrapHandler)

	return router
}

func newCorsOptions(clientHost string) cors.Options {
	return cors.Options{
		AllowedOrigins:   []string{clientHost},
		AllowCredentials: true,
		AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Content-Type", "Content-Length", "Accept-Encoding", "Authorization", "X-Real-Ip", "X-Forwarded-For", "Host", "User-Agent", "Connection"},
		ExposedHeaders:   []string{"Set-Cookie"},
		Debug:            false,
	}
}

func newServerHandler(clientHost string) http.Handler {
	router := newServerRouter()
	corsHandler := cors.New(newCorsOptions(clientHost))

	return corsHandler.Handler(router)
}

func newRollingLogger() *lumberjack.Logger {
	return &lumberjack.Logger{
		Filename:   "./logs/auth_server_log.log",
		MaxSize:    50,
		MaxBackups: 5,
		MaxAge:     15,
		Compress:   true,
	}
}

func newGormLoggerConfig() logger.Config {
	return logger.Config{
		SlowThreshold:             time.Second,
		LogLevel:                  logger.Error,
		IgnoreRecordNotFoundError: true,
		Colorful:                  false,
	}
}

func newGormConfig(logOutput io.Writer) *gorm.Config {
	prefix := fmt.Sprintf("\n%s [DEBUG] ", time.Now().String()) + "\r\n"
	gormLogger := logger.New(
		log.New(logOutput, prefix, 0),
		newGormLoggerConfig(),
	)

	return &gorm.Config{
		PrepareStmt: true,
		Logger:      gormLogger,
	}
}

func initRuntime(getenv func(string) string) (runtimeConfig, *lumberjack.Logger, *gorm.Config) {
	cfg := runtimeConfig{
		basePath:   "./data",
		certLoc:    "./certs/fullchain.pem",
		keyLoc:     "./certs/privkey.pem",
		clientHost: getenv("CLIENT_HOST"),
	}
	logfile := newRollingLogger()
	gconf := newGormConfig(logfile)

	return cfg, logfile, gconf
}

func serveRequests(port string, certLoc string, keyLoc string, clientHost string) {
	handler := newServerHandler(clientHost)

	log.Println("handling requests initiated")
	log.Fatal(http.ListenAndServeTLS(port, certLoc, keyLoc, handler))
}
