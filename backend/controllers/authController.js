import { Admin } from '../models/Admin.js';

/* POST /api/auth/login */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (!admin) {
      // Identical message for both "not found" and "wrong password" — prevents enumeration
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const ok = await admin.verifyPassword(password);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Regenerate session ID after privilege escalation
    req.session.regenerate((err) => {
      if (err) return next(err);
      req.session.adminId = String(admin._id);
      req.session.save((saveErr) => {
        if (saveErr) return next(saveErr);
        res.json({ message: 'Logged in successfully.' });
      });
    });
  } catch (err) {
    next(err);
  }
}

/* POST /api/auth/logout */
export function logout(req, res, next) {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie('gs.sid');
    res.json({ message: 'Logged out.' });
  });
}

/* GET /api/auth/me */
export async function me(req, res, next) {
  try {
    if (!req.session?.adminId) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }
    const admin = await Admin.findById(req.session.adminId);
    if (!admin) {
      return res.status(401).json({ error: 'Session invalid.' });
    }
    res.json({ admin });
  } catch (err) {
    next(err);
  }
}