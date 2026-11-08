import { validationResult } from 'express-validator';
import slugify from 'slugify';
import { Course } from '../models/Course.js';

/* ── helpers ─────────────────────────────────────────────────── */

function validationFail(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ error: errors.array()[0].msg });
    return true;
  }
  return false;
}

async function makeUniqueSlug(title, excludeId = null) {
  let base = slugify(title, { lower: true, strict: true });
  let slug = base;
  let i = 2;
  while (true) {
    const query = { slug };
    if (excludeId) query._id = { $ne: excludeId };
    const exists = await Course.exists(query);
    if (!exists) return slug;
    slug = `${base}-${i++}`;
  }
}

/* ── controllers ─────────────────────────────────────────────── */

/* GET /api/admin/courses — all courses (published + unpublished) */
export async function adminGetCourses(_req, res, next) {
  try {
    const courses = await Course.find()
      .sort({ displayOrder: 1, createdAt: -1 })
      .select('-__v');

    const total       = courses.length;
    const published   = courses.filter(c => c.published).length;
    const unpublished = total - published;

    res.json({ total, published, unpublished, courses });
  } catch (err) {
    next(err);
  }
}

/* POST /api/admin/courses — create */
export async function adminCreateCourse(req, res, next) {
  if (validationFail(req, res)) return;
  try {
    const {
      title, shortDescription, description,
      category, level, duration,
      regularPrice, offerPrice,
      image, published, displayOrder,
    } = req.body;

    const slug = await makeUniqueSlug(title);

    const course = await Course.create({
      title,
      slug,
      shortDescription: shortDescription || '',
      description:      description || '',
      category:         category || '',
      level:            level || '',
      duration:         duration || '',
      regularPrice:     parseFloat(regularPrice),
      offerPrice:       offerPrice != null && offerPrice !== '' ? parseFloat(offerPrice) : null,
      image:            image || '',
      published:        published === true || published === 'true',
      displayOrder:     displayOrder != null ? parseInt(displayOrder, 10) : 0,
    });

    res.status(201).json({ message: 'Course created.', course });
  } catch (err) {
    next(err);
  }
}

/* PATCH /api/admin/courses/:id — update */
export async function adminUpdateCourse(req, res, next) {
  if (validationFail(req, res)) return;
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ error: 'Course not found.' });

    const {
      title, shortDescription, description,
      category, level, duration,
      regularPrice, offerPrice,
      image, published, displayOrder,
    } = req.body;

    if (title !== undefined) {
      course.title = title;
      course.slug  = await makeUniqueSlug(title, course._id);
    }
    if (shortDescription !== undefined) course.shortDescription = shortDescription;
    if (description      !== undefined) course.description      = description;
    if (category         !== undefined) course.category         = category;
    if (level            !== undefined) course.level            = level;
    if (duration         !== undefined) course.duration         = duration;
    if (regularPrice     !== undefined) course.regularPrice     = parseFloat(regularPrice);
    if (offerPrice       !== undefined) {
      course.offerPrice = offerPrice !== '' && offerPrice !== null
        ? parseFloat(offerPrice)
        : null;
    }
    if (image        !== undefined) course.image        = image;
    if (published    !== undefined) course.published    = published === true || published === 'true';
    if (displayOrder !== undefined) course.displayOrder = parseInt(displayOrder, 10);

    await course.save();
    res.json({ message: 'Course updated.', course });
  } catch (err) {
    next(err);
  }
}

/* DELETE /api/admin/courses/:id */
export async function adminDeleteCourse(req, res, next) {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return res.status(404).json({ error: 'Course not found.' });
    res.json({ message: 'Course deleted.' });
  } catch (err) {
    next(err);
  }
}

/* GET /api/admin/courses/:id — single course */
export async function adminGetCourseById(req, res, next) {
  try {
    const course = await Course.findById(req.params.id).select('-__v');
    if (!course) return res.status(404).json({ error: 'Course not found.' });
    res.json(course);
  } catch (err) {
    next(err);
  }
}