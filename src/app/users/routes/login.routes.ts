import { Router, Request, Response, NextFunction } from 'express';
import { checkActive } from '../middlewares/user.middlewares';
import PasswordMiddleware from '../middlewares/password.middlewares';
import HistoryMiddleware from '../../history/middlewares/history.middlewares';
import Token from '../../../auth/token/token';

const router: Router = Router();

// This middleware should be in its own file, not defined inline here
async function checkCredentials(req: Request, res: Response, next: NextFunction): Promise<void> {
  // Your logic here
  // Example:
  const { username, password } = req.body;
  if (username === 'test' && password === 'password') {
    // Successful authentication
    next();
  } else {
    // Authentication failed
    res.status(401).json({ message: 'Invalid credentials' });
  }
}

router.post(
  '/',
  checkActive, // Check user is active
  PasswordMiddleware.passwordComplexity, // Check password complexity
  (req: Request, res: Response, next: NextFunction) => {
    checkCredentials(req, res, next);
  }, // Check credentials
  (req: Request, res: Response, next: NextFunction) => {
    HistoryMiddleware.saveHistory('start session')(req, res, next);
  }, // Save history
  Token.generateToken // Generate token
);

export default router;