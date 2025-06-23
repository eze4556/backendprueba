import { Request, Response } from 'express';
import UserModel from '../models/user.models';

class UserControllers {
  async registerUser(req: Request, res: Response) {
    const { email, password, name } = req.body;
    // Aquí deberías hashear la contraseña y validar los datos
    const user = new UserModel({ email, password, name });
    await user.save();
    res.status(201).json({ message: 'User registered', user });
  }

  async editUser(req: Request, res: Response) {
    const { email, name } = req.body;
    const user = await UserModel.findOneAndUpdate({ email }, { name }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User updated', user });
  }

  async deleteUser(req: Request, res: Response) {
    const { email } = req.body;
    const user = await UserModel.findOneAndDelete({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  }

  async getUser(req: Request, res: Response) {
    let email: string | undefined;
    if (typeof req.user === 'string') {
      email = req.user;
    } else if (req.user && typeof req.user === 'object' && 'email' in req.user) {
      email = (req.user as { email?: string }).email;
    }
    if (!email) return res.status(400).json({ message: 'Email not provided in token' });
    const user = await UserModel.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  }
}

export default new UserControllers();