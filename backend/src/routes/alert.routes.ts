import { Router } from 'express';
import { AlertController } from '../controllers/alert.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
const alertController = new AlertController();

router.use(authenticate);

router.get('/', alertController.getAllAlerts);
router.post('/', alertController.createAlert);
router.get('/:alertId', alertController.getAlertById);
router.put('/:alertId', alertController.updateAlert);
router.delete('/:alertId', alertController.deleteAlert);

export default router;
