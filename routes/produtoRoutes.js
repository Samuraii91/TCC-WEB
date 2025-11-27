import express from "express";
import multer from "multer";
import ProdutoController from "../controllers/ProdutoController.js";

const router = express.Router();
const controle = new ProdutoController();

// Configuração do multer em memória
const upload = multer({ storage: multer.memoryStorage() });

// Caminho base
const caminhobase = "produto/";

// 🔹 Formulário de adicionar
router.get("/" + caminhobase + "add", controle.openAdd.bind(controle));
router.post(
  "/" + caminhobase + "add",
  upload.single("imagem"),
  controle.add.bind(controle)
);

// 🔹 Lista de produtos
router.get("/" + caminhobase + "lst", controle.lst.bind(controle));

// 🔹 Formulário de edição
router.get("/" + caminhobase + "edt/:id", controle.openEdit.bind(controle));
router.post(
  "/" + caminhobase + "edt/:id",
  upload.single("imagem"),
  controle.edit.bind(controle)
);

// 🔹 Deletar produto
router.get("/" + caminhobase + "del/:id", controle.delete.bind(controle));

export default router;
