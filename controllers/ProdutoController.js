import Produto from "../models/Produto.js";
import Categoria from "../models/Categoria.js";

export default class ProdutoController {

  // 📌 Abrir formulário de cadastro
  async openAdd(req, res) {
    try {
      const categorias = await Categoria.find();
      res.render("produto/add", { categorias });
    } catch (erro) {
      console.error("Erro ao carregar formulário:", erro);
      res.status(500).send("Erro ao carregar a página de cadastro");
    }
  }

  // 📌 Cadastrar produto
  async add(req, res) {
    try {
      const { nome, descricao, preco, categoria, quantidade } = req.body;

      await Produto.create({
        nome,
        descricao,
        preco,
        categoria,
        quantidade,
        imagemBase64: req.file ? req.file.buffer.toString("base64") : null,
        mimetype: req.file ? req.file.mimetype : null,
      });

      res.redirect("/produto/lst");
    } catch (erro) {
      console.error("Erro ao cadastrar produto:", erro);
      res.status(500).send("Erro ao cadastrar o produto");
    }
  }

  // 📌 Listar produtos
  async lst(req, res) {
    try {
      const produtos = await Produto.find().populate("categoria");
      res.render("produto/lst", { produtos });
    } catch (erro) {
      console.error("Erro ao listar produtos:", erro);
      res.status(500).send("Erro ao carregar a lista de produtos");
    }
  }

  // 📌 Abrir form de edição
  async openEdit(req, res) {
    try {
      const produto = await Produto.findById(req.params.id);
      const categorias = await Categoria.find();

      if (!produto) {
        return res.status(404).send("Produto não encontrado");
      }

      res.render("produto/edt", { produto, categorias });
    } catch (erro) {
      console.error("Erro ao carregar edição:", erro);
      res.status(500).send("Erro ao carregar página de edição");
    }
  }

  // 📌 Editar produto
  async edit(req, res) {
    try {
      const { nome, descricao, preco, categoria, quantidade } = req.body;

      const updateData = { nome, descricao, preco, categoria, quantidade };

      if (req.file) {
        updateData.imagemBase64 = req.file.buffer.toString("base64");
        updateData.mimetype = req.file.mimetype;
      }

      await Produto.findByIdAndUpdate(req.params.id, updateData);
      res.redirect("/produto/lst");
    } catch (erro) {
      console.error("Erro ao editar:", erro);
      res.status(500).send("Erro ao salvar edição do produto");
    }
  }

  // 📌 Excluir produto
  async delete(req, res) {
    try {
      await Produto.findByIdAndDelete(req.params.id);
      res.redirect("/produto/lst");
    } catch (erro) {
      console.error("Erro ao excluir produto:", erro);
      res.status(500).send("Erro ao excluir o produto");
    }
  }

}
