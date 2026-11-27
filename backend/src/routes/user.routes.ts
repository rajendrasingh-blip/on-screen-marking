import { Router } from "express";
import { currentUser, getAllUser, login, logout, signup, updateUserRole } from "../controllers/user.controller";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/current", currentUser);
router.post("/logout", logout);
router.get("/all", getAllUser);
router.post("/updateRole", updateUserRole);


export default router;