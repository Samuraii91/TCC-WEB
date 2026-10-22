// Entrada da Vercel: reutiliza a mesma aplicação Express do index.js.
// O index.js só abre porta/autoping quando não está rodando na Vercel.
import app from '../index.js';

export default app;
