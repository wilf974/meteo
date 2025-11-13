import { Request, Response, NextFunction } from 'express';
import { WeatherService } from '../services/weather.service';
import { AppError } from '../middleware/errorHandler';

export class WeatherController {
  private weatherService = new WeatherService();

  getCurrentWeather = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { lat, lon } = req.query;

      if (!lat || !lon) {
        throw new AppError('Latitude et longitude requises', 400);
      }

      const data = await this.weatherService.getCurrentWeather(
        parseFloat(lat as string),
        parseFloat(lon as string)
      );

      res.json({
        status: 'success',
        data
      });
    } catch (error) {
      next(error);
    }
  };

  getForecast = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { lat, lon, days = 7 } = req.query;

      if (!lat || !lon) {
        throw new AppError('Latitude et longitude requises', 400);
      }

      const data = await this.weatherService.getForecast(
        parseFloat(lat as string),
        parseFloat(lon as string),
        parseInt(days as string)
      );

      res.json({
        status: 'success',
        data
      });
    } catch (error) {
      next(error);
    }
  };

  getRadarLayer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { layer } = req.params;
      const { bbox } = req.query;

      if (!bbox) {
        throw new AppError('BoundingBox (bbox) requis', 400);
      }

      const data = await this.weatherService.getRadarLayer(
        layer,
        bbox as string
      );

      res.json({
        status: 'success',
        data
      });
    } catch (error) {
      next(error);
    }
  };

  getSatelliteImagery = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { bbox, timestamp } = req.query;

      const data = await this.weatherService.getSatelliteImagery(
        bbox as string,
        timestamp as string
      );

      res.json({
        status: 'success',
        data
      });
    } catch (error) {
      next(error);
    }
  };

  uploadCustomModel = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { modelData, metadata } = req.body;

      if (!modelData || !metadata) {
        throw new AppError('Données du modèle et métadonnées requis', 400);
      }

      const result = await this.weatherService.processCustomModel(
        req.user!.id,
        modelData,
        metadata
      );

      res.json({
        status: 'success',
        data: result
      });
    } catch (error) {
      next(error);
    }
  };
}
