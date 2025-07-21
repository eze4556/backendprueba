"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_models_1 = __importDefault(require("../models/user.models"));
const handler_helper_1 = __importDefault(require("../../../helpers/handler.helper"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const codes_constanst_1 = require("../../../constants/codes.constanst");
class UserControllers {
    async registerUser(req, res) {
        try {
            // Destructure data
            const { primary_data, billing_data, auth_data } = req.body;
            const { email, password } = req; // Extract email and password from request
            // Validar que email y password existan
            if (!email || !password) {
                return handler_helper_1.default.response(res, codes_constanst_1.BAD_REQUEST, {
                    message: 'Bad request error',
                    data: { error: 'Email and password are required' },
                });
            }
            primary_data.email = email; // Set email in object primary_data
            auth_data.password = await bcrypt_1.default.hash(password, 10); // Hash and set the password in auth_data
            const user = new user_models_1.default({
                primary_data,
                billing_data,
                auth_data,
            });
            const data = await user.save(); // Save new user
            return handler_helper_1.default.response(res, codes_constanst_1.CREATED, {
                message: 'User created successfully',
                data: { _id: data._id },
            });
        }
        catch (e) {
            return handler_helper_1.default.response(res, codes_constanst_1.INTERNAL_ERROR, {
                message: 'Internal Error',
                data: { error: e.message },
            });
        }
    }
    async editUser(req, res) {
        const { email, name } = req.body;
        const user = await user_models_1.default.findOneAndUpdate({ email }, { name }, { new: true });
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        res.json({ message: 'User updated', user });
    }
    async deleteUser(req, res) {
        const { email } = req.body;
        const user = await user_models_1.default.findOneAndDelete({ email });
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        res.json({ message: 'User deleted' });
    }
    async getUser(req, res) {
        let email;
        if (typeof req.user === 'string') {
            email = req.user;
        }
        else if (req.user && typeof req.user === 'object' && 'email' in req.user) {
            email = req.user.email;
        }
        if (!email)
            return res.status(400).json({ message: 'Email not provided in token' });
        const user = await user_models_1.default.findOne({ email });
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        res.json({ user });
    }
}
exports.default = new UserControllers();
