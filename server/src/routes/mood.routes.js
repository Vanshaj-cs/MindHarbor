import { Router } from 'express';
import { protect } from '../middleware/verifyToken.js';
import upload from '../middleware/multer.middleware.js';
import { saveMood, getMoodHistory, getRecentMood, analyzeMood } from '../controllers/mood.controller.js';
import { errorHandler } from '../middleware/error.middleware.js';

const router = Router();

// Protect all mood routes with authentication
router.use(protect);

// Mood tracking routes
router.post('/', saveMood);
router.get('/', getMoodHistory);
router.get('/recent', getRecentMood);
router.post('/analyze', upload.single('image'), analyzeMood);

router.use(errorHandler)
export default router;
