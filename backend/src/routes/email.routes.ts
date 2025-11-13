import { Router } from 'express';
import { EmailController } from '../controllers/email.controller';

const router = Router();
const emailController = new EmailController();

// All routes are public (no authentication required)
router.get('/status', emailController.getStatus);
router.post('/test', emailController.testEmail);
router.post('/send', emailController.sendEmail);
router.post('/alert', emailController.sendAlert);

export default router;
