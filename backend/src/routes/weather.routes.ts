import { Router } from 'express';
import { WeatherController } from '../controllers/weather.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
const weatherController = new WeatherController();

router.use(authenticate);

router.get('/current', weatherController.getCurrentWeather);
router.get('/forecast', weatherController.getForecast);
router.get('/radar/:layer', weatherController.getRadarLayer);
router.get('/satellite', weatherController.getSatelliteImagery);
router.post('/custom-model', weatherController.uploadCustomModel);

export default router;
