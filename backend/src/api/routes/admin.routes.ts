// FILE: src/api/routes/admin.routes.ts
import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticateAPIKey } from '../../middlewares/auth.middleware';

const router = Router();

// Protect all admin routes
// TODO: Add specific admin role check if needed
router.use(authenticateAPIKey);

// Get queue statistics
router.get('/queues/stats', AdminController.getQueueStats);

// Get jobs by status
router.get('/queues/jobs/:status', AdminController.getJobs);

// Retry job
router.post('/queues/jobs/:id/retry', AdminController.retryJob);

// Clean queue
router.delete('/queues/jobs/:status', AdminController.cleanQueue);

export default router;
