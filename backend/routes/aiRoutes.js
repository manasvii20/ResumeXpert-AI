import express from 'express';
import multer from 'multer';
import { analyzeResumeController, rewriteBulletController } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const aiRouter = express.Router();

// Configure multer for in-memory PDF uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
});

aiRouter.post('/analyze-resume', protect, upload.single('resumeFile'), analyzeResumeController);

aiRouter.post('/rewrite-bullet', protect, rewriteBulletController);

export default aiRouter;
