#!/bin/bash

# Auto-commit and push script for the AI Code Reviewer project
# This script commits all changes and pushes to the remote repository

set -e  # Exit on error

# Get the repository root
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔄 Auto-Commit and Push Script${NC}"
echo "=================================="

# Check if there are changes
if ! git diff-index --quiet HEAD --; then
    echo -e "${YELLOW}📝 Staged changes detected${NC}"
else
    # Check for unstaged changes
    if git diff-files --quiet && git diff-index --quiet --cached HEAD --; then
        echo -e "${YELLOW}✅ No changes to commit${NC}"
        exit 0
    fi
fi

# Add all changes
echo -e "${YELLOW}➕ Staging all changes...${NC}"
git add -A

# Check if there's anything to commit
if git diff-index --quiet --cached HEAD --; then
    echo -e "${YELLOW}✅ No changes to commit${NC}"
    exit 0
fi

# Get current timestamp for commit message
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Create a descriptive commit message
echo -e "${YELLOW}💬 Creating commit message...${NC}"

# Count the number of changed files
CHANGED_FILES=$(git diff --cached --name-only | wc -l)
ADDED_FILES=$(git diff --cached --name-status | grep '^A' | wc -l)
MODIFIED_FILES=$(git diff --cached --name-status | grep '^M' | wc -l)
DELETED_FILES=$(git diff --cached --name-status | grep '^D' | wc -l)

# Build commit message
COMMIT_MSG="chore: auto-commit changes [$TIMESTAMP]"

if [ $ADDED_FILES -gt 0 ] || [ $MODIFIED_FILES -gt 0 ] || [ $DELETED_FILES -gt 0 ]; then
    COMMIT_MSG="$COMMIT_MSG"$'\n\n'
    COMMIT_MSG="${COMMIT_MSG}Changes:"
    [ $ADDED_FILES -gt 0 ] && COMMIT_MSG="${COMMIT_MSG}"$'\n'"- Added: $ADDED_FILES file(s)"
    [ $MODIFIED_FILES -gt 0 ] && COMMIT_MSG="${COMMIT_MSG}"$'\n'"- Modified: $MODIFIED_FILES file(s)"
    [ $DELETED_FILES -gt 0 ] && COMMIT_MSG="${COMMIT_MSG}"$'\n'"- Deleted: $DELETED_FILES file(s)"
fi

# Show what's being committed
echo -e "${YELLOW}📦 Files to be committed:${NC}"
git diff --cached --name-status | head -20

if [ $(git diff --cached --name-status | wc -l) -gt 20 ]; then
    echo "... and more"
fi

# Commit changes
echo -e "${YELLOW}💾 Committing changes...${NC}"
git commit -m "$COMMIT_MSG"

# Get the current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

# Push to remote
echo -e "${YELLOW}🚀 Pushing to remote ($CURRENT_BRANCH)...${NC}"
git push origin "$CURRENT_BRANCH"

echo -e "${GREEN}✅ Successfully committed and pushed!${NC}"
echo "=================================="
echo -e "${GREEN}Commit: $(git rev-parse --short HEAD)${NC}"
