"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorResponse = exports.successResponse = void 0;
const successResponse = (message, data = null) => ({
    success: true,
    message,
    data,
});
exports.successResponse = successResponse;
const errorResponse = (message, errors = null) => ({
    success: false,
    message,
    errors,
});
exports.errorResponse = errorResponse;
