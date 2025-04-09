import express from "express";
import { login, signUp, verifyUser } from "../controllers/auth.js";

const AuthRoutes = express.Router();

AuthRoutes.post("/signup", signUp);
AuthRoutes.post("/login", login);
AuthRoutes.get("/verify", verifyUser);
export default AuthRoutes;
