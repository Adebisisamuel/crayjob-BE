"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bolnaCallback = exports.callCandidates = void 0;
const axios_1 = __importDefault(require("axios"));
const callFeedbackModel_1 = __importDefault(require("../models/callFeedbackModel"));
const jobModel_1 = __importDefault(require("../models/jobModel"));
const resumeModel_1 = __importDefault(require("../models/resumeModel"));
const resumeParser_1 = require("../utils/resumeParser");
const responseHandler_1 = require("../utils/responseHandler");
const updateAgentPrompts = (screeningQuestions) => __awaiter(void 0, void 0, void 0, function* () {
    const screeningPrompt = `Screening Questions: ${screeningQuestions.join(", ")}`;
    const initialMessage = "Hello, This is a recruitment call from crayhunt.com";
    const promptModel = `
    You are an AI voice assistant known as "Candidate Concierge," handling candidate calls for job applications at Crayhunt. You are professional, smart, and full of energy while keeping conversations structured.
    *Internal Note:
    Candidate profile details (such as skills and work experience) are provided in the call's user_data. Use these details to tailor the conversation, but DO NOT read them out loud to the candidate.
    *Your Role:
    - Perform an initial screening interview for candidates.
    - Make it conversational. Always get response from the candidate before proceeding.
   - After exchanging pleasantries, ask if it’s a good time to talk for 7 minutes. Get a response. If they agree, go ahead to tell the candidate about the job. Just the exact role and company if available. Don’t read verbatim. Be short. Then answer questions on the job if the candidate asks. If they say it’s not a good time, ask them for the better time to call back.
    - Ask each question clearly and engage dynamically.
    - Maintain an energetic and engaging conversation.
    - **Do NOT read or vocalize any extraction summary, candidate profile details, or feedback to the candidate.** Your role is only to collect responses. Make it conversational but don’t drift away too much.
    *Interview Instructions:
    - Start by introducing yourself and confirming that it is a good time for a quick call. Get a response.
    - Allow the candidate to finish each answer without interruption.
    - If the candidate goes off-topic, gently redirect them back to the question.
    - If a response is unclear, prompt them for clarification.
    - At the end of the last question, say: "Awesome, thanks for your time! I'll share this with my team. Have a great day!" and immediately hang up.
    *VERY IMPORTANT:
    - Do NOT summarize, read back, or provide any feedback or extraction details to the candidate.
    *After the call, extract (but do not speak) the following details internally:
    1. Candidate Name - Full name mentioned in the call.
    2. Call Time - The time when the call took place.
    3. Call Status - Whether the call was completed, interrupted, or declined.
    4. Screening Questions & Answers - A structured list mapping each question to the candidate’s responses.
    5. Strengths - Key strengths based on the candidate's responses.
    6. Areas of Improvement - Areas where the candidate could improve.
    7. Recommendations - Hiring recommendation based on the conversation.
    You are confident, engaging, and professional at all times. Keep the call efficient and maintain a positive, energetic tone!
  `;
    const combinedPrompt = `${promptModel}\n\n${screeningPrompt}`;
    try {
        const response = yield axios_1.default.put(`${process.env.BONLA_API_BASE_URL}v2/agent/${process.env.BONLA_AGENT_ID}`, {
            agent_config: {
                agent_name: "Alfred",
                agent_welcome_message: initialMessage,
                webhook_url: `${process.env.BONLA_WEBHOOK_URL}/ai/callback`,
                agent_type: "other",
                tasks: [
                    {
                        task_type: "conversation",
                        tools_config: {
                            llm_agent: {
                                agent_type: "simple_llm_agent",
                                agent_flow_type: "streaming",
                                routes: {
                                    embedding_model: "snowflake/snowflake-arctic-embed-m",
                                    routes: [
                                        {
                                            route_name: "interview",
                                            utterances: [
                                                "Tell me about yourself.",
                                                "What are your strengths?",
                                                "What is your biggest weakness?",
                                                "Why should we hire you?",
                                                "Where do you see yourself in five years?",
                                                "Describe a time you handled a challenge at work.",
                                            ],
                                            response: "Great! Let's go deeper into that. Can you elaborate?",
                                            score_threshold: 0.9,
                                        },
                                    ],
                                },
                                llm_config: {
                                    agent_flow_type: "streaming",
                                    provider: "openai",
                                    family: "openai",
                                    model: "gpt-3.5-turbo",
                                    summarization_details: null,
                                    extraction_details: null,
                                    max_tokens: 200,
                                    presence_penalty: 0,
                                    frequency_penalty: 0,
                                    base_url: "https://api.openai.com/v1",
                                    top_p: 0.9,
                                    min_p: 0.1,
                                    top_k: 0,
                                    temperature: 0.7,
                                    request_json: true,
                                    prompt: `${combinedPrompt}`,
                                },
                            },
                            synthesizer: {
                                provider: "polly",
                                provider_config: {
                                    voice: "Matthew",
                                    engine: "generative",
                                    sampling_rate: "8000",
                                    language: "en-US",
                                },
                                stream: true,
                                buffer_size: 150,
                                audio_format: "wav",
                            },
                            transcriber: {
                                provider: "deepgram",
                                model: "nova-2",
                                language: "en",
                                stream: true,
                                sampling_rate: 16000,
                                encoding: "linear16",
                                endpointing: 100,
                            },
                            input: { provider: "twilio", format: "wav" },
                            output: { provider: "twilio", format: "wav" },
                            api_tools: null,
                        },
                        toolchain: {
                            execution: "parallel",
                            pipelines: [["transcriber", "llm", "synthesizer"]],
                        },
                        task_config: {
                            hangup_after_silence: 5,
                            incremental_delay: 400,
                            number_of_words_for_interruption: 2,
                            hangup_after_LLMCall: false,
                            call_cancellation_prompt: null,
                            backchanneling: true,
                            backchanneling_message_gap: 5,
                            backchanneling_start_delay: 5,
                            ambient_noise: true,
                            ambient_noise_track: "office-ambience",
                            call_terminate: 120,
                        },
                    },
                ],
            },
            agent_prompts: {
                task_1: {
                    system_prompt: `${combinedPrompt}`,
                },
            },
        }, {
            headers: {
                Authorization: `Bearer ${process.env.BONLA_API_TOKEN}`,
                "Content-Type": "application/json",
            },
        });
        return response.data;
    }
    catch (error) {
        console.error("Error updating agent prompts:", error);
        throw error;
    }
});
const callCandidates = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { jobId } = req.body;
        if (!req.user) {
            res.status(401).json((0, responseHandler_1.errorResponse)("Unauthorized"));
            return;
        }
        if (!jobId) {
            res.status(400).json({ message: "Job ID is required" });
            return;
        }
        // Retrieve job details (including screening questions, job title, etc.)
        const job = yield jobModel_1.default.findById(jobId);
        if (!job) {
            res.status(404).json({ message: "Job not found" });
            return;
        }
        yield jobModel_1.default.findByIdAndUpdate(jobId, { jobStatus: "active" });
        // Retrieve candidates associated with the job that are NOT "shortlisted" or "in-progress"
        const candidates = yield resumeModel_1.default.find({
            jobId,
            status: { $nin: ["shortlisted"] },
        });
        if (candidates.length === 0) {
            res.status(404).json({ message: "No candidates found for this job" });
            return;
        }
        yield updateAgentPrompts(job.screeningQuestions);
        // Add a delay to allow the BONLA system to apply the updated configuration
        console.log("Waiting for 3 seconds to allow the update to take effect...");
        yield new Promise((resolve) => setTimeout(resolve, 3000));
        const callCustomer = (candidate) => __awaiter(void 0, void 0, void 0, function* () {
            console.log(candidate === null || candidate === void 0 ? void 0 : candidate.phone, "here");
            try {
                const payload = {
                    agent_id: process.env.BONLA_AGENT_ID,
                    recipient_phone_number: candidate.phone, // Ensure this is in E.164 format
                    from_phone_number: process.env.BONLA_FROM_PHONE_NUMBER,
                    user_data: {
                        candidateId: candidate.id,
                        jobId: candidate.jobId,
                        userId: candidate.userId,
                        candidateProfile: {
                            skills: candidate.skills,
                            work_experience: candidate.work_experience,
                        },
                    },
                };
                const response = yield axios_1.default.post(`${process.env.BONLA_API_BASE_URL}call`, payload, {
                    headers: {
                        Authorization: `Bearer ${process.env.BONLA_API_TOKEN}`,
                        "Content-Type": "application/json",
                    },
                });
                console.log(`Response for ${candidate.name}:`, response.data);
            }
            catch (error) {
                console.error(`Error in calling ${candidate.name}:`, error.message);
            }
        });
        const calledPhones = new Set();
        for (const candidate of candidates) {
            const phone = candidate.phone;
            // Only call if phone exists and hasn't been called already
            if (phone && !calledPhones.has(phone)) {
                yield callCustomer({
                    name: (_a = candidate.name) !== null && _a !== void 0 ? _a : "Unknown Candidate",
                    phone: phone,
                    id: candidate._id,
                    jobId,
                    userId: req.user.id,
                    skills: candidate.skills,
                    work_experience: candidate.work_experience,
                });
                // Mark this phone as called
                calledPhones.add(phone);
            }
        }
        res.status(200).json({
            message: "Calls initiated successfully",
        });
        return;
    }
    catch (error) {
        console.error("Error in callCandidatesBolna:", error.message);
        next(error);
    }
});
exports.callCandidates = callCandidates;
var CandidateStatus;
(function (CandidateStatus) {
    CandidateStatus["InProgress"] = "in-progress";
    CandidateStatus["Unreachable"] = "unreachable";
    CandidateStatus["Shortlisted"] = "shortlisted";
    CandidateStatus["Rejected"] = "rejected";
})(CandidateStatus || (CandidateStatus = {}));
const bolnaCallback = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    try {
        const payload = req.body;
        const candidateId = (_b = (_a = payload.context_details) === null || _a === void 0 ? void 0 : _a.recipient_data) === null || _b === void 0 ? void 0 : _b.candidateId;
        const jobId = (_d = (_c = payload.context_details) === null || _c === void 0 ? void 0 : _c.recipient_data) === null || _d === void 0 ? void 0 : _d.jobId;
        const userId = (_f = (_e = payload.context_details) === null || _e === void 0 ? void 0 : _e.recipient_data) === null || _f === void 0 ? void 0 : _f.userId;
        // Determine initial status from the callback status
        let candidateStatus;
        switch (payload.status) {
            case "initiated":
            case "ringing":
                candidateStatus = CandidateStatus.InProgress;
                break;
            case "busy":
                candidateStatus = CandidateStatus.Unreachable;
                break;
            case "completed":
            case "success":
                // For completed calls, we will further refine the status below
                candidateStatus = CandidateStatus.InProgress;
                break;
            default:
                candidateStatus = CandidateStatus.InProgress;
                break;
        }
        if (payload.transcript) {
            const job = yield jobModel_1.default.findById(jobId);
            const jobDescription = (job === null || job === void 0 ? void 0 : job.jobDescription) || "";
            const candidateSkills = ((_h = (_g = payload.context_details) === null || _g === void 0 ? void 0 : _g.recipient_data) === null || _h === void 0 ? void 0 : _h.skills) || [];
            const workExperience = ((_k = (_j = payload.context_details) === null || _j === void 0 ? void 0 : _j.recipient_data) === null || _k === void 0 ? void 0 : _k.work_experience) || [];
            const extractedData = yield (0, resumeParser_1.extractCallDetails)(payload.transcript, jobDescription, candidateSkills, workExperience);
            // Business logic for final status:
            // Business logic for final status when the call is completed:
            if (payload.status === "completed" || payload.status === "success") {
                if (extractedData.recommendations &&
                    extractedData.recommendations.finalDecision &&
                    extractedData.recommendations.finalDecision.toLowerCase() === "hire") {
                    candidateStatus = CandidateStatus.Shortlisted;
                }
                else if (extractedData.recommendations &&
                    extractedData.recommendations.finalDecision &&
                    extractedData.recommendations.finalDecision.toLowerCase() === "reject") {
                    candidateStatus = CandidateStatus.Rejected;
                }
                else {
                    // Candidate remains in-progress to allow for another call attempt.
                    candidateStatus = CandidateStatus.InProgress;
                }
            }
            // Helper: sanitize keys by replacing dots with underscores
            const sanitizeKeys = (obj) => {
                const sanitized = {};
                for (const key in obj) {
                    sanitized[key.replace(/\./g, "_")] = obj[key];
                }
                return sanitized;
            };
            const sanitizedQA = sanitizeKeys(extractedData.screeningQA);
            const screeningQA = new Map(Object.entries(sanitizedQA));
            const updateData = {
                jobId: jobId,
                userId: userId,
                candidateId: candidateId,
                callId: payload.id,
                timeOfCall: new Date(payload.created_at),
                duration: payload.conversation_duration,
                status: payload.status,
                transcript: payload.transcript,
                summary: extractedData.summary,
                screeningQA,
                strengths: extractedData.strengths,
                areasOfImprovement: extractedData.areasOfImprovement,
                recommendations: extractedData.recommendations,
            };
            const options = { new: true, upsert: true };
            const feedbackResponse = yield callFeedbackModel_1.default.findOneAndUpdate({ jobId, candidateId }, updateData, options);
            console.log("Feedback upserted", feedbackResponse);
        }
        else {
            console.log(candidateId, jobId, userId, "No transcript provided; candidate status based solely on callback payload.");
        }
        // Update the candidate's status.
        yield resumeModel_1.default.findByIdAndUpdate(candidateId, {
            status: candidateStatus,
        });
        console.log(`Candidate ${candidateId} for job ${jobId} updated to status: ${candidateStatus}`);
        res.status(201).json({ message: "Callback processed successfully" });
    }
    catch (error) {
        console.error("Error in callCandidates:", error.message);
        next(error);
    }
});
exports.bolnaCallback = bolnaCallback;
