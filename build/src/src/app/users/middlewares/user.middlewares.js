"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAdmin = exports.verifyToken = void 0;
exports.checkEmail = checkEmail;
exports.checkActive = checkActive;
exports.checkCredentials = checkCredentials;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const codes_constanst_1 = require("../../../constants/codes.constanst");
const handler_helper_1 = __importDefault(require("../../../helpers/handler.helper"));
const JWT_SECRET = process.env.JWT_SECRET || "test";
const verifyToken = (req, res, next) => {
    var _a;
    try {
        const token = (_a = req.header("Authorization")) === null || _a === void 0 ? void 0 : _a.replace("Bearer ", "");
        if (!token) {
            return handler_helper_1.default.response(res, codes_constanst_1.UNAUTHORIZED, {
                message: "Unauthorized",
                data: { error: "No token provided" },
            });
        }
        jsonwebtoken_1.default.verify(token, JWT_SECRET, (err, decoded) => {
            if (err) {
                return handler_helper_1.default.response(res, codes_constanst_1.FORBIDDEN, {
                    message: "Forbidden",
                    data: { error: "Invalid token" },
                });
            }
            req.user = decoded; // Assertion here
            next();
        });
    }
    catch (error) {
        return handler_helper_1.default.response(res, codes_constanst_1.UNAUTHORIZED, {
            message: "Unauthorized",
            data: { error: error.message },
        });
    }
};
exports.verifyToken = verifyToken;
const isAdmin = (req, res, next) => {
    try {
        if (!req.user) {
            return handler_helper_1.default.response(res, codes_constanst_1.UNAUTHORIZED, {
                message: "Unauthorized",
                data: { error: "User not authenticated" },
            });
        }
        if (typeof req.user === 'string' || !('role' in req.user)) {
            return handler_helper_1.default.response(res, codes_constanst_1.FORBIDDEN, {
                message: "Forbidden",
                data: { error: "User is not an admin" },
            });
        }
        if (req.user.role !== "admin") {
            return handler_helper_1.default.response(res, codes_constanst_1.FORBIDDEN, {
                message: "Forbidden",
                data: { error: "User is not an admin" },
            });
        }
        next();
    }
    catch (error) {
        return handler_helper_1.default.response(res, codes_constanst_1.FORBIDDEN, {
            message: "Forbidden",
            data: { error: error.message },
        });
    }
};
exports.isAdmin = isAdmin;
function checkEmail(req, res, next) {
    throw new Error('Function not implemented.');
}
function checkActive(req, res, next) {
    throw new Error('Function not implemented.');
}
function checkCredentials(arg0, checkActive, passwordComplexity, checkCredentials, arg4, generateToken) {
    throw new Error('Function not implemented.');
}
