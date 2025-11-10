import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppDataSource } from '../config/database';
import { Alert } from '../entities/Alert.entity';
import { AppError } from '../middleware/errorHandler';

export class AlertController {
  private alertRepository = AppDataSource.getRepository(Alert);

  getAllAlerts = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const alerts = await this.alertRepository.find({
        where: { userId: req.user!.id },
        order: { createdAt: 'DESC' }
      });

      res.json({
        status: 'success',
        data: { alerts }
      });
    } catch (error) {
      next(error);
    }
  };

  createAlert = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { name, description, conditions, zone, notificationChannels } = req.body;

      if (!name || !conditions) {
        throw new AppError('Nom et conditions requis', 400);
      }

      const alert = this.alertRepository.create({
        name,
        description,
        conditions,
        zone,
        notificationChannels,
        userId: req.user!.id
      });

      await this.alertRepository.save(alert);

      res.status(201).json({
        status: 'success',
        data: { alert }
      });
    } catch (error) {
      next(error);
    }
  };

  getAlertById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { alertId } = req.params;

      const alert = await this.alertRepository.findOne({
        where: { id: alertId, userId: req.user!.id }
      });

      if (!alert) {
        throw new AppError('Alerte non trouvée', 404);
      }

      res.json({
        status: 'success',
        data: { alert }
      });
    } catch (error) {
      next(error);
    }
  };

  updateAlert = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { alertId } = req.params;
      const updates = req.body;

      const alert = await this.alertRepository.findOne({
        where: { id: alertId, userId: req.user!.id }
      });

      if (!alert) {
        throw new AppError('Alerte non trouvée', 404);
      }

      Object.assign(alert, updates);
      await this.alertRepository.save(alert);

      res.json({
        status: 'success',
        data: { alert }
      });
    } catch (error) {
      next(error);
    }
  };

  deleteAlert = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { alertId } = req.params;

      const result = await this.alertRepository.delete({
        id: alertId,
        userId: req.user!.id
      });

      if (result.affected === 0) {
        throw new AppError('Alerte non trouvée', 404);
      }

      res.json({
        status: 'success',
        message: 'Alerte supprimée'
      });
    } catch (error) {
      next(error);
    }
  };
}
