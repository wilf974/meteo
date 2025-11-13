import { Router } from 'express';
import authRoutes from './auth.routes';
import weatherRoutes from './weather.routes';
import layerRoutes from './layer.routes';
import alertRoutes from './alert.routes';
import userRoutes from './user.routes';
import emailRoutes from './email.routes';
import analyticsRoutes from './analytics.routes';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
  });
});

router.use('/auth', authRoutes);
router.use('/weather', weatherRoutes);
router.use('/layers', layerRoutes);
router.use('/alerts', alertRoutes);
router.use('/users', userRoutes);
router.use('/email', emailRoutes);
router.use('/analytics', analyticsRoutes);

export default router;
