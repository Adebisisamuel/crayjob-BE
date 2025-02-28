import axios from "axios";
import { Response, NextFunction } from "express";
import CallFeedback from "../models/callFeedbackModel";

import JobModel from "../models/jobModel";
import ResumeModel from "../models/resumeModel";
import { extractCallDetails } from "../utils/resumeParser";
import { errorResponse, successResponse } from "../utils/responseHandler";
import { AuthRequest } from "../Types/authTypes";

const updateAgentPrompts = async (screeningQuestions: string[]) => {
  const screeningPrompt = `Screening Questions: ${screeningQuestions.join(
    ", "
  )}`;

  const initialMessage =
    "Hello, How are you doing today? I am a recruiter and you have been headhunted for an amazing job and I would love to just ask a few questions in about 5 minutes. Is this a good time to talk?";

  const promptModel = `
        You are an AI voice assistant known as "Candidate Concierge," handling candidate calls for job applications at Crayhunt. You are professional, smart, and full of energy while keeping conversations structured.

        **Your Role:**
        - Perform an initial screening interview for candidates.
        - Ask each question clearly and engage dynamically.
        - Maintain an energetic and engaging conversation.
        - **Do NOT read or vocalize any extraction summary or feedback to the candidate.** Your role is only to collect responses.
        
        **Interview Instructions:**
        - Start by introducing yourself and asking if it's a good time for a quick call.
        - Before each question, say: "You have 45 seconds to respond."
        - If the candidate goes off-topic, gently redirect them to answer.
        - If a response is unclear, prompt them for clarification.
        - If they exceed 45 seconds, interrupt politely: "I’ll need to move on now."
        - At the end of the last question, say: "Awesome, thanks for your time! I'll share this with my team. Have a great day!" and immediately hang up.
        
        **VERY IMPORTANT:**
        - Do NOT summarize, read back, or provide any feedback or extraction details to the candidate.
        - DO NOT say anything after ending the call.
        
        **After the call, extract (but do not speak) the following details internally:**
        1. Candidate Name - Full name mentioned in the call.
        2. Call Time - The time when the call took place.
        3. Call Status - Whether the call was completed, interrupted, or declined.
        4. Screening Questions & Answers - A structured list mapping each question to the candidate’s responses.
        5. Summary - A short summary of the candidate's responses.
        6. Strengths - Key strengths based on the candidate's responses.
        7. Areas of Improvement - Areas where the candidate could improve.
        8. Recommendations - Hiring recommendation based on the conversation.
        
        You are confident, engaging, and professional at all times. Keep the call efficient and maintain a positive, energetic tone!
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
                    extraction_details: `
                      After the call ends, extract and summarize the following details WITHOUT vocalizing them:

                      1. Candidate Name: Extract the candidate's full name from the conversation.
                      2. Time of Call: The exact timestamp when the call started.
                      3. Call Status: Indicate whether the call was completed, interrupted, or declined.
                      4. Screening Questions & Answers: A structured list mapping each question to the candidate’s responses.
                      5. Summary: A short summary of the candidate's responses.
                      6. Strengths: Identify key strengths based on the candidate's responses.
                      7. Areas of Improvement: Highlight areas where the candidate could improve.
                      8. Recommendations: Provide a hiring recommendation based on the candidate’s answers.

                      IMPORTANT: Do not output any of these details to the candidate. Only extract and store them internally.
                    `,
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

    // Retrieve candidates associated with the job that are in 'queue'
    // const candidates = await ResumeModel.find({ jobId, status: "queue" });
    const candidates = await ResumeModel.find({ jobId });
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
    }) => {
      try {
        const payload = {
          agent_id: process.env.BONLA_AGENT_ID,
          recipient_phone_number: candidate.phone, // Ensure this is in E.164 format
          from_phone_number: process.env.BONLA_FROM_PHONE_NUMBER,
          user_data: {
            candidateId: candidate.id,
            jobId: candidate.jobId,
            userId: candidate.userId,
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
        candidateStatus = CandidateStatus.Shortlisted;
        break;
      default:
        candidateStatus = CandidateStatus.InProgress;
        break;
    }

    await ResumeModel.findByIdAndUpdate(candidateId, {
      status: candidateStatus,
    });

    if (payload.transcript) {
      const extractedData = await extractCallDetails(payload.transcript);
      const filter = { jobId, candidateId };

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

      const response = await CallFeedback.findOneAndUpdate(
        filter,
        updateData,
        options
      );
      console.log("Feedback upserted", response);
    } else {
      console.log(
        candidateId,
        jobId,
        userId,
        "Feedback not updated; conditions not met"
      );
    }
    res.status(201).json(successResponse("Callback processed successfully"));
  } catch (error: any) {
    console.error("Error in callCandidates:", error.message);
    next(error);
  }
};
