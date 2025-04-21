"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_models_1 = __importDefault(require("../models/user.models"));
const handler_helper_1 = __importDefault(require("../../../helpers/handler.helper"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const codes_constanst_1 = require("../../../constants/codes.constanst");
class UserController {
    /**
     * Register a single user
     * @param req
     * @param res
     * @returns
     */
    async registerUser(req, res) {
        try {
            // Destructure data
            const { primary_data, billing_data, auth_data } = req.body;
            const { email, password } = req; // Extract email and hashedPassword from request
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
    /**
     * Edit user
     * @param req
     * @param res
     * @returns
     */
    async editUser(req, res) {
        try {
            const { _id } = req; // Extract _id from token
            const { primary_data, billing_data } = req.body; // Extract all data from body
            await user_models_1.default.findById({ _id }).then(async (user) => {
                delete primary_data.email; // Delete email from body
                const new_primary_data = { ...user === null || user === void 0 ? void 0 : user.primary_data, ...primary_data }; // Merge new primary_data with old primary_data
                const new_billing_data = { ...user === null || user === void 0 ? void 0 : user.billing_data, ...billing_data }; // Merge new billing_data with old billing_data
                await user_models_1.default.findByIdAndUpdate({ _id }, { $set: { primary_data: new_primary_data, billing_data: new_billing_data } });
            });
            return handler_helper_1.default.response(res, codes_constanst_1.SUCCESS, { message: 'User edited successfully', data: { _id } });
        }
        catch (e) {
            return handler_helper_1.default.response(res, codes_constanst_1.INTERNAL_ERROR, {
                message: 'Internal Error',
                data: { error: e.message },
            });
        }
    }
    /**
     * Get user data
     * @param req
     * @param res
     * @returns
     */
    async getUser(req, res) {
        try {
            const { _id } = req;
            const user = await user_models_1.default.findById({ _id });
            if (!user) {
                return handler_helper_1.default.response(res, codes_constanst_1.FORBIDDEN, {
                    message: 'Forbidden',
                    data: { error: 'User not found' },
                });
            }
            return handler_helper_1.default.response(res, codes_constanst_1.SUCCESS, {
                message: 'Response successfully',
                data: { primary_data: user === null || user === void 0 ? void 0 : user.primary_data, billing_data: user === null || user === void 0 ? void 0 : user.billing_data },
            });
        }
        catch (e) {
            return handler_helper_1.default.response(res, codes_constanst_1.INTERNAL_ERROR, {
                message: 'Internal Error',
                data: { error: e.message },
            });
        }
    }
}
exports.default = new UserController();
