import { Router } from 'express';
import authRoutes from './auth.routes';
import weatherRoutes from './weather.routes';
import layerRoutes from './layer.routes';
import alertRoutes from './alert.routes';
import userRoutes from './user.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/weather', weatherRoutes);
router.use('/layers', layerRoutes);
router.use('/alerts', alertRoutes);
router.use('/users', userRoutes);

export default router;
