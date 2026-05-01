#!/bin/bash

# Quick commit and push script with custom message
# Usage: bash scripts/commit-now.sh "Your commit message"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if commit message is provided
if [ -z "$1" ]; then
    echo -e "${RED}❌ Error: Commit message required${NC}"
    echo "Usage: bash scripts/commit-now.sh \"Your commit message\""
    exit 1
fi

COMMIT_MSG="$1"

echo -e "${YELLOW}🔄 Quick Commit and Push${NC}"
echo "=================================="
echo -e "Message: ${GREEN}$COMMIT_MSG${NC}"

# Add all changes
echo -e "${YELLOW}➕ Staging all changes...${NC}"
git add -A

# Check if there's anything to commit
if git diff-index --quiet --cached HEAD --; then
    echo -e "${YELLOW}✅ No changes to commit${NC}"
    exit 0
fi

# Show what's being committed
echo -e "${YELLOW}📦 Files to be committed:${NC}"
git diff --cached --name-status | head -20

# Commit changes
echo -e "${YELLOW}💾 Committing...${NC}"
git commit -m "$COMMIT_MSG"

# Get the current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

# Push to remote
echo -e "${YELLOW}🚀 Pushing to remote ($CURRENT_BRANCH)...${NC}"
git push origin "$CURRENT_BRANCH"

echo -e "${GREEN}✅ Successfully committed and pushed!${NC}"
echo "=================================="
