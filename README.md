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

## Commands

```sh
deno task fmt
deno task lint
deno task test
deno task migration:run
deno task migration:generate --name Initial
```
