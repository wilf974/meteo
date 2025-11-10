import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { body } from 'express-validator';

const router = Router();
const authController = new AuthController();

router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Email invalide'),
    body('password').isLength({ min: 8 }).withMessage('Mot de passe trop court (min 8 caractères)'),
    body('name').notEmpty().withMessage('Nom requis')
  ],
  authController.register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Email invalide'),
    body('password').notEmpty().withMessage('Mot de passe requis')
  ],
  authController.login
);

router.post('/refresh', authController.refreshToken);

export default router;
