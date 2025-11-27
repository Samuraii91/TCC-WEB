import Categoria from "../models/Categoria.js";

export default class CategoriaController {
  // Abrir formulário de adicionar
  async openAdd(req, res) {
    res.render("categoria/add");
  }

  // Adicionar categoria
  async add(req, res) {
    const { nome } = req.body;
    await Categoria.create({ nome });
    res.redirect("/categoria/lst");
  }

  // Listar categorias
  async list(req, res) {
    const categorias = await Categoria.find();
    res.render("categoria/lst", { categorias });
  }

  // Abrir formulário de edição
  async openEdit(req, res) {
    const categoria = await Categoria.findById(req.params.id);
    res.render("categoria/edt", { categoria });
  }

  // Editar categoria
  async edit(req, res) {
    const { nome } = req.body;
    await Categoria.findByIdAndUpdate(req.params.id, { nome });
    res.redirect("/categoria/lst");
  }

  // Deletar categoria
  async delete(req, res) {
    await Categoria.findByIdAndDelete(req.params.id);
    res.redirect("/categoria/lst");
  }
}
