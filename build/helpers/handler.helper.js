"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class HttpHandler {
    /**
     * Maneja respuestas exitosas
     * @param res Express Response object
     * @param data Datos a enviar
     * @param status Código de estado HTTP (default: 200)
     */
    success(res, data, status = 200) {
        return res.status(status).json({
            success: true,
            data
        });
    }
    /**
     * Maneja respuestas de error
     * @param res Express Response object
     * @param error Objeto de error con código y mensaje
     */
    error(res, error) {
        return res.status(error.code).json({
            success: false,
            error: {
                message: error.message,
                ...(error.errors && { errors: error.errors })
            }
        });
    }
}
exports.default = new HttpHandler();
//# sourceMappingURL=handler.helper.js.map