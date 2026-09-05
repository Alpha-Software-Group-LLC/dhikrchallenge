#!/usr/bin/env bash
# Runs the baseline schema, the evolution migration and the privacy/behaviour
# assertions against a throwaway local PostgreSQL cluster.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
PGBIN="${PGBIN:-$(dirname "$(command -v initdb 2>/dev/null || echo /usr/lib/postgresql/16/bin/initdb)")}"
[ -x "$PGBIN/initdb" ] || PGBIN=/usr/lib/postgresql/16/bin
ROOTDIR="${PGDATA_DIR:-${TMPDIR:-/tmp}/dhikr-pgtest}"
DATA="$ROOTDIR/data"
# PostgreSQL refuses to run as root; re-exec as an unprivileged user when needed.
if [ "$(id -u)" = "0" ]; then
  for candidate in postgres nobody; do
    if id "$candidate" >/dev/null 2>&1; then
      rm -rf "$ROOTDIR"; mkdir -p "$ROOTDIR" && chown -R "$candidate" "$ROOTDIR"
      exec runuser -u "$candidate" -- env PGDATA_DIR="$ROOTDIR" PGBIN="$PGBIN" PGUSER="${PGUSER:-postgres}" bash "$0"
    fi
  done
  echo "No unprivileged user available to run PostgreSQL" >&2; exit 1
fi
SOCK="$ROOTDIR/sock"
PORT=54329
export PGHOST="$SOCK" PGPORT="$PORT" PGUSER="${PGUSER:-postgres}" PGDATABASE=postgres

cleanup() { "$PGBIN/pg_ctl" -D "$DATA" stop -m fast >/dev/null 2>&1 || true; }
trap cleanup EXIT

rm -rf "$DATA" "$SOCK"; mkdir -p "$DATA" "$SOCK"
"$PGBIN/initdb" -D "$DATA" -U "$PGUSER" --auth=trust >/dev/null
"$PGBIN/pg_ctl" -D "$DATA" -o "-p $PORT -k $SOCK -c listen_addresses=''" -w start >/dev/null
"$PGBIN/createdb" dhikr_test
export PGDATABASE=dhikr_test

run() { "$PGBIN/psql" -v ON_ERROR_STOP=1 -q -X -f "$1" >/dev/null; }
echo "→ bootstrap (auth schema, roles, extensions)"; run "$HERE/bootstrap.sql"
echo "→ baseline schema.sql";                         run "$ROOT/supabase/schema.sql"
echo "→ migration 0002_evolution.sql";               run "$ROOT/supabase/migrations/0002_evolution.sql"
echo "→ migration is idempotent (second run)";       run "$ROOT/supabase/migrations/0002_evolution.sql"
echo "→ assertions";                                 "$PGBIN/psql" -v ON_ERROR_STOP=1 -q -X -f "$HERE/assertions.sql"
echo "✓ database tests passed"
