import express from "express";
import { login } from "../controllers/auth.js";

const AuthRoutes = express.Router();

AuthRoutes.post("/login", login);
export default AuthRoutes;
