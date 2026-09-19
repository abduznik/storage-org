# Storage Organizer

Track what's inside every box, bin, and closet. Each container gets a short
numeric ID and a QR code you can print (Niimbot label or paper) and stick on
the physical container. Scanning it opens that container's page so you can
see and edit its contents from your phone.

**[Try the client-side UI demo](https://abduznik.github.io/storage-org/)** —
no install needed. It's a static, no-backend mockup (data lives only in your
browser via localStorage) so you can click through the dashboard, nested
containers, search, and QR/label preview before self-hosting the real app.

## Features

- Multi-user accounts (sign up, sign in, "remember me", sign out)
- Each container is owned by a user and can be shared with other users by username
- Containers can be nested (a box inside a closet, etc.), with a searchable picker to
  move a container to a new parent or import an existing container as a child
- Items have a name, optional description, and optional quantity
- Fuzzy name search and exact ID lookup across everything you own or have been shared
- QR code and a combined "printable label" (QR + ID number) per container
- Optional photo per container
- Sharing uses a type-ahead over registered usernames, not blind typing

## Local development

```bash
npm install
npm run dev
```

The app stores its SQLite database and uploaded photos under `./data` by
default (override with the `DATA_DIR` env var).

## Running as a container

```bash
docker compose up -d --build
```

This builds the image (Dockerfile handles the native `better-sqlite3`/`sharp`
dependencies) and persists `/data` in a named volume, so the database and
photos survive rebuilds.

## Reverse proxy / Tailscale / Caddy

QR codes and printable labels are generated using the **host the request
actually arrived on** (via the standard `Host` header, or `X-Forwarded-Host`
/ `X-Forwarded-Proto` when behind a reverse proxy) — never a hardcoded local
address. This means:

- Whatever domain/Tailscale hostname you browse the app from is what gets
  baked into the QR code, automatically.
- If you're behind Caddy, Nginx, Traefik, etc., make sure it forwards
  `X-Forwarded-Host` and `X-Forwarded-Proto` to the app. A minimal Caddyfile:

  ```
  storage.example.com {
      reverse_proxy localhost:3000
  }
  ```

  Caddy sets these headers automatically. For Nginx, add:

  ```
  proxy_set_header Host $host;
  proxy_set_header X-Forwarded-Proto $scheme;
  proxy_set_header X-Forwarded-Host $host;
  ```

- If you access the app from multiple hostnames (e.g. both a Tailscale
  hostname and a public domain), the QR you print will reflect whichever
  hostname you were using in the browser tab when you clicked "print label" —
  make sure to generate/print the label from the hostname you intend to keep
  scanning it from long-term.

## Data model notes

- A container's public ID is a random 5-digit number, printed under its QR code.
- Containers can be nested via `parent_container_id`; moving (or "importing" an
  existing container as a child) brings all of its items and nested containers
  with it. Moving a container into itself or into one of its own descendants
  is blocked.
- Sharing is per-container (not inherited from parent to child automatically) —
  share each container you want a collaborator to see.
