"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class HttpHandler {
    /**
     *
     * @param res
     * @param status
     * @param message
     * @param data
     * @returns
     */
    response(res, status, response) {
        return res.status(status).json({ response });
    }
}
exports.default = new HttpHandler();
