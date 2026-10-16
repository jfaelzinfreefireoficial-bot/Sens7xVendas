const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const express = require('express');
const fs = require('fs');
const path = require('path');
const { MercadoPagoConfig, Payment } = require('mercadopago');

console.log('🚀 Iniciando bot...');

// ========== CONFIGURAÇÕES ==========
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
const RENDER_URL = process.env.RENDER_EXTERNAL_URL;
const PORT = process.env.PORT || 3000;
const PASTA_BASE = './discord_dados/';
const WEBHOOK_PATH = '/mercado-pago-webhook-discord';

// ========== INICIALIZAR PASTAS ==========
if (!fs.existsSync(PASTA_BASE)) fs.mkdirSync(PASTA_BASE, { recursive: true });

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
    descricao: "O melhor pack de sensibilidade! Mais tiros na cabeça, melhor mira!",
    linkEntrega: "https://seu-link-aqui.com"
  }
});

let pedidos = lerArquivo(path.join(PASTA_BASE, 'pedidos.json'), {});

// ========== INICIALIZAR ==========
const mpClient = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN });
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

// ========== WEBHOOK — CONFIRMAÇÃO DE PAGAMENTO ==========
app.post(WEBHOOK_PATH, async (req, res) => {
  try {
    const { type, data } = req.body;
    if (type === 'payment') {
      const payment = await new Payment(mpClient).get({ id: data.id });
      const pedidoId = payment.external_reference;
      const pedido = pedidos[pedidoId];
      
      if (payment.status === 'approved' && pedido && !pedido.entregue) {
        const produto = PRODUTOS[pedido.produtoId];
        diminuirEstoque(pedido.produtoId);
        
        try {
          const usuario = await client.users.fetch(pedido.discordUserId);
          await usuario.send({
            embeds: [
              new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('✅ PAGAMENTO CONFIRMADO!')
                .setDescription(`Parabéns pela compra!\n\n**${produto.nome}**\n\n🔽 Seu produto:`)
                .addFields({ name: '📥 Download', value: produto.linkEntrega })
                .setFooter({ text: 'Obrigado pela confiança — SENS7X VENDAS' })
                .setTimestamp()
            ]
          });
        } catch (e) {
          console.log('Não foi possível enviar mensagem:', e.message);
        }
        
        pedidos[pedidoId].entregue = true;
        salvarArquivo(path.join(PASTA_BASE, 'pedidos.json'), pedidos);
        console.log(`✅ Pedido ${pedidoId} entregue para ${pedido.discordUserId}`);
      }
    }
    res.sendStatus(200);
  } catch (erro) {
    console.error('Erro webhook:', erro.message);
    res.sendStatus(500);
  }
});

app.get('/', (req, res) => {
  res.send('SENS7X VENDAS — Discord Bot Online ✅');
});

// ========== BOT PRONTO ==========
client.on('ready', () => {
  console.log(`✅ Bot conectado como: ${client.user.tag}`);
  client.user.setActivity('Use !loja para comprar! 🛒', { type: 3 });
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
      .setDescription('Escolha um produto abaixo e digite `!comprar nome`');
    
    for (const [id, prod] of Object.entries(PRODUTOS)) {
      if (prod.estoque > 0) {
        embed.addFields({
          name: `${prod.nome} — R$ ${prod.valor.toFixed(2)}`,
          value: `Estoque: ${prod.estoque} | Comprar: \`!comprar ${id}\``
        });
      }
    }
    
    await message.channel.send({ embeds: [embed] });
  }
  
  else if (comando === 'comprar') {
    const produtoId = args[0];
    const produto = PRODUTOS[produtoId];
    
    if (!produto) {
      return message.reply('❌ Produto não encontrado! Use `!loja` para ver os disponíveis.');
    }
    if (produto.estoque <= 0) {
      return message.reply('❌ Produto esgotado no momento. Volte mais tarde!');
    }
    
    const pedidoId = `discord_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    
    try {
      const payment = await new Payment(mpClient).create({
        body: {
          transaction_amount: produto.valor,
          description: `Discord — ${produto.nome}`,
          payment_method_id: 'pix',
          external_reference: pedidoId,
          notification_url: `${RENDER_URL}${WEBHOOK_PATH}`,
          payer: { email: `${message.author.id}@discord` }
        }
      });
      
      const pixCode = payment.point_of_interaction?.transaction_data?.qr_code;
      const ticketUrl = payment.point_of_interaction?.transaction_data?.ticket_url;
      
      pedidos[pedidoId] = {
        id: pedidoId,
        discordUserId: message.author.id,
        produtoId: produtoId,
        produtoNome: produto.nome,
        linkEntrega: produto.linkEntrega,
        valor: produto.valor,
        entregue: false,
        paymentId: payment.id,
        data: new Date().toISOString()
      };
      salvarArquivo(path.join(PASTA_BASE, 'pedidos.json'), pedidos);
      
      const embed = new EmbedBuilder()
        .setColor('#0099FF')
        .setTitle(`💳 Comprando: ${produto.nome}`)
        .setDescription(`✅ Pagamento gerado para **${message.author.username}**\n**Valor:** R$ ${produto.valor.toFixed(2)}\n\n✅ Pague com Pix abaixo:`)
        .addFields(
          { name: '📋 Código Copia e Cola', value: `\`\`\`${pixCode || 'Acesse o link abaixo'}\`\`\`` },
          { name: '🔗 Link de Pagamento', value: ticketUrl || 'Acesse o link do Mercado Pago' }
        )
        .setFooter({ text: `Apenas ${message.author.username} pode usar este pagamento • Após pagar, receba o produto por mensagem privada!` })
        .setTimestamp();
      
      // 📢 Envia NO CANAL PÚBLICO
      await message.channel.send({ embeds: [embed] });
      
    } catch (erro) {
      console.error('Erro:', erro);
      message.reply('❌ Erro ao gerar pagamento. Tente novamente mais tarde!');
    }
  }
  
  else if (comando === 'ajuda' || comando === 'comandos') {
    const embed = new EmbedBuilder()
      .setColor('#00FF99')
      .setTitle('📖 Comandos Disponíveis')
      .addFields(
        { name: '`!loja`', value: 'Ver todos os produtos disponíveis' },
        { name: '`!comprar nome-do-produto`', value: 'Gerar código de pagamento' },
        { name: '`!sobre`', value: 'Sobre nós e informações' }
      );
    await message.channel.send({ embeds: [embed] });
  }
  
  else if (comando === 'sobre') {
    await message.channel.send({
      embeds: [new EmbedBuilder()
        .setColor('#FF0055')
        .setTitle('🏪 SENS7X VENDAS')
        .setDescription('Melhores produtos e packs de sensibilidade Free Fire!')
        .addFields(
          { name: '📱 Canal YouTube', value: 'youtube.com/@fael_100k_yt' },
          { name: '💬 Suporte', value: 'Contate-nos no privado' }
        )
        .setTimestamp()
      ]
    });
  }
});

client.login(DISCORD_TOKEN);

console.log('🚀 Bot iniciando...');