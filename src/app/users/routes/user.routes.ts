import { Router, Request, Response, NextFunction } from 'express';
import UserControllers from '../controllers/user.controllers';
import Token from '../../../auth/token/token';
import * as UserMiddleware from '../middlewares/user.middlewares';
import PasswordMiddleware from '../middlewares/password.middlewares';
import CodeMiddleware from '../../codes/middlewares/code.middlewares';
import HistoryMiddleware from '../../history/middlewares/history.middlewares';

const router: Router = Router();

// Middleware to check if an email already exists in the system
async function checkEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ message: 'Email is required.' });
    return;
  }

  try {
    // Replace this with your actual database or service lookup.
    // For now, we simulate that no user exists.
    const userExists = await findUserByEmail(email);
    if (userExists) {
      res.status(409).json({ message: 'Email already in use.' });
      return;
    }
    next();
  } catch (error) {
    next(error);
  }
}

// A dummy function simulating a user lookup. Replace with your actual implementation.
async function findUserByEmail(email: string): Promise<boolean> {
  // Example: Query your database to find a user by email.
  // Return true if a user is found, otherwise false.
  return false;
}

// Middleware to check if a user account is active
async function checkActive(req: any, res: Response, next: NextFunction): Promise<void> {
  try {
    // The user ID is likely set by the Token.verifyToken middleware
    const userId = req.userId;
    
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized access.' });
      return;
    }
    
    // Replace with your actual database query
    const user = await findUserById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }
    
    if (!user.isActive) {
      res.status(403).json({ message: 'Account is inactive.' });
      return;
    }
    
    next();
  } catch (error) {
    next(error);
  }
}

// Helper function to find a user by ID
async function findUserById(userId: string): Promise<any> {
  // Example: Query your database to find a user by ID
  // Return the user object if found, otherwise null
  return { id: userId, isActive: true }; // Placeholder implementation
}

router.post(
  '/register_request',
  checkEmail, // Check user not exist
  CodeMiddleware.sendCode, // Send the request
  HistoryMiddleware.saveHistory('register request'), // Save history
  Token.generateToken // Generate token
);

router.post(
  '/register_user',
  Token.verifyToken, // Verify token and set email
  checkEmail, // Check user not exist
  CodeMiddleware.checkCode, // Validate there is not a previously code
  PasswordMiddleware.passwordComplexity, // Check password complexity
  HistoryMiddleware.saveHistory('register new user'), // Save history
  UserControllers.registerUser // Register new user
);

router.post(
  '/edit_user',
  Token.verifyToken, // Verify token and set id
  checkActive, // Check user is active
  HistoryMiddleware.saveHistory('edit user data'), // Save history
  UserControllers.editUser // Edit an existing user
);

router.post(
  '/get_data',
  Token.verifyToken, // Verify token
  checkActive, // Check user is active
  UserControllers.getUser // Get user data
);

// Removed duplicate route with incomplete implementation.
router.get('/profile', Token.verifyToken, (req: any, res: Response) => { res.send('Profile data'); });

export default router;