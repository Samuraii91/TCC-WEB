import express from "express";
import CategoriaController from "../controllers/CategoriaController.js";

const router = express.Router();
const controle = new CategoriaController();

// Caminho base
const caminhobase = "categoria/";

// 🔹 Formulário de adicionar
router.get("/" + caminhobase + "add", controle.openAdd.bind(controle));
router.post("/" + caminhobase + "add", controle.add.bind(controle));

// 🔹 Lista de categorias
router.get("/" + caminhobase + "lst", controle.list.bind(controle));

// 🔹 Formulário de edição
router.get("/" + caminhobase + "edt/:id", controle.openEdit.bind(controle));
router.post("/" + caminhobase + "edt/:id", controle.edit.bind(controle));

// 🔹 Deletar categoria
router.get("/" + caminhobase + "del/:id", controle.delete.bind(controle));

export default router;
