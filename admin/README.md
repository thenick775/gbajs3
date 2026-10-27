# Getting started

## Required env

```env
CLIENT_HOST=<public frontend URL>
APP_ID=<unique application identifier>

# postgres
PG_DB_HOST=<database host>
PG_DB_PORT=<database port>
PG_DB_USER=<database user>
PG_DB_PASSWORD=<database user password>
GBAJS_DB_NAME=<application database name>
ADMIN_DB_NAME=<admin database name>
PG_SSL_MODE=<PostgreSQL SSL mode>
```

## Required directories/files

For a direct local run, add certificate files at:

```text
./certs/fullchain.pem
./certs/privkey.pem
```

## Running the app

```sh
make serve
```

The standalone service listens on HTTPS port `443`.

## Build

```sh
make build
```

The Linux build is written to `build/goadmin`.

## Generate table models

This service uses [GoAdmin](https://github.com/GoAdminGroup/go-admin). Generate table models with:

```sh
make generate
```
