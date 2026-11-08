import { Router } from 'express';
import { authLimiter } from '../middleware/rateLimiter.js';
import { login, logout, me } from '../controllers/authController.js';

export const authRouter = Router();

authRouter.post('/login',  authLimiter, login);
authRouter.post('/logout', logout);
authRouter.get('/me',      me);