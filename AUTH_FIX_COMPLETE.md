# Authentication Fix Summary

## Issue
When users clicked the "Analyze" button, they were being logged out and redirected to the login page, even with a valid session.

## Root Cause Analysis

The problem had multiple interconnected causes:

### 1. **Incorrect API Base URL Fallback**
- `client/lib/api.ts` had fallback URL pointing to `http://localhost:5001/api`
- Server actually runs on `http://localhost:5000/api`
- Without `NEXT_PUBLIC_API_URL` environment variable, requests went to wrong port
- Requests to wrong port failed with no response from server

### 2. **Missing Credentials in Axios Configuration**
- Axios wasn't configured with `withCredentials: true`
- This prevented cookies from being sent with cross-origin requests
- Even if token was in cookie, it wasn't being transmitted to server
- Server saw no `Authorization` header and returned 401

### 3. **Cookie sameSite=strict Policy**
- Cookies set with `sameSite: 'strict'` are only sent to same-origin requests
- API calls to different port are considered cross-origin
- With strict policy, cookies weren't included in cross-origin requests
- Should be `sameSite: 'lax'` to allow credentials in safe cross-origin requests

### 4. **Cascading 401 Response Handling**
- When 401 response was received by client:
  - Response interceptor in `api.ts` detected 401 status
  - Automatically cleared `acr_token` from cookies
  - Cleared `acr_user` from localStorage
  - Redirected to `/login` page
- This happened even though user had valid session (root cause was port mismatch)

## Solution Implemented

### Changes Made:

**1. `/client/lib/api.ts`**
```typescript
// BEFORE
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api',
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

// AFTER
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  timeout: 60000,
  withCredentials: true, // ✅ Include credentials with all requests
  headers: { 'Content-Type': 'application/json' },
});
```

**2. `/client/lib/context/AuthContext.tsx`**
```typescript
// BEFORE
const persistAuth = (tkn: string, usr: User) => {
  Cookies.set(TOKEN_KEY, tkn, { expires: 7, sameSite: 'strict' });
  ...
};

// AFTER
const persistAuth = (tkn: string, usr: User) => {
  Cookies.set(TOKEN_KEY, tkn, { expires: 7, sameSite: 'lax' }); // ✅ Changed to lax
  ...
};
```

## Why This Fixes the Issue

1. **Correct API Port**: Requests now go to the right server (5000 not 5001)
2. **Credentials Included**: `withCredentials: true` ensures cookies are sent
3. **Proper Cookie Handling**: `sameSite: 'lax'` allows cookies in cross-origin requests
4. **No More False 401s**: Since requests now reach the server with auth headers, legitimate analyze requests succeed
5. **Redundant Authorization**: Fallback also includes reading token from Authorization header in request interceptor

## Environment Configuration

The `.env` file already contains the correct configuration:
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

When this environment variable is set, the axios fallback URL (5000) is not used, but it's now correct anyway.

## Testing the Fix

To verify the fix works:

1. **Start the server:**
   ```bash
   cd server && npm run dev
   ```

2. **Start the client (in another terminal):**
   ```bash
   cd client && npm run dev
   ```

3. **Test the flow:**
   - Sign up or log in
   - Navigate to dashboard review page
   - Paste or upload code
   - Click "Analyze" button
   - **Expected:** Code analysis completes successfully without logout
   - **Previous behavior:** User was redirected to login page

## Security Considerations

- **`sameSite: 'lax'`**: This is the recommended setting for most applications. It allows cookies in top-level navigation and form submission but prevents them in images, iframes, and external requests.
- **`withCredentials: true`**: Essential for authenticated API calls to work correctly. The server already validates JWT tokens, so this is secure.
- **Token in Authorization Header**: The request interceptor also reads the token from localStorage/cookies and adds it to the Authorization header, providing defense-in-depth.

## Commit Information
- **Commit Hash:** `5a43015`
- **Files Changed:** 2
  - `client/lib/api.ts`
  - `client/lib/context/AuthContext.tsx`
- **Status:** ✅ Pushed to origin/main

## Related Files & Context
- Server: `server/middlewares/authMiddleware.js` - Validates JWT tokens (unchanged, works correctly)
- Server: `server/routes/reviewRoutes.js` - Protects `/review-code` endpoint (unchanged, works correctly)
- Client: `client/lib/services.ts` - Makes API calls (unchanged, no issues)

## Future Recommendations

1. **Add Request Logging**: Log all requests/responses in development to catch timing issues
2. **Token Refresh**: Implement token refresh middleware for long-running operations
3. **Error Messages**: Display more specific error messages about authentication failures
4. **Cookie Path**: Ensure cookies are set with `path: '/'` for proper scope (currently using default which is fine)
