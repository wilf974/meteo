import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User.entity';
import { AppError } from '../middleware/errorHandler';

export class UserController {
  private userRepository = AppDataSource.getRepository(User);

  getProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = await this.userRepository.findOne({
        where: { id: req.user!.id }
      });

      if (!user) {
        throw new AppError('Utilisateur non trouvé', 404);
      }

      res.json({
        status: 'success',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            preferences: user.preferences,
            createdAt: user.createdAt
          }
        }
      });
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { name } = req.body;

      const user = await this.userRepository.findOne({
        where: { id: req.user!.id }
      });

      if (!user) {
        throw new AppError('Utilisateur non trouvé', 404);
      }

      if (name) user.name = name;

      await this.userRepository.save(user);

      res.json({
        status: 'success',
        data: { user }
      });
    } catch (error) {
      next(error);
    }
  };

  getPreferences = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = await this.userRepository.findOne({
        where: { id: req.user!.id }
      });

      if (!user) {
        throw new AppError('Utilisateur non trouvé', 404);
      }

      res.json({
        status: 'success',
        data: { preferences: user.preferences }
      });
    } catch (error) {
      next(error);
    }
  };

  updatePreferences = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const preferences = req.body;

      const user = await this.userRepository.findOne({
        where: { id: req.user!.id }
      });

      if (!user) {
        throw new AppError('Utilisateur non trouvé', 404);
      }

      user.preferences = { ...user.preferences, ...preferences };
      await this.userRepository.save(user);

      res.json({
        status: 'success',
        data: { preferences: user.preferences }
      });
    } catch (error) {
      next(error);
    }
  };
}
