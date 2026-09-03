import {Router} from "express";
import AdminController from "../controllers/AdminController.js";


const router = Router();

router.get("/listar", AdminController.listar)
router.delete("/deletar/:id", AdminController.deletar);

export default router;