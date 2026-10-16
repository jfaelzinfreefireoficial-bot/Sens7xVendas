const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const express = require('express');
const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando bot...');

try {
  const { MercadoPagoConfig, Payment } = require('mercadopago');
  console.log('✅ Mercado Pago carregado');
} catch(e) {
  console.log('⚠️ Mercado Pago não carregou:', e.message);
}

// ========== CONFIGURAÇÕES ==========
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
const RENDER_URL = process.env.RENDER_EXTERNAL_URL;
const PORT = process.env.PORT || 3000;
const PASTA_BASE = './discord_dados/';
const WEBHOOK_PATH = '/mercado-pago-webhook-discord';

console.log('📋 Verificando variáveis...');
console.log('DISCORD_TOKEN:', DISCORD_TOKEN ? '✅ Presente' : '❌ FALTANDO');
console.log('MP_ACCESS_TOKEN:', MP_ACCESS_TOKEN ? '✅ Presente' : '❌ FALTANDO');
console.log('RENDER_URL:', RENDER_URL || 'Não definida');

// ========== INICIALIZAR PASTAS ==========
try {
  if (!fs.existsSync(PASTA_BASE)) fs.mkdirSync(PASTA_BASE, { recursive: true });
  console.log('✅ Pasta de dados criada');
} catch(e) {
  console.log('⚠️ Erro ao criar pasta:', e.message);
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
    descricao: "O melhor pack de sensibilidade!",
    linkEntrega: "https://seu-link-aqui.com"
  }
});

let pedidos = lerArquivo(path.join(PASTA_BASE, 'pedidos.json'), {});

// ========== INICIALIZAR ==========
let mpClient;
try {
  const { MercadoPagoConfig } = require('mercadopago');
  mpClient = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN });
  console.log('✅ Mercado Pago conectado');
} catch(e) {
  console.log('⚠️ Erro MP:', e.message);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent
  ]
});

const app = express();
app.use(express.json());

// ========== FUNÇÃO: DIMINUIR ESTOQUE ==========
function diminuirEstoque(produtoId) {
  if (PRODUTOS[produtoId] && PRODUTOS[produtoId].estoque > 0) {
    PRODUTOS[produtoId].estoque -= 1;
    salvarArquivo(path.join(PASTA_BASE, 'produtos.json'), PRODUTOS);
    return true;
  }
  return false;
}

// ========== WEBHOOK ==========
app.post(WEBHOOK_PATH, async (req, res) => {
  res.sendStatus(200);
});

app.get('/', (req, res) => {
  res.send('SENS7X VENDAS — Discord Bot Online ✅');
});

// ========== BOT EVENTOS ==========
client.on('ready', () => {
  console.log(`✅ Bot conectado como: ${client.user.tag}`);
  client.user.setActivity('Use !loja para comprar! 🛒', { type: 3 });
});

client.on('error', (error) => {
  console.log('❌ Erro no bot:', error.message);
});

// ========== COMANDOS ==========
const prefix = '!';

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;
  
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const comando = args.shift()?.toLowerCase();
  
  if (comando === 'loja' || comando === 'produtos') {
    const embed = new EmbedBuilder()
      .setColor('#FF0055')
      .setTitle('🛒 SENS7X VENDAS — LOJA')
      .setDescription('Escolha um produto abaixo');
    
    for (const [id, prod] of Object.entries(PRODUTOS)) {
      if (prod.estoque > 0) {
        embed.addFields({
          name: `${prod.nome} — R$ ${prod.valor.toFixed(2)}`,
          value: `Estoque: ${prod.estoque}`
        });
      }
    }
    
    await message.channel.send({ embeds: [embed] });
  }
  
  else if (comando === 'sobre') {
    await message.channel.send('🏪 SENS7X VENDAS — Melhores produtos Free Fire! youtube.com/@fael_100k_yt');
  }
});

// ========== INICIAR SERVIDOR E BOT ==========
app.listen(PORT, () => {
  console.log(`🌐 Servidor rodando na porta ${PORT}`);
});

if (!DISCORD_TOKEN) {
  console.log('❌ ERRO: DISCORD_TOKEN não está definido!');
  process.exit(1);
}

client.login(DISCORD_TOKEN)
  .then(() => console.log('✅ Bot logado no Discord!'))
  .catch(err => {
    console.log('❌ ERRO ao logar no Discord:', err.message);
    process.exit(1);
  });