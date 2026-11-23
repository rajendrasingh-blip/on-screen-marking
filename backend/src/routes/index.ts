import { Router } from "express";
import studentRoute from "./student.routes";
import authRoute from "./auth.routes";

const router = Router();

router.use("/student", studentRoute);
router.use("/auth", authRoute);


export default router;