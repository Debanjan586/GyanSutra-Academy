import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { courseRules, coursePatchRules } from '../validators/courseValidator.js';
import {
  adminGetCourses,
  adminGetCourseById,   // ← add this
  adminCreateCourse,
  adminUpdateCourse,
  adminDeleteCourse,
} from '../controllers/adminController.js';

export const adminRouter = Router();

adminRouter.use(requireAuth);

adminRouter.get('/courses',        adminGetCourses);
adminRouter.get('/courses/:id',    adminGetCourseById);   // ← add this
adminRouter.post('/courses',       courseRules, adminCreateCourse);
adminRouter.patch('/courses/:id',  coursePatchRules, adminUpdateCourse);
adminRouter.delete('/courses/:id', adminDeleteCourse);