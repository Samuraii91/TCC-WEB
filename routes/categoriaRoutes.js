import express from "express";
import multer from "multer";
import CategoriaController from "../controllers/CategoriaController.js";
import { verificarLogin } from "../middlewares/auth.js";

const router = express.Router();
const controle = new CategoriaController();
const upload = multer(); // ← NECESSÁRIO para req.file funcionar

// 🔒 Todas as rotas de categoria exigem login
router.use("/categoria", verificarLogin);

// Caminho base
const caminhobase = "categoria/";

// 🔹 Formulário de adicionar
router.get("/" + caminhobase + "add", controle.openAdd.bind(controle));
router.post("/" + caminhobase + "add", upload.single("imagem"), controle.add.bind(controle));

// 🔹 Lista de categorias
router.get("/" + caminhobase + "lst", controle.list.bind(controle));

// 🔹 Formulário de edição
router.get("/" + caminhobase + "edt/:id", controle.openEdit.bind(controle));
router.post("/" + caminhobase + "edt/:id", upload.single("imagem"), controle.edit.bind(controle));

// 🔹 Deletar categoria
router.get("/" + caminhobase + "del/:id", controle.delete.bind(controle));

export default router;
  