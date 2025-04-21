"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const s3_1 = __importDefault(require("aws-sdk/clients/s3"));
const handler_helper_1 = __importDefault(require("../../../helpers/handler.helper"));
const codes_constanst_1 = require("../../../constants/codes.constanst");
const environments_1 = require("../../../environments/environments");
const image_tools_1 = __importDefault(require("../../../tools/image.tools"));
const { AWS_URL, AWS_ID, AWS_SECRET_KEY, AWS_BUCKET } = (0, environments_1.environment)();
const s3 = new s3_1.default({
    accessKeyId: AWS_ID,
    secretAccessKey: AWS_SECRET_KEY,
});
class MediaController {
    /**
     * Upload profile picture and thumbnail
     * @param req
     * @param res
     * @returns
     */
    async uploadProfilePicture(req, res) {
        try {
            const { _id } = req; // Get _id
            const data = req.file; // Get picture
            const file = {
                buffer: data.buffer,
                name: `${Date.now()}.jpg`,
            };
            const thumbnail = await image_tools_1.default.resize(file.buffer); // Resize picture and set thumbnail
            const params = {
                profile: {
                    Bucket: AWS_BUCKET,
                    Key: `profiles/${_id}/profile/${file.name}`,
                    Body: file.buffer,
                    ContentType: 'image/jpeg',
                    ACL: 'public-read',
                },
                thumbnail: {
                    Bucket: AWS_BUCKET,
                    Key: `profiles/${_id}/thumbnail/${file.name}`,
                    Body: thumbnail,
                    ContentType: 'image/jpeg',
                    ACL: 'public-read',
                },
            };
            const details = { profile: await s3.upload(params.profile).promise(), thumbnail: await s3.upload(params.thumbnail).promise() };
            return handler_helper_1.default.response(res, codes_constanst_1.SUCCESS, { message: 'Profile picture uploaded', data: { details } });
        }
        catch (e) {
            return handler_helper_1.default.response(res, codes_constanst_1.INTERNAL_ERROR, {
                message: 'Internal Error',
                data: { error: e.message },
            });
        }
    }
    /**
     * Upload trailer
     * @param req
     * @param res
     * @returns
     */
    async uploadProfileTrailer(req, res) {
        try {
            const { _id } = req; // Get _id
            const data = req.file; // Get picture
            const file = {
                buffer: data.buffer,
                name: `${Date.now()}.mp4`,
            };
            const params = {
                trailer: {
                    Bucket: AWS_BUCKET,
                    Key: `profiles/${_id}/trailer/${file.name}`,
                    Body: file.buffer,
                    ContentType: 'video/mp4',
                    ACL: 'public-read',
                },
            };
            const details = { trailer: await s3.upload(params.trailer).promise() };
            return handler_helper_1.default.response(res, codes_constanst_1.SUCCESS, { message: 'Trailer uploaded', data: { details } });
        }
        catch (e) {
            return handler_helper_1.default.response(res, codes_constanst_1.INTERNAL_ERROR, {
                message: 'Internal Error',
                data: { error: e.message },
            });
        }
    }
    /**
     * Get profile picture and thumbnail
     * @param req
     * @param res
     * @returns
     */
    async getProfilePicture(req, res) {
        var _a, _b, _c, _d;
        try {
            const { _id } = req; // Get _id
            const params = {
                profile: {
                    Bucket: AWS_BUCKET,
                    Delimiter: '/',
                    Prefix: `profiles/${_id}/profile/`,
                },
                thumbnail: {
                    Bucket: AWS_BUCKET,
                    Delimiter: '/',
                    Prefix: `profiles/${_id}/thumbnail/`,
                },
            };
            const result = {
                profile: `${AWS_URL}${(_b = (_a = (await s3.listObjectsV2(params.profile).promise()).Contents) === null || _a === void 0 ? void 0 : _a.filter((file) => file.Size !== 0).pop()) === null || _b === void 0 ? void 0 : _b.Key}`,
                thumbnail: `${AWS_URL}${(_d = (_c = (await s3.listObjectsV2(params.thumbnail).promise()).Contents) === null || _c === void 0 ? void 0 : _c.filter((file) => file.Size !== 0).pop()) === null || _d === void 0 ? void 0 : _d.Key}`,
            };
            return handler_helper_1.default.response(res, codes_constanst_1.SUCCESS, { message: 'Response successfully', data: { result } });
        }
        catch (e) {
            return handler_helper_1.default.response(res, codes_constanst_1.INTERNAL_ERROR, {
                message: 'Internal Error',
                data: { error: e.message },
            });
        }
    }
    /**
     * Get profile trailer
     * @param req
     * @param res
     * @returns
     */
    async getProfileTrailer(req, res) {
        var _a, _b;
        try {
            const { _id } = req; // Get _id
            const params = {
                trailer: {
                    Bucket: AWS_BUCKET,
                    Delimiter: '/',
                    Prefix: `profiles/${_id}/trailer/`,
                },
            };
            const result = {
                trailer: `${AWS_URL}${(_b = (_a = (await s3.listObjectsV2(params.trailer).promise()).Contents) === null || _a === void 0 ? void 0 : _a.filter((file) => file.Size !== 0).pop()) === null || _b === void 0 ? void 0 : _b.Key}`,
            };
            return handler_helper_1.default.response(res, codes_constanst_1.SUCCESS, { message: 'Response successfully', data: { result } });
        }
        catch (e) {
            return handler_helper_1.default.response(res, codes_constanst_1.INTERNAL_ERROR, {
                message: 'Internal Error',
                data: { error: e.message },
            });
        }
    }
}
exports.default = new MediaController();
