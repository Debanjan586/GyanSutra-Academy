import { Router } from 'express';
import { getPublishedCourses, getPublishedCourse } from '../controllers/courseController.js';

export const publicCoursesRouter = Router();

publicCoursesRouter.get('/',      getPublishedCourses);
publicCoursesRouter.get('/:slug', getPublishedCourse);