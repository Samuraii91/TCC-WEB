import Produto from "../models/Produto.js";
import Categoria from "../models/Categoria.js";

export default class ProdutoController {

  async openAdd(req, res) {
    const categorias = await Categoria.find();
    res.render("produto/add", { categorias });
  }

  async add(req, res) {
    const { nome, descricao, preco, categoria } = req.body;

    await Produto.create({
      nome,
      descricao,
      preco,
      categoria,
      imagemBase64: req.file ? req.file.buffer.toString("base64") : null,
      mimetype: req.file ? req.file.mimetype : null,
    });

    res.redirect("/produto/lst");
  }

  async lst(req, res) {
    const produtos = await Produto.find().populate("categoria");
    res.render("produto/lst", { produtos });
  }

  async openEdit(req, res) {
    const produto = await Produto.findById(req.params.id);
    const categorias = await Categoria.find();
    res.render("produto/edt", { produto, categorias });
  }

  async edit(req, res) {
    const { nome, descricao, preco, categoria } = req.body;

    const updateData = { nome, descricao, preco, categoria };

    if (req.file) {
      updateData.imagemBase64 = req.file.buffer.toString("base64");
      updateData.mimetype = req.file.mimetype;
    }

    await Produto.findByIdAndUpdate(req.params.id, updateData);
    res.redirect("/produto/lst");
  }

  async delete(req, res) {
    await Produto.findByIdAndDelete(req.params.id);
    res.redirect("/produto/lst");
  }

}
