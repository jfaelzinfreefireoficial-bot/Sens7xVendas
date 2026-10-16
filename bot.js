const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const express = require('express');
const fs = require('fs');
const path = require('path');
const { MercadoPagoConfig, Payment } = require('mercadopago');

console.log('🚀 Iniciando bot...');

// ========== VARIÁVEIS DE AMBIENTE ==========
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || process.env.BOT_TOKEN;
const RENDER_URL = process.env.RENDER_EXTERNAL_URL;
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
const PORT = process.env.PORT || 10000;
const PASTA_BASE = './dados_bot/';
const WEBHOOK_PATH = '/mercado-pago-webhook-discord';

// ========== SEU VÍDEO DE BOAS-VINDAS ==========
const VIDEO_BEMVINDO_URL = "https://files.catbox.moe/ntf9me.mp4";

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

// ========== SEUS PRODUTOS — IGUAL AO TELEGRAM ==========
const PRODUTOS = lerArquivo(path.join(PASTA_BASE, 'produtos.json'), {
  "sens7x-freefire": {
    id: "sens7x-freefire",
    nome: "SENS7X PACK FREE FIRE",
    valor: 5.00,
    estoque: 500,
    descricao: "VENHA ADQUIRIR O MELHOR PACK DE SENSIBILIDADE FREE FIRE!\n\n✅ Sensibilidade completa\n✅ Funciona em qualquer celular\n✅ Mais precisão e menos tiros perdidos\n✅ Resultado já na primeira partida!",
    linkImagem: "https://files.catbox.moe/5eehlb.png",
    linkEntrega: "https://seu-link-aqui.com"
  }
  // ↓↓↓ ADICIONE MAIS PRODUTOS AQUI SEGUINDO A MESMA ESTRUTURA ↓↓↓
  /*
  "nome-do-produto": {
    id: "nome-do-produto",
    nome: "Nome Exibido do Produto",
    valor: 5.00,
    estoque: 100,
    descricao: "Descrição do produto",
    linkImagem: "URL da imagem",
    linkEntrega: "URL de entrega após compra"
  },
  */
});

let pedidos = lerArquivo(path.join(PASTA_BASE, 'pedidos.json'), {});

// ========== INICIALIZAR MERCADO PAGO ==========
const mpClient = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN });

// ========== INICIALIZAR SERVIDOR EXPRESS ==========
const app = express();
app.use(express.json());

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
        
        console.log(`✅ PAGAMENTO CONFIRMADO — ${pedidoId} | Usuário: ${pedido.discordUserId}`);
        
        // 📩 ENVIAR PRODUTO NO PRIVADO
        try {
          const usuario = await client.users.fetch(pedido.discordUserId);
          const embedEntrega = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('✅ PAGAMENTO CONFIRMADO!')
            .setDescription(`Olá! Aqui está seu produto:\n\n📦 **${produto.nome}**\n🔽 Download/Acesso:`)
            .addFields({ name: '🔗 Link do Produto', value: produto.linkEntrega })
            .setFooter({ text: 'Obrigado pela preferência! SENS7X VENDAS ✅' })
            .setTimestamp();
          
          await usuario.send({ embeds: [embedEntrega] });
          
          // ⚠️ DIMINUIR ESTOQUE APÓS ENTREGA
          if (PRODUTOS[pedido.produtoId].estoque > 0) {
            PRODUTOS[pedido.produtoId].estoque -= 1;
            salvarArquivo(path.join(PASTA_BASE, 'produtos.json'), PRODUTOS);
          }
          
        } catch (e) {
          console.log('❌ Não consegui enviar mensagem privada:', e.message);
        }
      }
    }
    res.sendStatus(200);
  } catch (erro) {
    console.error('❌ Erro Webhook:', erro.message);
    res.sendStatus(500);
  }
});

// ========== INICIALIZAR BOT DISCORD ==========
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ]
});

client.on('ready', () => {
  console.log(`✅ Bot conectado como: ${client.user.tag}`);
  client.user.setActivity('!loja — Confira nossos produtos 🛒', { type: 3 });
});

