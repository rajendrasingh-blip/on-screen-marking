import { Router } from "express";
import answerSheetRoute from "./answerSheet.routes";
import userRoute from "./user.routes";
import examRoute from "./exam.routes";

const router = Router();

router.use("/answer-sheet", answerSheetRoute);
router.use("/user", userRoute);
router.use("/exam", examRoute);

export default router;