"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.debugInfo = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const professional_models_1 = __importDefault(require("../app/professional/models/professional.models"));
const autonomous_models_1 = __importDefault(require("../app/autonomous/models/autonomous.models"));
const dedicated_models_1 = __importDefault(require("../app/dedicated/models/dedicated.models"));
const debugInfo = async (req, res) => {
    var _a;
    try {
        const dbName = (_a = mongoose_1.default.connection.db) === null || _a === void 0 ? void 0 : _a.databaseName;
        const connectionState = mongoose_1.default.connection.readyState;
        const counts = await Promise.all([
            professional_models_1.default.countDocuments(),
            autonomous_models_1.default.countDocuments(),
            dedicated_models_1.default.countDocuments()
        ]);
        const professionals = await professional_models_1.default.find().limit(2);
        const autonomous = await autonomous_models_1.default.find().limit(2);
        const dedicated = await dedicated_models_1.default.find().limit(2);
        const debugData = {
            database: {
                name: dbName,
                connectionState: connectionState === 1 ? 'Connected' : 'Disconnected',
                uri: process.env.MONGO_DB_LOCAL_URI ? 'LOCAL_URI_SET' : 'LOCAL_URI_NOT_SET'
            },
            counts: {
                professionals: counts[0],
                autonomous: counts[1],
                dedicated: counts[2]
            },
            sampleData: {
                professionals: professionals.map(p => ({
                    name: p.name,
                    profession: p.profession,
                    score: p.score
                })),
                autonomous: autonomous.map(a => ({
                    name: a.name,
                    score: a.score
                })),
                dedicated: dedicated.map(d => ({
                    name: d.name,
                    profession: d.profession,
                    score: d.score
                }))
            }
        };
        return res.status(200).json(debugData);
    }
    catch (error) {
        return res.status(500).json({
            error: 'Debug error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.debugInfo = debugInfo;
//# sourceMappingURL=debug.controller.js.map