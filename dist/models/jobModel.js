"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Job = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const jobSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    companyName: {
        type: String,
        required: true,
        trim: true,
    },
    jobTitle: {
        type: String,
        required: true,
        trim: true,
    },
    locationType: {
        type: String,
        required: true,
        enum: ["Remote", "On-site", "Hybrid"],
    },
    jobDescription: {
        type: String,
        required: true,
        trim: true,
    },
    screeningQuestions: {
        type: [String],
        required: true,
    },
    countryCode: {
        type: String,
        trim: true,
        required: false,
    },
    state: {
        type: String,
        trim: true,
        required: false,
    },
    queue: {
        type: Number,
        default: 0,
    },
    inProgress: {
        type: Number,
        default: 0,
    },
    unreachable: {
        type: Number,
        default: 0,
    },
    shortlisted: {
        type: Number,
        default: 0,
    },
    rejected: {
        type: Number,
        default: 0,
    },
    jobStatus: {
        type: String,
        enum: ["active", "closed"],
        default: "active",
    },
}, { timestamps: true });
exports.Job = mongoose_1.default.model("Job", jobSchema);
exports.default = exports.Job;
