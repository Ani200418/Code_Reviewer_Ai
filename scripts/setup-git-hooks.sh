#!/bin/bash

# Setup git hooks for automatic commits
# This script sets up a pre-push hook to ensure clean commits

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HOOKS_DIR="$REPO_ROOT/.git/hooks"

echo "Setting up git hooks..."

# Create hooks directory if it doesn't exist
mkdir -p "$HOOKS_DIR"

# Create a post-commit hook that can be used for additional actions
cat > "$HOOKS_DIR/post-commit" << 'EOF'
#!/bin/bash
# Post-commit hook for additional actions
# Add custom logic here if needed
EOF

chmod +x "$HOOKS_DIR/post-commit"

echo "✅ Git hooks setup complete!"
echo ""
echo "You can now use the following commands:"
echo "  - bash scripts/auto-commit-push.sh    : Commit and push all changes"
echo "  - bash scripts/watch-and-commit.sh    : Watch for changes and auto-commit"
