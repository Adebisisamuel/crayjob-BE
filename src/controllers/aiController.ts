import axios from "axios";
import { Request, Response, NextFunction, RequestHandler } from "express";

export const callCandidates: any = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Hardcoded questions as an array of strings
    const questions = [
      "Can you tell me a little about yourself?",
      "What are your strengths and weaknesses?",
      "Why do you want to work for Crayshunt HR?",
      "Where do you see yourself in 5 years?",
      "Tell me about a challenge you’ve faced and how you overcame it.",
    ];

    const endpoint = process.env.VAPI_API_ENDPOINT as string;

    const phoneNumberId = process.env.TWILO_PHONE_NUMBER_ID;
    // Example list of multiple customers
    const customers = [
      {
        number: "+234 905 050 7766",
        name: "TJ",
        customerID: "1234567890",
      },
      {
        number: "+316 864 525 14",
        name: "Sam",
        customerID: "1234567892",
      },
    ];

    const questionsMessages = questions.map((question) => ({
      role: "system",
      content: question,
    }));

    const server = {
      url: `${process.env.NGROK_API}/vapi/callback`,
      timeoutSeconds: 20,
      backoffPlan: {
        maxRetries: 3,
        type: "fixed",
        baseDelaySeconds: 2,
      },
    };

    const assistant = {
      name: "Crayhunt HR",
      voice: {
        model: "sonic-english",
        voiceId: "248be419-c632-4f23-adf1-5324ed7dbf1d",
        provider: "cartesia",
        fillerInjectionEnabled: false,
      },
      transcriber: {
        model: "nova-2",
        language: "en",
        provider: "deepgram",
      },
      model: {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              'You are a voice assistant for handling candidate calls for job applications at Crayshunt HR, known as "Candidate Concierge." Your task is to conduct the interview by asking the candidate the questions provided by the employer, then collect and later send back a summary of their responses along with your brief feedback for each question.\n\nProcess Instructions:\n\n• Begin by introducing the interview process and letting the candidate know that you’ll be asking a series of questions while recording their responses.\n\n• Before each question, inform the candidate that they have up to less than 1 minutes to respond. If they exceed the 1-minute limit, politely interrupt by saying something like, “Umm… I’m going to move on to the next question now,” and then continue with the next question.\n\n• Ask each question clearly and one at a time in the order provided. If the candidate goes off-topic or rambles, gently steer them back by saying, “Umm… I’m sorry, but could we get back to the question?” or “Well… can you tell me your answer to that?”\n\n• Keep your conversation short and natural. Use casual phrases like “Umm…”, “Well…”, and “I mean” to simulate a real voice conversation, while maintaining a friendly, witty tone throughout.\n\n• Ensure the candidate answers every question. If a response is unclear or incomplete, politely prompt them for clarification.\n\n• After all questions have been answered, compile a summary of their responses along with your feedback for each answer. Then, conclude the call with a brief statement such as, “Awesome, thanks for your time. I’ll send your responses and feedback over to our team shortly.”\n after this trigger the hang-up command so that the call ends automatically',
          },
          ...questionsMessages,
        ],
        provider: "openai",
        temperature: 0.7,
      },
      firstMessage:
        "Hello, How are you doing today? I am a recruiter and you have been headhunted for an amazing job and I would love to just ask a few questions in about 4 minutes. Is this a good time to talk?",
      clientMessages: [
        "transcript",
        "hang",
        "function-call",
        "speech-update",
        "metadata",
        "transfer-update",
        "conversation-update",
      ],
      serverMessages: [
        "end-of-call-report",
        "status-update",
        "hang",
        "function-call",
      ],
      backgroundDenoisingEnabled: false,
      server,
    };

    // Function to call a single customer
    const callCustomer = async (customer: { number: string; name: string }) => {
      try {
        const vapiResponse = await axios.post(
          endpoint,
          {
            phoneNumberId,
            customer: {
              number: customer.number,
              name: customer.name,
            },
            assistant,
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.VAPI_API_KEY}`,
              "Content-Type": "application/json",
            },
          }
        );

        console.log(`VAPI Response for ${customer.name}:`, vapiResponse.data);
      } catch (error: any) {
        console.error(`Error in calling ${customer.name}:`, error.message);
      }
    };

    // Call each customer sequentially
    for (const customer of customers) {
      await callCustomer(customer);
    }

    return res.status(200).json({
      message: "Test calls initiated",
    });
  } catch (error: any) {
    console.error("Error in callCandidates:", error.message);
    next(error);
  }
};

export const vapiCallback: any = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("Full callback payload:", req.body);

    return res.status(200).json({
      message: "Callback received, processing after 60 seconds.",
    });
  } catch (error: any) {
    console.error("Error in callCandidates:", error.message);
    next(error);
  }
};
