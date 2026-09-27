# webOTP-server

Backend API scaffold for encrypted webOTP vault synchronization. The server does
not store plaintext OTP secrets.

See [ARCHITECTURE.md](ARCHITECTURE.md) for the zero-knowledge design and module
overview. OpenAPI documentation is available at `http://localhost:3000/api/docs`
in development and test environments (or when `SWAGGER_ENABLED=true`).

![CI](https://github.com/OWNER/REPOSITORY/actions/workflows/ci.yml/badge.svg)

## Local setup and development workflow

```sh
cp .env.example .env
deno task db:up
# Create the application database once (the MSSQL image starts with master only).
docker compose exec -T mssql /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa \
  -P "${MSSQL_SA_PASSWORD:-YourStrong!Passw0rd}" -C \
  -Q "IF DB_ID('webotp') IS NULL CREATE DATABASE webotp"
deno task migration:run
deno task dev
```

Use `deno task ci` before opening a pull request. It runs formatting checks,
linting, and the unit test suite without requiring a database. The integration
test is opt-in and requires a live MSSQL instance:

```sh
RUN_INTEGRATION_TESTS=true deno test --allow-all test/integration_test.ts
```

The API listens on `PORT` (default `3000`). Health endpoints are available at
`GET /health` and `GET /api/v1/health`. If `DB_HOST` is empty or the database
cannot be reached, the response reports `database: "down"` while the API
continues serving requests.

## Authentication

Authentication endpoints are available under `/api/v1/auth`:

| Method | Endpoint    | Purpose                                           |
| ------ | ----------- | ------------------------------------------------- |
| POST   | `/register` | Create an account and issue access/refresh tokens |
| POST   | `/login`    | Authenticate with email and password              |
| POST   | `/refresh`  | Rotate an opaque refresh token                    |
| POST   | `/logout`   | Revoke a refresh token (returns `204`)            |

Login and registration may include `deviceName`. Authenticated device management
is available at `GET /api/v1/devices` and `DELETE /api/v1/devices/:id`.
`GET /api/v1/me` returns the profile and preferences, while
`PATCH /api/v1/me/preferences` updates lock and theme preferences and
`DELETE /api/v1/me` permanently removes the account.

Set `JWT_SECRET`, `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL`, and `BCRYPT_ROUNDS` in
`.env` before running outside development. Passwords are bcrypt-hashed and
refresh tokens are stored only as SHA-256 hashes. Run the initial schema
migration with `deno task migration:run`. Security-relevant events are persisted
in `audit_logs`; audit metadata is redacted for passwords, tokens, secrets,
ciphertext, and authorization values.

## API reference

| Area    | Endpoints                                                                               |
| ------- | --------------------------------------------------------------------------------------- |
| Health  | `GET /health`, `GET /api/v1/health`                                                     |
| Auth    | `POST /api/v1/auth/register`, `/login`, `/refresh`, `/logout`                           |
| User    | `GET /api/v1/me`, `PATCH /api/v1/me/preferences`, `DELETE /api/v1/me`                   |
| Devices | `GET /api/v1/devices`, `DELETE /api/v1/devices/:id`                                     |
| Vault   | `GET/PUT /api/v1/vault`, `/history`, `/history/:revision`, `/history/:revision/restore` |
| OpenAPI | `GET /api/docs` (when enabled)                                                          |

Security defaults include Helmet headers, CORS from `CORS_ORIGINS`, global
request throttling, sanitized production errors, and redacted request logs.

## Vault sync

Vault synchronization is available under `/api/v1/vault` and requires the access
JWT in an `Authorization: Bearer <token>` header. The server stores the client's
opaque `VaultEnvelope` (`version: 2`, `salt`, and encrypted `ciphertext`)
without decrypting or inspecting OTP secrets.

`GET /vault` returns the current envelope and revision, or `404` before the
first upload. `PUT /vault` creates the first snapshot without `If-Match` (or
with `If-Match: 0`). Updates require `If-Match: <revision>` and return `409`
with the current revision when the snapshot has changed. Each upload returns the
new revision, update timestamp, and server-computed SHA-256 ciphertext hash.

Previous snapshots are retained as encrypted, zero-knowledge history:

- `GET /vault/history` returns revision metadata only (never ciphertext).
- `GET /vault/history/:revision` returns the encrypted envelope for that
  revision.
- `POST /vault/history/:revision/restore` makes a historical envelope current,
  creates a new revision, and archives the current snapshot first.

History is limited to the latest 20 archived revisions per user. These endpoints
require the same access JWT as the current-vault endpoints.

## Commands

```sh
deno task db:up
deno task fmt
deno task lint
deno task test
deno task ci
deno task migration:run
deno task migration:show
deno task migration:generate --name Initial
```

`migration:run` initializes the configured database and applies migrations
001-004. `migration:show` connects to the database and reports whether any
configured migrations are pending. The database must be reachable and the
`DB_NAME` database must already exist.

## Environment variables

| Variable            | Default                | Description                                     |
| ------------------- | ---------------------- | ----------------------------------------------- |
| `NODE_ENV`          | `development`          | Runtime environment                             |
| `CORS_ORIGINS`      | `*`                    | Comma-separated allowed browser origins         |
| `SWAGGER_ENABLED`   | `false`                | Enable Swagger in production                    |
| `PORT`              | `3000`                 | HTTP listening port                             |
| `DB_HOST`           | unset                  | MSSQL host; unset disables database connections |
| `DB_PORT`           | `1433`                 | MSSQL port                                      |
| `DB_USER`           | `sa`                   | MSSQL username                                  |
| `DB_PASSWORD`       | `YourStrong!Passw0rd`  | MSSQL password                                  |
| `DB_NAME`           | `webotp`               | Application database                            |
| `MSSQL_SA_PASSWORD` | `YourStrong!Passw0rd`  | Docker MSSQL SA password                        |
| `JWT_SECRET`        | development-only value | JWT signing secret                              |
| `JWT_ACCESS_TTL`    | `15m`                  | Access token lifetime                           |
| `JWT_REFRESH_TTL`   | `30d`                  | Refresh token lifetime                          |
| `BCRYPT_ROUNDS`     | `12`                   | Password hashing cost, from 10 to 15            |
