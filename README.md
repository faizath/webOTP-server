# webOTP-server

Backend API scaffold for encrypted webOTP vault synchronization. The server does
not store plaintext OTP secrets.

## Local setup

```sh
docker compose up -d
cp .env.example .env
/home/user/.deno/bin/deno task dev
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

Set `JWT_SECRET`, `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL`, and `BCRYPT_ROUNDS` in
`.env` before running outside development. Passwords are bcrypt-hashed and
refresh tokens are stored only as SHA-256 hashes. Run the initial schema
migration with `deno task migration:run`.

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

## Commands

```sh
deno task fmt
deno task lint
deno task test
deno task migration:run
deno task migration:generate --name Initial
```
