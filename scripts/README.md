# Git Auto-Commit Setup Guide

This directory contains scripts for automatic git commits and pushes in the AI Code Reviewer project.

## 📋 Available Scripts

### 1. **auto-commit-push.sh** (Main Auto-Commit Script)
Commits all current changes and pushes them to the remote repository with an automatic timestamp-based message.

**Usage:**
```bash
bash scripts/auto-commit-push.sh
```

**What it does:**
- Stages all changes (`git add -A`)
- Creates a descriptive commit message with timestamp
- Shows file statistics (added, modified, deleted)
- Commits changes
- Pushes to the current branch

**Example output:**
```
🔄 Auto-Commit and Push Script
==================================
📝 Staged changes detected
➕ Staging all changes...
💬 Creating commit message...
📦 Files to be committed:
M  client/app/page.tsx
M  server/server.js
💾 Committing changes...
🚀 Pushing to remote (main)...
✅ Successfully committed and pushed!
==================================
Commit: a1b2c3d4
```

---

### 2. **commit-now.sh** (Quick Commit with Custom Message)
Allows you to commit and push with a custom commit message of your choice.

**Usage:**
```bash
bash scripts/commit-now.sh "Your custom commit message"
```

**Example:**
```bash
bash scripts/commit-now.sh "feat: add dark mode support"
bash scripts/commit-now.sh "fix: resolve authentication bug"
bash scripts/commit-now.sh "docs: update API documentation"
```

---

### 3. **watch-and-commit.sh** (Auto-Watch and Auto-Commit)
Monitors your repository for file changes and automatically commits them every time a change is detected.

**Requirements:**
- `fswatch` (macOS) or `inotify-tools` (Linux)

**Install fswatch on macOS:**
```bash
brew install fswatch
```

**Usage:**
```bash
bash scripts/watch-and-commit.sh
```

**What it does:**
- Continuously watches for file changes
- Ignores common directories (node_modules, .git, .next, dist, build, .DS_Store)
- Automatically runs `auto-commit-push.sh` when changes are detected
- Waits for 2 seconds to batch multiple changes together

**To stop watching:**
Press `Ctrl+C`

---

### 4. **setup-git-hooks.sh** (Setup Git Hooks)
Sets up git hooks for additional automatic actions (optional but recommended).

**Usage:**
```bash
bash scripts/setup-git-hooks.sh
```

---

## 🚀 Quick Start

### Option 1: Manual Auto-Commit After Editing
Best for when you want full control over when commits happen.

```bash
# Make your changes in the code editor
# When ready to commit:
bash scripts/auto-commit-push.sh

# Or with a custom message:
bash scripts/commit-now.sh "Your message"
```

### Option 2: Automatic Watching (Continuous Monitoring)
Best for active development when you want every change automatically committed.

```bash
# Start the watcher in a terminal (keep it running)
bash scripts/watch-and-commit.sh

# Make changes in another terminal - they'll auto-commit!
```

---

## 📝 Commit Message Examples

The scripts use conventional commit format:

```
chore: auto-commit changes [2026-05-01 14:30:45]
- Added: 2 file(s)
- Modified: 5 file(s)
- Deleted: 1 file(s)
```

Or custom:
```
feat: add new dashboard component
fix: resolve memory leak in API service
docs: update setup instructions
style: format code with prettier
refactor: improve authentication logic
```

---

## 🔧 Configuration

### Modify ignored patterns in watch-and-commit.sh:
Edit the `fswatch` command to exclude additional directories:

```bash
fswatch -r \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='your_custom_dir' \
    .
```

### Change commit message format in auto-commit-push.sh:
Modify the `COMMIT_MSG` variable to customize the format.

---

## ✅ Best Practices

1. **Use auto-commit-push.sh for regular changes**
   ```bash
   bash scripts/auto-commit-push.sh
   ```

2. **Use commit-now.sh for significant commits**
   ```bash
   bash scripts/commit-now.sh "feat: implement new feature"
   ```

3. **Use watch-and-commit.sh during active development**
   - Keeps history granular with automatic checkpoints
   - Prevents accidental data loss

4. **Use meaningful commit messages**
   - Helps with code review and history tracking
   - Makes it easy to find specific changes later

---

## 🐛 Troubleshooting

### Scripts don't run?
Make sure they're executable:
```bash
chmod +x scripts/*.sh
```

### Permission denied?
```bash
chmod +x scripts/auto-commit-push.sh
chmod +x scripts/commit-now.sh
chmod +x scripts/watch-and-commit.sh
```

### Git push fails?
- Check your SSH/HTTPS credentials
- Verify you have push permissions
- Ensure your local branch is up to date:
  ```bash
  git pull origin main
  ```

### Watch script not detecting changes?
- Install fswatch: `brew install fswatch`
- Make sure you're running it from the project root

---

## 📊 Automation Timeline

Here's a recommended workflow:

```
┌─────────────────────────────────────┐
│ Start Development Session           │
│ bash scripts/watch-and-commit.sh    │
└─────────────────────────────────────┘
          ↓
┌─────────────────────────────────────┐
│ Edit Files in Code Editor           │
│ (Changes auto-commit every ~5s)     │
└─────────────────────────────────────┘
          ↓
┌─────────────────────────────────────┐
│ Major Milestone Reached?            │
│ bash scripts/commit-now.sh "msg"    │
│ (Custom meaningful message)         │
└─────────────────────────────────────┘
          ↓
┌─────────────────────────────────────┐
│ End of Session                      │
│ Press Ctrl+C to stop watcher        │
│ git log to review commits           │
└─────────────────────────────────────┘
```

---

## 📚 Additional Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Git Documentation](https://git-scm.com/doc)
- [fswatch on GitHub](https://github.com/emcrisostomo/fswatch)

---

## 💡 Tips

- **View commit history:** `git log --oneline`
- **See changes since last commit:** `git diff`
- **Undo last commit:** `git reset --soft HEAD~1`
- **Push specific branch:** `git push origin branch-name`

---

**Last Updated:** May 1, 2026
**Project:** AI Code Reviewer v2
