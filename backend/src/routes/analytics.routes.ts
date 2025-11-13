import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller';

const router = Router();

// Record a connection
router.post('/track', analyticsController.recordConnection.bind(analyticsController));

// Get statistics
router.get('/today', analyticsController.getTodayStats.bind(analyticsController));
router.get('/yesterday', analyticsController.getYesterdayStats.bind(analyticsController));
router.get('/range', analyticsController.getRangeStats.bind(analyticsController));

// Send daily report
router.post('/report', analyticsController.sendDailyReport.bind(analyticsController));

export default router;
