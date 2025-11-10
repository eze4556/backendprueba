"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const streamingPreferences_controller_1 = require("../controllers/streamingPreferences.controller");
const router = (0, express_1.Router)();
router.post('/', streamingPreferences_controller_1.savePreferences);
router.get('/:userId', streamingPreferences_controller_1.getPreferences);
exports.default = router;
//# sourceMappingURL=streamingPreferences.routes.js.map