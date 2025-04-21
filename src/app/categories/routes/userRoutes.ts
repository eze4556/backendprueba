import { Router, Request, Response } from 'express';
import User from '../../users/models/user.models';

const router = Router();

router.post('/users', async (req: Request, res: Response) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).send(user);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.get('/users', async (req: Request, res: Response) => {
  try {
    const status = req.query.status;
    const users = await User.find(status ? { status } : {});
    res.send(users);
  } catch (error) {
    res.status(500).send(error);
  }
});

export default router;