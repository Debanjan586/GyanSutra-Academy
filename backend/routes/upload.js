import { Router }        from 'express';
import multer            from 'multer';
import { requireAuth }   from '../middleware/auth.js';
import { uploadToCloud } from '../config/upload.js';

export const uploadRouter = Router();

const storage = multer.memoryStorage();
const upload  = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    if (file.mimetype.startsWith('image/')) return cb(null, true);
    cb(new Error('Only image files are allowed'));
  },
});

uploadRouter.post('/', requireAuth, upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image file provided' });
    const url = await uploadToCloud(req.file.buffer, req.file.originalname);
    res.json({ url });
  } catch (err) {
    next(err);
  }
});