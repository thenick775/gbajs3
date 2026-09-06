package main

import (
	"bytes"
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gorilla/mux"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNewServerRouter(t *testing.T) {
	t.Parallel()

	router := newServerRouter()

	for _, tt := range []struct {
		name   string
		method string
		path   string
	}{
		{name: "root route", method: http.MethodGet, path: "/"},
		{name: "login route", method: http.MethodPost, path: "/api/account/login"},
		{name: "swagger route", method: http.MethodGet, path: "/api/documentation/index.html"},
	} {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(tt.method, tt.path, nil)
			match := &mux.RouteMatch{}

			assert.True(t, router.Match(req, match))
			require.NotNil(t, match.Handler)
		})
	}
}

func TestNewServerHandlerAppliesCors(t *testing.T) {
	t.Parallel()

	handler := newServerHandler("https://gbajs.dev")
	req := httptest.NewRequest(http.MethodOptions, "/api/account/login", nil)
	req.Header.Set("Origin", "https://gbajs.dev")
	req.Header.Set("Access-Control-Request-Method", http.MethodPost)
	res := httptest.NewRecorder()

	handler.ServeHTTP(res, req)

	assert.Equal(t, "https://gbajs.dev", res.Header().Get("Access-Control-Allow-Origin"))
	assert.Equal(t, "true", res.Header().Get("Access-Control-Allow-Credentials"))
	assert.Contains(t, res.Header().Get("Access-Control-Allow-Methods"), http.MethodPost)
	assert.NotEqual(t, http.StatusNotFound, res.Code)
}

func TestNewRollingLogger(t *testing.T) {
	t.Parallel()

	got := newRollingLogger()

	assert.Equal(t, "./logs/auth_server_log.log", got.Filename)
	assert.Equal(t, 50, got.MaxSize)
	assert.Equal(t, 5, got.MaxBackups)
	assert.Equal(t, 15, got.MaxAge)
	assert.True(t, got.Compress)
}

func TestNewGormConfig(t *testing.T) {
	t.Parallel()

	buf := &bytes.Buffer{}
	got := newGormConfig(buf)

	require.NotNil(t, got)
	assert.True(t, got.PrepareStmt)
	require.NotNil(t, got.Logger)
	got.Logger.Error(context.TODO(), "boom")
	assert.Contains(t, buf.String(), "[DEBUG]")
	assert.Contains(t, buf.String(), "boom")
}
