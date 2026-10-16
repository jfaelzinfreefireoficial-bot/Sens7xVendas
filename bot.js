const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const fs = require('fs');
const path = require('path');
const { MercadoPagoConfig, Payment } = require('mercadopago');

console.log('🚀 Iniciando bot...');

// ========== VARIÁVEIS DE AMBIENTE ==========
const BOT_TOKEN = process.env.BOT_TOKEN;
const RENDER_URL = process.env.RENDER_EXTERNAL_URL;
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID || '';
const PORT = process.env.PORT || 10000;
const PASTA_BASE = './discord_dados/';
const WEBHOOK_PATH = '/mercado-pago-webhook-discord';

// ========== INICIALIZAR SERVIDOR ==========
const app = express();
app.use(express.json());

// ========== INICIALIZAR MERCADO PAGO ==========
const mpClient = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN });

// ========== GARANTIR PASTA EXISTE ==========
if (!fs.existsSync(PASTA_BASE)) {
  fs.mkdirSync(PASTA_BASE, { recursive: true });
}

// ========== FUNÇÕES DE ARQUIVO ==========
function lerArquivo(caminho, padrao) {
  try {
    if (!fs.existsSync(caminho)) return padrao;
    return JSON.parse(fs.readFileSync(caminho, 'utf8'));
  } catch { return padrao; }
}
function salvarArquivo(caminho, dados) {
  fs.writeFileSync(caminho, JSON.stringify(dados, null, 2));
}

// ========== PRODUTOS ==========
const PRODUTOS = lerArquivo(path.join(PASTA_BASE, 'produtos.json'), {
  "sens7x-freefire": {
    id: "sens7x-freefire",
    nome: "SENS7X PACK COMPLETO",
    valor: 5.00,
    estoque: 500,
    descricao: "O melhor pack de sensibilidade para Free Fire!",
    linkEntrega: "https://seu-link-aqui.com"
  }
});

let pedidos = lerArquivo(path.join(PASTA_BASE, 'pedidos.json'), {});

// ========== WEBSERVER ==========
app.get('/', (req, res) => {
  res.send('✅ SENS7X VENDAS — Discord Bot Online');
});

// ========== WEBHOOK MERCADO PAGO ==========
app.post(WEBHOOK_PATH, async (req, res) => {
  try {
    const { type, data } = req.body;
    if (type === 'payment') {
      const payment = await new Payment(mpClient).get({ id: data.id });
      const pedidoId = payment.external_reference;
      const pedido = pedidos[pedidoId];
      
      if (payment.status === 'approved' && pedido && !pedido.entregue) {
        const produto = PRODUTOS[pedido.produtoId];
        pedido.entregue = true;
        salvarArquivo(path.join(PASTA_BASE, 'pedidos.json'), pedidos);
        
        console.log(`✅ PAGAMENTO CONFIRMADO — Pedido: ${pedidoId} | Usuário: ${pedido.discordUserId}`);
      }
    }
    res.sendStatus(200);
  } catch (erro) {
    console.error('❌ Erro Webhook:', erro.message);
    res.sendStatus(500);
  }
});

// ========== INICIAR SERVIDOR NA PORTA ==========
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
  console.log(`✅ Webhook: ${RENDER_URL}${WEBHOOK_PATH}`);
});

console.log('✅ Bot pronto para uso!');