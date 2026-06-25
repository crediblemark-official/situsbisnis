#!/bin/bash
PROJECT_ID="1"
OWNER="crediblemark-official"
PROJECT_NODE_ID="PVT_kwDOEF-IoM4BbnSD"
FIELD_ID="PVTSSF_lADOEF-IoM4BbnSDzhWWmrM"
OPTION_ID="98236657" # Done

add_item() {
  local title="$1"
  echo "Creating item '$title'"
  local id=$(gh project item-create $PROJECT_ID --owner $OWNER --title "$title" --format json | jq -r '.id')
  echo "Created item $id. Updating status..."
  gh project item-edit --id "$id" --field-id "$FIELD_ID" --project-id "$PROJECT_NODE_ID" --single-select-option-id "$OPTION_ID"
}

add_item "fix: replace isomorphic-dompurify with xss to avoid JSDOM bundling issue"
add_item "fix(ci): declare STAGING_URL at job level for smoke tests"
add_item "chore(ci): remove custom codeql workflow in favor of github default setup"
add_item "fix: resolve Next.js build crash and clear 5 depcruise architecture violations"
add_item "fix(security): address remaining CodeQL security and code scanning alerts"
