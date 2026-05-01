#!/bin/bash

# Watch for file changes and auto-commit
# This script monitors the repository for changes and commits them automatically
# Requires: fswatch (install via: brew install fswatch)

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# Color codes
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

# Check if fswatch is installed
if ! command -v fswatch &> /dev/null; then
    echo -e "${YELLOW}⚠️  fswatch is not installed${NC}"
    echo "To use this script, install fswatch:"
    echo "  brew install fswatch"
    exit 1
fi

echo -e "${GREEN}👀 Watching for changes...${NC}"
echo "This script will automatically commit changes to your repository"
echo "Press Ctrl+C to stop watching"
echo ""

# Watch for changes in all files except node_modules and .git
fswatch -r \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='.next' \
    --exclude='dist' \
    --exclude='build' \
    --exclude='.DS_Store' \
    . | while read -r FILE; do
    
    echo -e "${YELLOW}📝 Change detected: $FILE${NC}"
    
    # Wait a bit for all changes to complete
    sleep 2
    
    # Check if there are actual changes
    if [ -n "$(git status --porcelain)" ]; then
        bash "$REPO_ROOT/scripts/auto-commit-push.sh"
        echo ""
        echo -e "${GREEN}Waiting for more changes...${NC}"
        echo ""
    fi
done
