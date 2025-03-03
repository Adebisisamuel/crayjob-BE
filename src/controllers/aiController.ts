import axios from "axios";
import { Response, NextFunction } from "express";
import CallFeedback from "../models/callFeedbackModel";

import JobModel from "../models/jobModel";
import ResumeModel from "../models/resumeModel";
import { extractCallDetails } from "../utils/resumeParser";
import { errorResponse } from "../utils/responseHandler";
import { AuthRequest } from "../Types/authTypes";

const updateAgentPrompts = async (screeningQuestions: string[]) => {
  const screeningPrompt = `Screening Questions: ${screeningQuestions.join(
    ", "
  )}`;

  const initialMessage = "Hello, This is a recruitment call from crayhunt.com";
  const promptModel = `
    You are an AI voice assistant known as "Candidate Concierge," handling candidate calls for job applications at Crayhunt. You are professional, smart, and full of energy while keeping conversations structured.
    *Internal Note:
    Candidate profile details (such as skills and work experience) are provided in the call's user_data. Use these details to tailor the conversation, but DO NOT read them out loud to the candidate.
    *Your Role:
    - Perform an initial screening interview for candidates.
    - Make it conversational. Always get a response from the candidate before proceeding.
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
    **Additional Instructions:**
    - If the candidate says they’re not interested in the job, ask them if they can refer another candidate. Tell them you will send them an email after the call, which they can reply to with the resume or contact of the referred candidate.
    - Ask the candidate to send their resume to the email they’ll receive after the call.
`;
  const combinedPrompt = `${promptModel}\n\n${screeningPrompt}`;

  try {
    const response = await axios.put(
      `${process.env.BONLA_API_BASE_URL}v2/agent/${process.env.BONLA_AGENT_ID}`,
      {
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
                        response:
                          "Great! Let's go deeper into that. Can you elaborate?",
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
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.BONLA_API_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating agent prompts:", error);
    throw error;
  }
};

export const callCandidates = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { jobId } = req.body;

    if (!req.user) {
      res.status(401).json(errorResponse("Unauthorized"));
      return;
    }

    if (!jobId) {
      res.status(400).json({ message: "Job ID is required" });
      return;
    }

    // Retrieve job details (including screening questions, job title, etc.)
    const job = await JobModel.findById(jobId);
    if (!job) {
      res.status(404).json({ message: "Job not found" });
      return;
    }

    await JobModel.findByIdAndUpdate(jobId, { jobStatus: "active" });

    // Retrieve candidates associated with the job that are NOT "shortlisted" or "in-progress"
    const candidates = await ResumeModel.find({
      jobId,
      status: { $nin: ["shortlisted"] },
    });
    if (candidates.length === 0) {
      res.status(404).json({ message: "No candidates found for this job" });
      return;
    }

    await updateAgentPrompts(job.screeningQuestions);

    // Add a delay to allow the BONLA system to apply the updated configuration
    console.log("Waiting for 3 seconds to allow the update to take effect...");
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const callCustomer = async (candidate: {
      name: string;
      phone: string;
      id: string;
      jobId: string;
      userId: string;
      skills: string[];
      work_experience: any;
    }) => {
      console.log(candidate?.phone, "here");
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

        const response = await axios.post(
          `${process.env.BONLA_API_BASE_URL}call`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${process.env.BONLA_API_TOKEN}`,
              "Content-Type": "application/json",
            },
          }
        );

        console.log(`Response for ${candidate.name}:`, response.data);
      } catch (error: any) {
        console.error(`Error in calling ${candidate.name}:`, error.message);
      }
    };

    const calledPhones = new Set<string>();

    for (const candidate of candidates) {
      const phone = candidate.phone;
      // Only call if phone exists and hasn't been called already
      if (phone && !calledPhones.has(phone)) {
        await callCustomer({
          name: candidate.name ?? "Unknown Candidate",
          phone: phone,
          id: candidate._id as string,
          jobId,
          userId: req.user.id,
          skills: candidate.skills as string[],
          work_experience: candidate.work_experience as any,
        });
        // Mark this phone as called
        calledPhones.add(phone);
      }
    }

    res.status(200).json({
      message: "Calls initiated successfully",
    });

    return;
  } catch (error: any) {
    console.error("Error in callCandidatesBolna:", error.message);
    next(error);
  }
};

enum CandidateStatus {
  InProgress = "in-progress",
  Unreachable = "unreachable",
  Shortlisted = "shortlisted",
  Rejected = "rejected",
}

export const bolnaCallback: any = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const payload = req.body;

    const candidateId = payload.context_details?.recipient_data?.candidateId;
    const jobId = payload.context_details?.recipient_data?.jobId;
    const userId = payload.context_details?.recipient_data?.userId;

    // Determine initial status from the callback status
    let candidateStatus: CandidateStatus;
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
      const job = await JobModel.findById(jobId);
      const jobDescription = job?.jobDescription || "";
      const candidateSkills =
        payload.context_details?.recipient_data?.skills || [];
      const workExperience =
        payload.context_details?.recipient_data?.work_experience || [];
      const extractedData = await extractCallDetails(
        payload.transcript,
        jobDescription,
        candidateSkills,
        workExperience
      );

      // Business logic for final status:
      // Business logic for final status when the call is completed:
      if (payload.status === "completed" || payload.status === "success") {
        if (
          extractedData.recommendations &&
          extractedData.recommendations.finalDecision &&
          extractedData.recommendations.finalDecision.toLowerCase() === "hire"
        ) {
          candidateStatus = CandidateStatus.Shortlisted;
        } else if (
          extractedData.recommendations &&
          extractedData.recommendations.finalDecision &&
          extractedData.recommendations.finalDecision.toLowerCase() === "reject"
        ) {
          candidateStatus = CandidateStatus.Rejected;
        } else {
          // Candidate remains in-progress to allow for another call attempt.
          candidateStatus = CandidateStatus.InProgress;
        }
      }

      // Helper: sanitize keys by replacing dots with underscores
      const sanitizeKeys = (obj: Record<string, string>) => {
        const sanitized: Record<string, string> = {};
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

      const feedbackResponse = await CallFeedback.findOneAndUpdate(
        { jobId, candidateId },
        updateData,
        options
      );
      console.log("Feedback upserted", feedbackResponse);
    } else {
      console.log(
        candidateId,
        jobId,
        userId,
        "No transcript provided; candidate status based solely on callback payload."
      );
    }
    // Update the candidate's status.
    await ResumeModel.findByIdAndUpdate(candidateId, {
      status: candidateStatus,
    });
    console.log(
      `Candidate ${candidateId} for job ${jobId} updated to status: ${candidateStatus}`
    );

    res.status(201).json({ message: "Callback processed successfully" });
  } catch (error: any) {
    console.error("Error in callCandidates:", error.message);
    next(error);
  }
};
