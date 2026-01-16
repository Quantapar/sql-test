import express from "express";
import { Pool } from "pg";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config({ path: "/Users/manu/Dev-classes/test-16/.env" });
import {
  signupZodSchema,
  loginZodSchmea,
  contestZodScehma,
} from "./zodvalidation.js";
import { validateToken } from "./token.js";

const app = express();
app.use(express.json());
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.post("/api/auth/signup", async (req, res) => {
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

  const User_Table = `INSERT INTO users (name, email, password, role) 
    VALUES ($1, $2, $3, $4) RETURNING user_id, name, email, role`;
  const user = await pool.query(User_Table, [name, email, password, role]);

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
});

app.post("/api/auth/login", async (req, res) => {
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
});

app.post("/api/contests", validateToken, async (req, res) => {
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

  app.get("/api/contests/:contestId", validateToken, async (req, res) => {});
});

app.listen(3000);
