import { Router } from 'express';
import { protect } from '../middleware/verifyToken.js';
import upload from '../middleware/multer.middleware.js';
import { saveMood, getMoodHistory, getRecentMood, analyzeMood } from '../controllers/mood.controller.js';

const router = Router();

// Protect all mood routes with authentication
// router.use(protect);

router.use((req, _res, next) => {
    req.user = {
        id: '69a3f39595dfb484c40d5ca1'
        
     }; // Mock user for testing
    next();
});

// Mood tracking routes
router.post('/', saveMood);
router.get('/', getMoodHistory);
router.get('/recent', getRecentMood);
router.post('/analyze', upload.single('image'), analyzeMood);

export default router;
