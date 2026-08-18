---
'@rocket.chat/rest-typings': minor
'@rocket.chat/meteor': minor
---

Adds `POST /v1/rooms.getOrCreate`, an idempotent endpoint that resolves a room by type and name, creating the direct message when it does not exist yet.

Uses it to fix direct messages addressed by username, such as the ones opened with **Reply in direct message**, not being found on the first lookup — which made opening a conversation cost an extra request and log an avoidable `Invalid Room` error.
