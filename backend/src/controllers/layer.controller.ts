import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export class LayerController {
  getAllLayers = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const layers = [
        { id: 'temperature', name: 'Température', type: 'heatmap', available: true },
        { id: 'precipitation', name: 'Précipitations', type: 'overlay', available: true },
        { id: 'wind', name: 'Vent', type: 'vector', available: true },
        { id: 'pressure', name: 'Pression', type: 'contour', available: true },
        { id: 'clouds', name: 'Nuages', type: 'overlay', available: true },
        { id: 'humidity', name: 'Humidité', type: 'heatmap', available: true },
        { id: 'snow', name: 'Neige', type: 'overlay', available: true },
        { id: 'lightning', name: 'Foudre', type: 'point', available: true },
        { id: 'airquality', name: 'Qualité de l\'air', type: 'heatmap', available: true },
        { id: 'pollen', name: 'Pollen', type: 'heatmap', available: false },
        { id: 'waves', name: 'Vagues', type: 'overlay', available: false },
        { id: 'radar', name: 'Radar', type: 'overlay', available: true }
      ];

      res.json({
        status: 'success',
        data: { layers }
      });
    } catch (error) {
      next(error);
    }
  };

  getLayerById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { layerId } = req.params;

      res.json({
        status: 'success',
        data: {
          id: layerId,
          name: layerId.charAt(0).toUpperCase() + layerId.slice(1),
          metadata: {
            source: 'OpenWeatherMap',
            resolution: '1km',
            updateFrequency: '10min'
          }
        }
      });
    } catch (error) {
      next(error);
    }
  };

  getLayerData = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { layerId } = req.params;
      const { bbox, timestamp } = req.query;

      if (!bbox) {
        throw new AppError('BoundingBox requis', 400);
      }

      res.json({
        status: 'success',
        data: {
          layerId,
          bbox,
          timestamp: timestamp || new Date().toISOString(),
          tiles: []
        }
      });
    } catch (error) {
      next(error);
    }
  };
}
