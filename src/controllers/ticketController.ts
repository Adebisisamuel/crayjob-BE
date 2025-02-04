import { Request, Response } from "express";
import { Ticket } from "../models/ticketModel";
import { AuthRequest } from "../Types/authTypes";
import { successResponse, errorResponse } from "../utils/responseHandler";

export const createTicket = async (req: AuthRequest, res: Response) => {
  try {
    const { jobTitle, jobDescription, screeningQuestions } = req.body;

    if (!req.user) {
      res.status(401).json(errorResponse("Unauthorized"));
      return;
    }

    const ticket = new Ticket({
      user: req.user.id,
      jobTitle,
      jobDescription,
      screeningQuestions,
    });

    await ticket.save();
    res
      .status(201)
      .json(successResponse("Ticket created successfully", ticket));
  } catch (error) {
    console.error("Error creating ticket:", error);
    res.status(500).json(errorResponse("Internal Server Error"));
  }
};

export const getAllTicket = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse("Unauthorized"));
      return;
    }
    const tickets = await Ticket.find({ user: req.user.id }).populate(
      "user",
      "firstName surname email"
    );
    res.json(successResponse("All tickets retrieved successfully", tickets));
  } catch (error) {
    console.log("Error retrieving tickets", error);
    res.status(500).json(errorResponse("Internal Server Error"));
  }
};

export const getTicket = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(400).json(errorResponse("Unauthorized"));
      return;
    }
    const ticket = await Ticket.findOne({
      _id: req.params.id,
      user: req.user.id,
    });
    if (!ticket) {
      res.status(400).json(errorResponse("Ticket not found or Unauthorized"));
      return;
    }
    res.json(successResponse("Ticket retrieved successfully", ticket));
  } catch (error) {
    console.log("Error getting ticket", error);
    res.status(500).json(errorResponse("Internal Server Error"));
  }
};

export const updateTicket = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse("Unauthorized"));
      return;
    }
    const ticket = await Ticket.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user.id,
      },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!ticket) {
      res.status(404).json(errorResponse("Ticket not found or unauthorized"));
    }
    res.json(successResponse("Ticket Updated Successfully", ticket));
    return;
  } catch (error) {
    console.log("Error Updating Ticket", error);
    res.status(500).json(errorResponse("Internal Server Error"));
  }
};

export const deleteTicket = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse("Unauthorized"));
      return;
    }
    const ticket = await Ticket.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });
    if (!ticket) {
      res.status(404).json(errorResponse("Ticket not found or unauthorized"));
    }
    res.status(200).json(successResponse("Ticket Deleted Successfully"));
  } catch (error) {
    console.log("Error deleteing Ticket", error);
    res.status(500).json(errorResponse("Internal Server Error"));
    return;
  }
};
