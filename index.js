import express from "express";
import { Pool } from "pg";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config({ path: "/Users/manu/Dev-classes/test-16/.env" });
import {
  signupZodSchema,
  loginZodSchmea,
  contestZodScehma,
  mcqSchema,
} from "./zodvalidation.js";
import { validateToken } from "./token.js";

const app = express();
app.use(express.json());
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const validate = signupZodSchema.safeParse(req.body);
    if (!validate.success) {
      return res.status(400).json({
        success: false,
        data: null,
        error: "INVALID_REQUEST",
      });
    }
    const checkEmailQuery = "SELECT email FROM users WHERE email = $1";
    const { rows } = await pool.query(checkEmailQuery, [email]);

    if (rows.length > 0) {
      return res.status(400).json({
        success: false,
        data: null,
        error: "EMAIL_ALREADY_EXISTS",
      });
    }

    const defaultRole = role || "contestee";
    const User_Table = `INSERT INTO users (name, email, password, role) 
      VALUES ($1, $2, $3, $4) RETURNING user_id, name, email, role`;
    const user = await pool.query(User_Table, [
      name,
      email,
      password,
      defaultRole,
    ]);

    res.status(201).json({
      success: true,
      data: {
        id: user.rows[0].user_id,
        name: user.rows[0].name,
        email: user.rows[0].email,
        role: user.rows[0].role,
      },
      error: null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: null,
      error: "INTERNAL_SERVER_ERROR",
    });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const loginValidate = loginZodSchmea.safeParse(req.body);
    if (!loginValidate.success) {
      return res
        .status(400)
        .json({ success: false, data: null, error: "INVALID_REQUEST" });
    }

    const checkCredentials =
      "SELECT user_id, name, email, role FROM users WHERE email = $1 AND password = $2";
    const { rows } = await pool.query(checkCredentials, [email, password]);

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        data: null,
        error: "INVALID_CREDENTIALS",
      });
    }

    const user = rows[0];
    const token = jwt.sign(
      { userId: user.user_id, email: user.email, role: user.role },
      "admin",
      {
        expiresIn: "30d",
      }
    );
    res.status(200).json({
      success: true,
      data: {
        token: token,
      },
      error: null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: null,
      error: "INTERNAL_SERVER_ERROR",
    });
  }
});

app.post("/api/contests", validateToken, async (req, res) => {
  try {
    const validatecontest = contestZodScehma.safeParse(req.body);
    const { title, description, startTime, endTime } = req.body;
    if (!validatecontest.success) {
      return res.status(400).json({
        success: false,
        data: null,
        error: "INVALID_REQUEST",
      });
    }
    if (req.role != "creator") {
      return res.status(403).json({
        success: false,
        data: null,
        error: "FORBIDDEN",
      });
    }
    const contests_Table = `INSERT INTO contests (title, description, startTime, endTime, creator_id) 
    VALUES ($1, $2, $3, $4, $5) RETURNING contests_id, creator_id, title, description, startTime, endTime`;
    const contest = await pool.query(contests_Table, [
      title,
      description,
      startTime,
      endTime,
      req.userId,
    ]);

    res.status(201).json({
      success: true,
      data: {
        id: contest.rows[0].contests_id,
        title: contest.rows[0].title,
        description: contest.rows[0].description,
        creatorId: contest.rows[0].creator_id,
        startTime: contest.rows[0].startTime,
        endTime: contest.rows[0].endTime,
      },
      error: null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: null,
      error: "INTERNAL_SERVER_ERROR",
    });
  }
});

app.get("/api/contests/:contestId", validateToken, async (req, res) => {
  try {
    const contestId = req.params.contestId;

    if (!contestId) {
      return res.status(404).json({
        success: false,
        data: null,
        error: "CONTEST_NOT_FOUND",
      });
    }

    const checkContest =
      "SELECT contests_id, title, description, startTime, endTime, creator_id FROM contests WHERE contests_id = $1";
    const { rows } = await pool.query(checkContest, [contestId]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        error: "CONTEST_NOT_FOUND",
      });
    }

    const contest = rows[0];

    const msqCheck =
      "SELECT mcq_id, question_text, options, points FROM mcqs WHERE contest_id = $1";
    const mcqsResult = await pool.query(msqCheck, [contestId]);

    const dsaProblemsCheck =
      "SELECT problem_id, title, description, tags, points, time_limit, memory_limit FROM dsa_problems WHERE contest_id = $1";
    const dsaProblemsResult = await pool.query(dsaProblemsCheck, [contestId]);

    const mcqs = mcqsResult.rows.map((mcq) => ({
      id: mcq.mcq_id,
      questionText: mcq.question_text,
      options: mcq.options,
      points: mcq.points,
    }));

    const dsaProblems = dsaProblemsResult.rows.map((problem) => ({
      id: problem.problem_id,
      title: problem.title,
      description: problem.description,
      tags: problem.tags,
      points: problem.points,
      timeLimit: problem.time_limit,
      memoryLimit: problem.memory_limit,
    }));

    res.status(200).json({
      success: true,
      data: {
        id: contest.contests_id,
        title: contest.title,
        description: contest.description,
        startTime: contest.startTime,
        endTime: contest.endTime,
        creatorId: contest.creator_id,
        mcqs: mcqs,
        dsaProblems: dsaProblems,
      },
      error: null,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      data: null,
      error: "CONTEST_NOT_FOUND",
    });
  }
});

app.post("/api/contests/:contestId/mcq", validateToken, async (req, res) => {
  try {
    const contestId = req.params.contestId;
    const { questionText, options, correctOptionIndex, points } = req.body;

    const mcqvalidation = mcqSchema.safeParse(req.body);
    if (!mcqvalidation.success) {
      return res.status(400).json({
        success: false,
        data: null,
        error: "INVALID_REQUEST",
      });
    }

    if (req.role != "creator") {
      return res.status(403).json({
        success: false,
        data: null,
        error: "FORBIDDEN",
      });
    }

    const checkContest =
      "SELECT contests_id, creator_id FROM contests WHERE contests_id = $1";
    const contestResult = await pool.query(checkContest, [contestId]);

    if (contestResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        error: "CONTEST_NOT_FOUND",
      });
    }

    const contest = contestResult.rows[0];

    if (contest.creator_id !== req.userId) {
      return res.status(403).json({
        success: false,
        data: null,
        error: "FORBIDDEN",
      });
    }

    const createMcq =
      "INSERT INTO mcq_questions (contest_id, question_text, options, correct_option_index, points) VALUES ($1, $2, $3, $4, $5) RETURNING id";
    const mcqResult = await pool.query(createMcq, [
      contestId,
      questionText,
      options,
      correctOptionIndex,
      points,
    ]);

    res.status(201).json({
      success: true,
      data: {
        id: mcqResult.rows[0].id,
        contestId: contestId,
      },
      error: null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: null,
      error: "INTERNAL_SERVER_ERROR",
    });
  }
});

app.listen(3000);
