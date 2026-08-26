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

  // 📌 Relatório de estoque (imprimir / salvar em PDF)
  async relatorio(req, res) {
    try {
      const limiteBaixo = 5;
      const filtroCategoria = req.query.categoria || "";
      const filtroEstoque = req.query.estoque || "";

      const categorias = await Categoria.find().sort({ nome: 1 });

      const filtroMongo = {};
      if (filtroCategoria) {
        filtroMongo.categoria = filtroCategoria;
      }

      let produtos = await Produto.find(filtroMongo).populate("categoria").sort({ nome: 1 });

      if (filtroEstoque === "falta") {
        produtos = produtos.filter(p => Number(p.quantidade) === 0);
      } else if (filtroEstoque === "baixo") {
        produtos = produtos.filter(p => Number(p.quantidade) > 0 && Number(p.quantidade) <= limiteBaixo);
      } else if (filtroEstoque === "problema") {
        produtos = produtos.filter(p => Number(p.quantidade) <= limiteBaixo);
      } else if (filtroEstoque === "normal") {
        produtos = produtos.filter(p => Number(p.quantidade) > limiteBaixo);
      }

      const totalProdutos = produtos.length;
      const emFalta = produtos.filter(p => Number(p.quantidade) === 0).length;
      const baixoEstoque = produtos.filter(p => Number(p.quantidade) > 0 && Number(p.quantidade) <= limiteBaixo).length;

      res.render("produto/relatorio", {
        produtos,
        limiteBaixo,
        totalProdutos,
        emFalta,
        baixoEstoque,
        categorias,
        filtroCategoria,
        filtroEstoque,
        geradoEm: new Date()
      });
    } catch (erro) {
      console.error("Erro ao gerar relatório de estoque:", erro);
      res.status(500).send("Erro ao gerar o relatório de estoque");
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
