import mongoose from "mongoose";

// Prefira definir MONGODB_URI no ambiente. O fallback mantém o projeto
// funcionando localmente, mas a credencial deve ser trocada no Atlas.
const url = process.env.MONGODB_URI || "mongodb+srv://samurai_91:aluno@cluster0.35sld.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const conexao = await mongoose.connect(url);

export default conexao;
