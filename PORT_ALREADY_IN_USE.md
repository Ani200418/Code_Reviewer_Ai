# Port Already in Use - How to Fix

## The Error
```
Error: listen EADDRINUSE: address already in use :::5000
```

This means **port 5000 is already being used** by another process (likely a previous server instance that didn't shut down properly).

## Quick Fix

### Option 1: Kill the Process Using the Port (Recommended)

```bash
# Find which process is using port 5000
lsof -i :5000

# Kill it (use the PID from the output above)
kill -9 <PID>

# Or kill all Node processes
killall -9 node

# Verify port is free
lsof -i :5000
# Should show no results or show nothing for port 5000
```

### Option 2: Use a Different Port

If port 5000 is being used by something else you need, change the port:

```bash
# Edit server/.env
PORT=5001

# Then start server
npm run dev
```

Then update client `NEXT_PUBLIC_API_URL` to match:
```
NEXT_PUBLIC_API_URL=http://localhost:5001/api
```

### Option 3: Restart Your Terminal

Sometimes a terminal session can hold onto a port. Close the terminal completely and open a new one.

## Step-by-Step Guide

1. **Stop your current server** (if it's running):
   ```bash
   # In the server terminal, press Ctrl+C
   ```

2. **Kill any lingering processes**:
   ```bash
   killall -9 node
   ```

3. **Verify port is free**:
   ```bash
   lsof -i :5000
   ```
   Should return no results or empty.

4. **Start the server again**:
   ```bash
   cd /Users/aniketsingh/ai-code-reviewer-v2/server
   npm run dev
   ```

5. **Should see**:
   ```
   ✓ Server running on port 5000
   ✓ MongoDB connected
   ```

## Prevention

To avoid this in the future:

1. **Always properly stop servers** (Ctrl+C in terminal, not force kill)
2. **Don't use multiple terminals** in same directory (use tabs instead)
3. **Close VS Code properly** before restarting
4. **Check for zombie processes**:
   ```bash
   # See all Node processes
   ps aux | grep node
   
   # Kill any that shouldn't be there
   kill -9 <PID>
   ```

## If This Keeps Happening

Your system might have multiple Node processes from previous development sessions. Clean them all:

```bash
# Kill ALL Node processes (be careful!)
killall -9 node

# Find all node processes
ps aux | grep node

# Kill specific ones
kill -9 <PID1> <PID2> <PID3>

# Start fresh
npm run dev
```

## Common Causes

| Cause | Solution |
|-------|----------|
| Server didn't shut down properly | Kill process: `kill -9 <PID>` |
| Multiple terminals in same dir | Use tabs, not separate terminals |
| VS Code crashed | Restart VS Code |
| Nodemon didn't restart | Kill and restart server |
| Previous session left running | `killall -9 node` |

---

**After fixing:** Run `npm run dev` and you should be good to go! ✅
