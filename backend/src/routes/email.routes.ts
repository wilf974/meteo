import { Router } from 'express';
import { EmailController } from '../controllers/email.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
const emailController = new EmailController();

// Public route to check email service status
router.get('/status', emailController.getStatus);

// Protected routes - require authentication
router.use(authenticate);

router.post('/test', emailController.testEmail);
router.post('/send', emailController.sendEmail);
router.post('/alert', emailController.sendAlert);

export default router;
