import { Router } from 'express';
import { LayerController } from '../controllers/layer.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
const layerController = new LayerController();

router.use(authenticate);

router.get('/', layerController.getAllLayers);
router.get('/:layerId', layerController.getLayerById);
router.get('/:layerId/data', layerController.getLayerData);

export default router;
