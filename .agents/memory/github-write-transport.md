---
name: GitHub write transport
description: Environment-specific blocker affecting production repository writes.
---

GitHub connector reads currently work, but write requests through both REST Git Data endpoints and the GraphQL commit mutation receive an upstream Replit Cloudflare block. The local HTTPS Git remote also has no usable credentials.

**Why:** Retrying raw blobs, base64 blobs, GraphQL, and shell Git produced the same release blocker without moving the remote branch. This is not evidence of an expired GitHub OAuth grant because authenticated reads continue to succeed.

**How to apply:** Before a future production publish, first confirm that connector writes have been repaired or that the local Git remote has valid credentials. Keep using an expected-head or non-forced update; do not weaken atomic release guarantees or request OAuth reauthorization solely for this Cloudflare response.