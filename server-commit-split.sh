#!/usr/bin/env bash
# Run this INSIDE the studiospace-server folder:  bash ../server-commit-split.sh
# It rebuilds the git history as 10+ meaningful commits and force-pushes to GitHub.
set -e
export GIT_LITERAL_PATHSPECS=1

if [ ! -f package.json ] || [ ! -d src/routes ]; then
  echo "ERROR: run this inside the studiospace-server folder"; exit 1
fi

git checkout --orphan fresh-history -q
git rm -r --cached . -q 2>/dev/null || true

c() {  # c "message" path1 path2 ...
  msg="$1"; shift
  for p in "$@"; do [ -e "$p" ] && git add -- "$p"; done
  if ! git diff --cached --quiet; then git commit -q -m "$msg" && echo "committed: $msg"; fi
}

c "chore: init express typescript server" package.json package-lock.json tsconfig.json .gitignore .env.example
c "feat: add shared types and studio category constants" src/types.ts
c "feat: add mongodb connection helper and typed collections" src/db.ts
c "feat: add jwt httponly cookie auth middleware returning 401" src/middleware
c "feat: studios crud routes with search, filter, sort and owner checks" src/routes/studios.ts
c "feat: bookings with double-booking overlap detection" src/routes/bookings.ts
c "feat: wishlist toggle endpoint" src/routes/wishlist.ts
c "feat: express app setup with cors, cookies and error handling" src/index.ts
c "feat: add sample studio seed script" src/seed.ts
c "docs: add server readme with endpoints and setup" README.md

git add -A
if ! git diff --cached --quiet; then git commit -q -m "chore: final cleanup and remaining files" && echo "committed: final cleanup"; fi

git branch -D main -q 2>/dev/null || true
git branch -m main
echo "Total commits: $(git rev-list --count HEAD)"

if [ "${PUSH:-1}" = "1" ]; then
  git push -f origin main
  echo "DONE: pushed to GitHub"
else
  echo "(test mode: not pushed)"
fi
