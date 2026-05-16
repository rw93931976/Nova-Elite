#!/root/nova-env/bin/python3
"""Localhost-only LiveKit token issuer for Nova web client."""
from __future__ import annotations

import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse
from uuid import uuid4

from livekit import api

HOST = "127.0.0.1"
PORT = 8787
ENV_PATH = Path("/root/nova/.env.local")
IDENTITY = "ray"


def load_env(path: Path) -> dict[str, str]:
    env: dict[str, str] = {}
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        v = value.strip()
        if len(v) >= 2 and v[0] == v[-1] and v[0] in "\"'":
            v = v[1:-1]
        env[key.strip()] = v
    return env


def mint_token() -> tuple[str, str]:
    env = load_env(ENV_PATH)
    room_name = f"ray-nova-{uuid4().hex[:8]}"
    token = (
        api.AccessToken(env["LIVEKIT_API_KEY"], env["LIVEKIT_API_SECRET"])
        .with_identity(IDENTITY)
        .with_name(IDENTITY)
        .with_grants(
            api.VideoGrants(
                room_join=True,
                room=room_name,
                can_publish=True,
                can_subscribe=True,
                can_publish_data=True,
            )
        )
        .to_jwt()
    )
    return token, room_name


class TokenHandler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:
        if urlparse(self.path).path != "/api/token":
            self.send_error(404)
            return
        try:
            token, room = mint_token()
            body = json.dumps({"token": token, "room": room}).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Cache-Control", "no-store")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        except Exception:
            self.send_error(500)

    def log_message(self, format: str, *args) -> None:
        pass


if __name__ == "__main__":
    ThreadingHTTPServer((HOST, PORT), TokenHandler).serve_forever()
