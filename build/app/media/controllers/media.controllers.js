"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_s3_1 = require("@aws-sdk/client-s3");
const handler_helper_1 = __importDefault(require("../../../helpers/handler.helper"));
const codes_constanst_1 = require("../../../constants/codes.constanst");
const environments_1 = require("../../../environments/environments");
const image_tools_1 = __importDefault(require("../../../tools/image.tools"));
const { AWS_URL, AWS_ID, AWS_SECRET_KEY, AWS_BUCKET } = (0, environments_1.environment)();
const s3Client = new client_s3_1.S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: AWS_ID,
        secretAccessKey: AWS_SECRET_KEY,
    }
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
            // AWS SDK v3 commands for uploading profile and thumbnail
            const profileCommand = new client_s3_1.PutObjectCommand({
                Bucket: AWS_BUCKET,
                Key: `profiles/${_id}/profile/${file.name}`,
                Body: file.buffer,
                ContentType: 'image/jpeg',
                ACL: 'public-read',
            });
            const thumbnailCommand = new client_s3_1.PutObjectCommand({
                Bucket: AWS_BUCKET,
                Key: `profiles/${_id}/thumbnail/${file.name}`,
                Body: thumbnail,
                ContentType: 'image/jpeg',
                ACL: 'public-read',
            });
            const [profileResult, thumbnailResult] = await Promise.all([
                s3Client.send(profileCommand),
                s3Client.send(thumbnailCommand)
            ]);
            const details = {
                profile: {
                    Location: `${AWS_URL}/${AWS_BUCKET}/profiles/${_id}/profile/${file.name}`,
                    ETag: profileResult.ETag,
                    Key: `profiles/${_id}/profile/${file.name}`
                },
                thumbnail: {
                    Location: `${AWS_URL}/${AWS_BUCKET}/profiles/${_id}/thumbnail/${file.name}`,
                    ETag: thumbnailResult.ETag,
                    Key: `profiles/${_id}/thumbnail/${file.name}`
                }
            };
            return handler_helper_1.default.success(res, { message: 'Profile picture uploaded', data: { details } });
        }
        catch (e) {
            return handler_helper_1.default.error(res, {
                code: codes_constanst_1.INTERNAL_ERROR,
                message: e.message
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
            // AWS SDK v3 command for uploading trailer
            const trailerCommand = new client_s3_1.PutObjectCommand({
                Bucket: AWS_BUCKET,
                Key: `profiles/${_id}/trailer/${file.name}`,
                Body: file.buffer,
                ContentType: 'video/mp4',
                ACL: 'public-read',
            });
            const trailerResult = await s3Client.send(trailerCommand);
            const details = {
                trailer: {
                    Location: `${AWS_URL}/${AWS_BUCKET}/profiles/${_id}/trailer/${file.name}`,
                    ETag: trailerResult.ETag,
                    Key: `profiles/${_id}/trailer/${file.name}`
                }
            };
            return handler_helper_1.default.success(res, { message: 'Trailer uploaded', data: { details } });
        }
        catch (e) {
            return handler_helper_1.default.error(res, {
                code: codes_constanst_1.INTERNAL_ERROR,
                message: e.message
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
            // AWS SDK v3 commands for listing objects
            const profileCommand = new client_s3_1.ListObjectsV2Command({
                Bucket: AWS_BUCKET,
                Delimiter: '/',
                Prefix: `profiles/${_id}/profile/`,
            });
            const thumbnailCommand = new client_s3_1.ListObjectsV2Command({
                Bucket: AWS_BUCKET,
                Delimiter: '/',
                Prefix: `profiles/${_id}/thumbnail/`,
            });
            const [profileResponse, thumbnailResponse] = await Promise.all([
                s3Client.send(profileCommand),
                s3Client.send(thumbnailCommand)
            ]);
            const result = {
                profile: `${AWS_URL}${(_b = (_a = profileResponse.Contents) === null || _a === void 0 ? void 0 : _a.filter((file) => file.Size !== 0).pop()) === null || _b === void 0 ? void 0 : _b.Key}`,
                thumbnail: `${AWS_URL}${(_d = (_c = thumbnailResponse.Contents) === null || _c === void 0 ? void 0 : _c.filter((file) => file.Size !== 0).pop()) === null || _d === void 0 ? void 0 : _d.Key}`,
            };
            return handler_helper_1.default.success(res, { message: 'Response successfully', data: { result } });
        }
        catch (e) {
            return handler_helper_1.default.error(res, {
                code: codes_constanst_1.INTERNAL_ERROR,
                message: e.message
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
            // AWS SDK v3 command for listing trailer objects
            const trailerCommand = new client_s3_1.ListObjectsV2Command({
                Bucket: AWS_BUCKET,
                Delimiter: '/',
                Prefix: `profiles/${_id}/trailer/`,
            });
            const trailerResponse = await s3Client.send(trailerCommand);
            const result = {
                trailer: `${AWS_URL}${(_b = (_a = trailerResponse.Contents) === null || _a === void 0 ? void 0 : _a.filter((file) => file.Size !== 0).pop()) === null || _b === void 0 ? void 0 : _b.Key}`,
            };
            return handler_helper_1.default.success(res, { message: 'Response successfully', data: { result } });
        }
        catch (e) {
            return handler_helper_1.default.error(res, {
                code: codes_constanst_1.INTERNAL_ERROR,
                message: e.message
            });
        }
    }
}
exports.default = new MediaController();
//# sourceMappingURL=media.controllers.js.map