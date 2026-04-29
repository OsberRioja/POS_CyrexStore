"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userPreference_controller_1 = require("../controllers/userPreference.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.authMiddleware, userPreference_controller_1.UserPreferenceController.getMyPreferences);
router.put('/currency', auth_middleware_1.authMiddleware, userPreference_controller_1.UserPreferenceController.updateCurrency);
exports.default = router;
