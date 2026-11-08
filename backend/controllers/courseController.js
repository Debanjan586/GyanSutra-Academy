import { Course } from '../models/Course.js';

/* GET /api/courses — public, published only */
export async function getPublishedCourses(_req, res, next) {
  try {
    const courses = await Course.find({ published: true })
      .sort({ displayOrder: 1, createdAt: -1 })
      .select('-__v');
    res.json({ courses });
  } catch (err) {
    next(err);
  }
}

/* GET /api/courses/:slug — public, one published course */
export async function getPublishedCourse(req, res, next) {
  try {
    const course = await Course.findOne({
      slug: req.params.slug,
      published: true,
    }).select('-__v');

    if (!course) return res.status(404).json({ error: 'Course not found.' });
    res.json({ course });
  } catch (err) {
    next(err);
  }
}