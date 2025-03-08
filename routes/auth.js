import express from "express";
import { login, verifyUser } from "../controllers/auth.js";

const AuthRoutes = express.Router();

AuthRoutes.post("/login", login);
AuthRoutes.get("/verify", verifyUser);
export default AuthRoutes;
