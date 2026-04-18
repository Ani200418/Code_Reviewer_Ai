/**
 * Auth Controller
 * Handles local registration/login + Google OAuth (ID-token strategy)
 */

const jwt  = require('jsonwebtoken');
const User = require('../models/User');
const { signupSchema, loginSchema } = require('../utils/validators');

// Lazy-load google-auth-library so the server still boots without it
let OAuth2Client;
try {
  ({ OAuth2Client } = require('google-auth-library'));
} catch {
  console.warn('[auth] google-auth-library not installed – Google login disabled');
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const sendTokenResponse = (res, statusCode, user, message) => {
  const token = generateToken(user._id);
  res.status(statusCode).json({
    success: true,
    message,
    token,
    user: {
      id:           user._id,
      name:         user.name,
      email:        user.email,
      authProvider: user.authProvider,
      createdAt:    user.createdAt,
    },
  });
};

// ─── Local Auth ───────────────────────────────────────────────────────────────

/** POST /api/auth/signup */
const signup = async (req, res, next) => {
  try {
    const { error, value } = signupSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map((d) => d.message),
      });
    }

    const { name, email, password } = value;
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists' });
    }

    const user = await User.create({ name, email, password, authProvider: 'local' });
    sendTokenResponse(res, 201, user, 'Account created successfully');
  } catch (err) {
    next(err);
  }
};

/** POST /api/auth/login */
const login = async (req, res, next) => {
  try {
    const { error, value } = loginSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map((d) => d.message),
      });
    }

    const { email, password } = value;
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated. Please contact support.' });
    }
    if (user.authProvider === 'google' && !user.password) {
      return res.status(400).json({ success: false, message: 'This account uses Google Sign-In. Please continue with Google.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });
    sendTokenResponse(res, 200, user, 'Logged in successfully');
  } catch (err) {
    next(err);
  }
};

/** GET /api/auth/me */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
};

// ─── Google OAuth ─────────────────────────────────────────────────────────────

/**
 * POST /api/auth/google
 *
 * Accepts a Google ID token from the frontend GSI button, verifies it
 * server-side with google-auth-library, then finds or creates the user.
 *
 * KEY DESIGN: we use findOneAndUpdate with $set:{isActive:true} so that
 * any user whose account was deactivated (stale test data, partial earlier
 * run, manual DB edit) is automatically reactivated by a successful Google
 * sign-in. Google has already verified the user owns this identity.
 */
const googleAuth = async (req, res, next) => {
  try {
    if (!OAuth2Client) {
      return res.status(501).json({
        success: false,
        message: 'Google authentication is not configured on this server.',
      });
    }

    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ success: false, message: 'No Google credential provided' });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return res.status(500).json({ success: false, message: 'Google Client ID not configured on server' });
    }

    // ── Verify the ID token with Google ──────────────────────────────────────
    const client  = new OAuth2Client(clientId);
    const ticket  = await client.verifyIdToken({ idToken: credential, audience: clientId });
    const payload = ticket.getPayload();

    const { sub: googleId, email, name } = payload;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Could not retrieve email from Google account' });
    }

    // ── Find existing user by googleId OR email ───────────────────────────────
    const existingUser = await User.findOne({ $or: [{ googleId }, { email }] });

    let user;

    if (!existingUser) {
      // ── Brand-new user — create and always set isActive: true ───────────────
      user = await User.create({
        name:         name || email.split('@')[0],
        email,
        googleId,
        authProvider: 'google',
        isActive:     true,
      });
    } else {
      // ── Returning user — use findByIdAndUpdate to atomically:
      //   1. Link their Google ID if missing
      //   2. FORCE isActive to true (fixes any stale/deactivated state in the DB)
      //   3. Update lastLogin
      //
      // This is intentionally done at the database level (not just in-memory)
      // so it persists even if there is a crash after the update.
      user = await User.findByIdAndUpdate(
        existingUser._id,
        {
          $set: {
            googleId:  existingUser.googleId || googleId,
            isActive:  true,           // ← the fix: always reactivate on Google sign-in
            lastLogin: new Date(),
          },
        },
        { new: true, runValidators: false }
      );

      if (!user) {
        return res.status(500).json({ success: false, message: 'Failed to update user record' });
      }
    }

    // Set lastLogin for new users too
    if (!existingUser) {
      user.lastLogin = new Date();
      await user.save({ validateBeforeSave: false });
    }

    sendTokenResponse(res, 200, user, 'Google login successful');

  } catch (err) {
    const msg = err.message || '';

    // ── JWT / token validation failures → 401 ────────────────────────────────
    const isTokenError =
      msg.includes('Token used too late') ||
      msg.includes('Invalid token')       ||
      msg.includes('Token has been revoked') ||
      msg.includes('Wrong number of segments') ||
      msg.includes('No pem found')        ||
      msg.includes('audience')            ||
      msg.includes('expired')             ||
      msg.includes('invalid_grant')       ||
      msg.includes('Failed to verify')    ||
      msg.includes('Unable to verify');

    if (isTokenError) {
      return res.status(401).json({
        success: false,
        message: 'Google token is invalid or expired. Please try again.',
      });
    }

    // ── GaxiosError / network failures from google-auth-library → 503 ────────
    // CRITICAL: Never propagate err.status from a third-party API call.
    // google-auth-library sets err.status to Google's HTTP status code
    // (e.g. 403, 429, 500). Forwarding that would make YOUR endpoint look
    // like it returned those codes — which is both misleading and broken.
    if (err.status || err.response || err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      console.error('[googleAuth] External API error during token verification:', msg);
      return res.status(503).json({
        success: false,
        message: 'Could not reach Google authentication servers. Please try again.',
      });
    }

    next(err);
  }
};

module.exports = { signup, login, getMe, googleAuth };
