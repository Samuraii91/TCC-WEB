import Categoria from "../models/Categoria.js";

export default class CategoriaController {
  // Abrir formulário de adicionar
  async openAdd(req, res) {
    try {
      res.render("categoria/add");
    } catch (erro) {
      console.error("Erro ao abrir formulário de categoria:", erro);
      res.status(500).send("Erro ao abrir o formulário de categoria.");
    }
  }

  // Adicionar categoria
  async add(req, res) {
    try {
      const { nome, descricao } = req.body;

      let imagemBase64 = null;
      let mimetype = null;

      // Se o usuário enviou uma imagem
      if (req.file) {
        imagemBase64 = req.file.buffer.toString("base64");
        mimetype = req.file.mimetype;
      }

      await Categoria.create({
        nome,
        descricao,
        imagemBase64,
        mimetype
      });

      res.redirect("/categoria/lst");
    } catch (erro) {
      console.error("Erro ao cadastrar categoria:", erro);
      res.status(500).send("Erro ao cadastrar a categoria.");
    }
  }

  // Listar categorias
  async list(req, res) {
    try {
      const categorias = await Categoria.find();
      res.render("categoria/lst", { categorias });
    } catch (erro) {
      console.error("Erro ao listar categorias:", erro);
      res.status(500).send("Erro ao carregar a lista de categorias.");
    }
  }

  // Abrir formulário de edição
  async openEdit(req, res) {
    try {
      const categoria = await Categoria.findById(req.params.id);

      if (!categoria) {
        return res.status(404).send("Categoria não encontrada");
      }

      res.render("categoria/edt", { categoria });
    } catch (erro) {
      console.error("Erro ao carregar edição de categoria:", erro);
      res.status(500).send("Erro ao carregar a página de edição.");
    }
  }

  // Editar categoria
  async edit(req, res) {
    try {
      const { nome, descricao } = req.body;

      const dadosAtualizar = { nome, descricao };

      // Se uma nova imagem for enviada, substitui
      if (req.file) {
        dadosAtualizar.imagemBase64 = req.file.buffer.toString("base64");
        dadosAtualizar.mimetype = req.file.mimetype;
      }

      await Categoria.findByIdAndUpdate(req.params.id, dadosAtualizar, {
        runValidators: true
      });

      res.redirect("/categoria/lst");
    } catch (erro) {
      console.error("Erro ao editar categoria:", erro);
      res.status(500).send("Erro ao salvar a edição da categoria.");
    }
  }

  // Deletar categoria
  async delete(req, res) {
    try {
      await Categoria.findByIdAndDelete(req.params.id);
      res.redirect("/categoria/lst");
    } catch (erro) {
      console.error("Erro ao excluir categoria:", erro);
      res.status(500).send("Erro ao excluir a categoria.");
    }
  }
}
