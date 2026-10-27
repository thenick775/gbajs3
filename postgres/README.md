# PostgreSQL Service

The PostgreSQL service stores application accounts and admin configuration for the gbajs3 stack. See the [root README](../README.md).

## Image and lifecycle

This image is intended to run as part of the root compose or swarm deployment.

PostgreSQL runs the initialization scripts in `/docker-entrypoint-initdb.d` only when the data directory is empty. Changing `init_gbajs3_db.sql` or `init_admin_db.sql` doesn't migrate an existing database.

## Databases and schemas

The image initializes two databases, both owned by `PG_DB_USER`.

### `gbajs3`

`init_gbajs3_db.sql` creates the application database and enables the `uuid-ossp` extension. The auth service manages its own application tables.

### `goadmin`

`init_admin_db.sql` creates and seeds the GoAdmin `public` schema. Its tables manage the admin interface:

- `goadmin_users`, `goadmin_roles`, `goadmin_permissions`
- `goadmin_role_users`, `goadmin_role_menu`, `goadmin_role_permissions`, `goadmin_user_permissions`
- `goadmin_menu`, `goadmin_session`, `goadmin_site`, `goadmin_operation_log`

The initialization data includes a default `admin` user. Change its credentials or delete the user before exposing a deployment publicly. The admin service also reads `gbajs3.public.users` to manage application accounts.

## Configuration and persistence

The root `.env` supplies the database credentials and persistent data path:

```env
PG_DB_USER=<database user>
PG_DB_PASSWORD=<database user password>
GBAJS_DB_NAME=<application database name>
ADMIN_DB_NAME=<admin database name>
PG_DATA_LOCATION=<host path for persistent PostgreSQL data>
```

`PG_DATA_LOCATION` is bind-mounted at `/var/lib/postgresql/data` and contains all persistent database state.

## Run

Use the root stack so dependent services wait for the PostgreSQL health check:

```sh
../bin/bootstrap.sh
docker compose up --build
```

The database is intentionally not published to a host port. The auth and admin services reach it on the compose network as `gba-postgres`.