const prefix = '!';

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;
  
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const comando = args.shift()?.toLowerCase();
  
  // 🎉 /start — BOAS-VINDAS COM VÍDEO
  if (comando === 'start' || comando === 'inicio') {
    const embedBemvindo = new EmbedBuilder()
      .setColor('#FF0055')
      .setTitle('👋 Bem-vindo(a) à SENS7X MAX!')
      .setDescription(
        "É um prazer enorme receber você aqui! 🎉\n" +
        "Você chegou no lugar certo pra turbinar sua jogabilidade no Free Fire!\n\n" +
        "✅ Packs de sensibilidade otimizados\n" +
        "✅ Atualizações constantes\n" +
        "✅ Suporte sempre que precisar\n\n" +
        "Digite `!loja` para ver nossos produtos!"
      )
      .setFooter({ text: 'SENS7X VENDAS — O melhor para seu jogo! 🔥' });
    
    await message.channel.send({ embeds: [embedBemvindo] });
    return;
  }
  
  // 🛒 /loja — MOSTRAR PRODUTOS
  if (comando === 'loja' || comando === 'produtos') {
    const embed = new EmbedBuilder()
      .setColor('#FF0055')
      .setTitle('🛒 SENS7X VENDAS — Nossa Loja')
      .setDescription("Escolha um produto abaixo:\n\nDigite `!comprar código-do-produto`");
    
    let temProdutoDisponivel = false;
    
    for (const [id, prod] of Object.entries(PRODUTOS)) {
      if (prod.estoque > 0) {
        embed.addFields({
          name: `📦 ${prod.nome} — R$ ${prod.valor.toFixed(2).replace('.', ',')}`,
          value: `Estoque: ${prod.estoque} | Comprar: \`!comprar ${id}\``
        });
        temProdutoDisponivel = true;
      } else {
        embed.addFields({
          name: `❌ ${prod.nome} — INDISPONÍVEL`,
          value: "Produto temporariamente esgotado."
        });
      }
    }
    
    if (!temProdutoDisponivel) {
      embed.setDescription("😔 No momento não temos produtos disponíveis. Volte em breve!");
    }
    
    await message.channel.send({ embeds: [embed] });
    return;
  }
  
  // 💳 /comprar — GERAR PAGAMENTO
  if (comando === 'comprar') {
    const produtoId = args[0]?.toLowerCase();
    const produto = PRODUTOS[produtoId];
    
    if (!produto) {
      return message.reply("❌ Produto não encontrado! Use `!loja` para ver os disponíveis.");
    }
    if (produto.estoque <= 0) {
      return message.reply("❌ Esse produto está esgotado no momento. Aguarde reposição!");
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
        valor: produto.valor,
        entregue: false,
        paymentId: payment.id,
        data: new Date().toISOString()
      };
      salvarArquivo(path.join(PASTA_BASE, 'pedidos.json'), pedidos);
      
      const embedPagamento = new EmbedBuilder()
        .setColor('#0099FF')
        .setTitle(`💳 Pagamento — ${produto.nome}`)
        .setDescription(
          `✅ Solicitado por: **${message.author.username}**\n` +
          `💰 Valor: **R$ ${produto.valor.toFixed(2).replace('.', ',')}**\n\n` +
          `💳 Pague via Pix abaixo:`
        )
        .addFields(
          { name: '📋 Pix Copia e Cola', value: `\`\`\`${pixCode || 'Não disponível'}\`\`\`` },
          { name: '🔗 Link de Pagamento', value: ticketUrl || 'Aguarde...' }
        )
        .setFooter({ 
          text: `⚠️ Somente ${message.author.username} deve usar este pagamento. Após confirmação, produto será enviado por mensagem privada!` 
        })
        .setTimestamp();
      
      await message.channel.send({ embeds: [embedPagamento] });
      
    } catch (erro) {
      console.error('❌ Erro ao criar pagamento:', erro);
      message.reply("❌ Erro ao gerar pagamento. Tente novamente em alguns instantes!");
    }
    return;
  }
  
  // ℹ️ /sobre
  if (comando === 'sobre' || comando === 'informacoes') {
    const embed = new EmbedBuilder()
      .setColor('#00CC66')
      .setTitle('ℹ️ Sobre nós')
      .setDescription(
        "👋 Olá! Somos a **SENS7X VENDAS**!\n\n" +
        "Especializados em packs de sensibilidade otimizados para Free Fire.\n" +
        "✅ Produto digital — entrega automática após pagamento\n" +
        "✅ Suporte rápido e dedicado\n" +
        "✅ Pagamento seguro via Mercado Pago\n\n" +
        "Obrigado por confiar em nós! 💙"
      )
      .setTimestamp();
    
    await message.channel.send({ embeds: [embed] });
    return;
  }
});

// ========== INICIAR SERVIDOR ==========
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
  console.log(`✅ Webhook: ${RENDER_URL}${WEBHOOK_PATH}`);
});

// ========== FAZER LOGIN NO BOT ==========
client.login(BOT_TOKEN).catch(err => {
  console.error('❌ Erro ao conectar bot:', err.message);
});