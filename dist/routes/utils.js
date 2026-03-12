"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseId = void 0;
const parseId = (raw) => {
    if (typeof raw !== 'string') {
        return null;
    }
    const id = Number.parseInt(raw, 10);
    return Number.isNaN(id) ? null : id;
};
exports.parseId = parseId;
