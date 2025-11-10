import { Router, Request, Response } from 'express';
import tokenService from '../app/users/services/token.service';
import HttpHandler from '../helpers/handler.helper';
import { SUCCESS, UNAUTHORIZED, BAD_REQUEST, INTERNAL_ERROR } from '../constants/codes.constanst';

const router = Router();

/**
 * @route   POST /api/auth/refresh
 * @desc    Renovar access token usando refresh token
 * @access  Public
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return HttpHandler.error(res, {
        code: BAD_REQUEST,
        message: 'Refresh token es requerido'
      });
    }

    const result = await tokenService.refreshAccessToken(refreshToken);

    if (!result.success) {
      return HttpHandler.error(res, {
        code: UNAUTHORIZED,
        message: result.message
      });
    }

    return HttpHandler.success(res, {
      accessToken: result.accessToken,
      message: result.message
    });
  } catch (error) {
    return HttpHandler.error(res, {
      code: INTERNAL_ERROR,
      message: (error as Error).message
    });
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Invalidar refresh token (logout)
 * @access  Public
 */
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return HttpHandler.success(res, {
        message: 'Logout exitoso'
      });
    }

    const revoked = await tokenService.revokeRefreshToken(refreshToken);

    return HttpHandler.success(res, {
      message: revoked ? 'Logout exitoso' : 'Token ya estaba invalidado'
    });
  } catch (error) {
    return HttpHandler.error(res, {
      code: INTERNAL_ERROR,
      message: (error as Error).message
    });
  }
});

/**
 * @route   POST /api/auth/logout-all
 * @desc    Invalidar todos los refresh tokens de un usuario
 * @access  Private (requiere userId en body o token)
 */
router.post('/logout-all', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return HttpHandler.error(res, {
        code: BAD_REQUEST,
        message: 'userId es requerido'
      });
    }

    await tokenService.revokeAllUserTokens(userId);

    return HttpHandler.success(res, {
      message: 'Logout de todos los dispositivos exitoso'
    });
  } catch (error) {
    return HttpHandler.error(res, {
      code: INTERNAL_ERROR,
      message: (error as Error).message
    });
  }
});

export default router;
