"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureGuestId = ensureGuestId;
const uuid_1 = require("uuid");
const env_1 = require("../config/env");
const GUEST_ID_MAX_AGE = 90 * 24 * 60 * 60 * 1000;
function ensureGuestId(req, res, next) {
    let guestId = req.cookies?.guestId;
    if (!guestId) {
        guestId = (0, uuid_1.v4)();
        res.cookie('guestId', guestId, {
            httpOnly: true,
            secure: env_1.env.isProd,
            sameSite: 'lax',
            maxAge: GUEST_ID_MAX_AGE,
            path: '/',
        });
    }
    req.guestId = guestId;
    next();
}
//# sourceMappingURL=guestId.js.map