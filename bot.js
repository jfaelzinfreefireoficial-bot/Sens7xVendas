const { Client, GatewayIntentBits, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const express = require('express');
const fs = require('fs');
const path = require('path');
const { MercadoPagoConfig, Payment } = require('mercadopago');

console.log('🚀 Iniciando bot Discord — SENS7X VENDAS...');

// ========== VARIÁVEIS DE AMBIENTE ==========
const BOT_TOKEN = process.env.BOT_TOKEN;
const RENDER_URL = process.env.RENDER_EXTERNAL_URL;
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID || '';
const PORT = process.env.PORT || 10000;
const PASTA_BASE = './discord_dados/';
const WEBHOOK_PATH = '/mercado-pago-webhook-discord';

// ========== GARANTIR PASTA EXISTE ==========
if (!fs.existsSync(PASTA_BASE)) fs.mkdirSync(PASTA_BASE, { recursive: true });

// ========== FUNÇÕES DE ARQUIVO ==========
const PRODUTOS_ARQUIVO = `${PASTA_BASE}produtos.json`;
const PEDIDOS_ARQUIVO = `${PASTA_BASE}pedidos.json`;
const USUARIOS_GERAR_ARQUIVO = `${PASTA_BASE}usuarios_gerar.json`;

function lerArquivo(caminho, padrao) {
  try {
    if (!fs.existsSync(caminho)) return padrao;
    return JSON.parse(fs.readFileSync(caminho, 'utf8'));
  } catch { return padrao; }
}
function salvarArquivo(caminho, dados) {
  fs.writeFileSync(caminho, JSON.stringify(dados, null, 2));
}

// ========== SEUS PRODUTOS ==========
let PRODUTOS = lerArquivo(PRODUTOS_ARQUIVO, {
  "sens7x-freefire": {
    id: "sens7x-freefire",
    nome: "SENS7X FREE FIRE",
    valor: 2.79,
    estoque: 500,
    categoria: "sensibilidade",
    descricao: "VENHA ADQUIRIR O MELHOR PACK DE SENSIBILIDADE FREE FIRE!\n\n✅ Sensibilidade completa\n✅ Funciona em qualquer celular\n✅ Mais precisão e menos tiros perdidos\n✅ Resultado já na primeira partida!\n\nNão fique pra trás, melhore seu jogo HOJE!",
    imagemUrl: "https://i.postimg.cc/TwBc5qzw/1791720026046.jpg",
    linkEntrega: "https://www.mediafire.com/file/sjnmojlnhi0kga5/REAL_SENS7X_PRO_-_FREE_FIRE_CLIENTE.7z/file"
  },
  "nubank-editavel": {
    id: "nubank-editavel",
    nome: "NUBANK ENTRETENIMENTO",
    valor: 11.99,
    estoque: 500,
    categoria: "aplicativos",
    descricao: "AVISO IMPORTANTE: Apenas para entretenimento. Não tem valor real. Uso por conta e risco.\n\nVenha adquirir o melhor aplicativo completo para entretenimento",
    imagemUrl: "https://i.postimg.cc/nzkvYxVt/NUBANK.png",
    linkEntrega: "https://www.mediafire.com/file/06tr2nywlodysjb/NUBANK_EDIT_C3%81VEL_CLIENTE_%C2%AEFAEL_VENDAS_OFICIAL.7z/file"
  },
  "inter-editavel": {
    id: "inter-editavel",
    nome: "INTER ENTRETENIMENTO",
    valor: 11.99,
    estoque: 80,
    categoria: "aplicativos",
    descricao: "AVISO IMPORTANTE: Apenas para entretenimento. Não tem valor real. Uso por conta e risco.",
    imagemUrl: "https://i.postimg.cc/0Q7zZY6r/download-(1).png",
    linkEntrega: "https://www.mediafire.com/file/uf1nhkkev88v380/INTER_EDIT_C3%81VEL_CLIENTE_%C2%AEFAEL_VENDAS_OFICIAL.7z/file"
  },
  "likes100-id": {
    id: "likes100-id",
    nome: "LIKES ID 100",
    valor: 8.00,
    estoque: 500,
    categoria: "likes",
    descricao: "AVISO Importante — venha solicitar seus likes rápido e seguro!",
    imagemUrl: "https://i.postimg.cc/HkmDGHwd/IMG-20261015-WA0012.jpg",
    linkEntrega: "https://wa.me/5571992297916"
  },
  "likes200-id": {
    id: "likes200-id",
    nome: "LIKES ID 200",
    valor: 10.00,
    estoque: 500,
    categoria: "likes",
    descricao: "AVISO Importante — venha solicitar seus likes rápido e seguro!",
    imagemUrl: "https://i.postimg.cc/HkmDGHwd/IMG-20261015-WA0012.jpg",
    linkEntrega: "https://wa.me/5571992297916"
  },
  "likes300-id": {
    id: "likes300-id",
    nome: "LIKES ID 300",
    valor: 15.00,
    estoque: 500,
    categoria: "likes",
    descricao: "AVISO Importante — venha solicitar seus likes rápido e seguro!",
    imagemUrl: "https://i.postimg.cc/HkmDGHwd/IMG-20261015-WA0012.jpg",
    linkEntrega: "https://wa.me/5571992297916"
  },
  "likes400-id": {
    id: "likes400-id",
    nome: "LIKES ID 400",
    valor: 20.00,
    estoque: 500,
    categoria: "likes",
    descricao: "AVISO Importante — venha solicitar seus likes rápido e seguro!",
    imagemUrl: "https://i.postimg.cc/HkmDGHwd/IMG-20261015-WA0012.jpg",
    linkEntrega: "https://wa.me/5571992297916"
  },
  "likes500-id": {
    id: "likes500-id",
    nome: "LIKES ID 500",
    valor: 30.00,
    estoque: 500,
    categoria: "likes",
    descricao: "AVISO Importante — venha solicitar seus likes rápido e seguro!",
    imagemUrl: "https://i.postimg.cc/HkmDGHwd/IMG-20261015-WA0012.jpg",
    linkEntrega: "https://wa.me/5571992297916"
  },
  "likes600-id": {
    id: "likes600-id",
    nome: "LIKES ID 600",
    valor: 40.00,
    estoque: 500,
    categoria: "likes",
    descricao: "AVISO Importante — venha solicitar seus likes rápido e seguro!",
    imagemUrl: "https://i.postimg.cc/HkmDGHwd/IMG-20261015-WA0012.jpg",
    linkEntrega: "https://wa.me/5571992297916"
  },
  "likes700-id": {
    id: "likes700-id",
    nome: "LIKES ID 700",
    valor: 50.00,
    estoque: 500,
    categoria: "likes",
    descricao: "AVISO Importante — venha solicitar seus likes rápido e seguro!",
    imagemUrl: "https://i.postimg.cc/HkmDGHwd/IMG-20261015-WA0012.jpg",
    linkEntrega: "https://wa.me/5571992297916"
  },
  "likes800-id": {
    id: "likes800-id",
    nome: "LIKES ID 800",
    valor: 60.00,
    estoque: 500,
    categoria: "likes",
    descricao: "AVISO Importante — venha solicitar seus likes rápido e seguro!",
    imagemUrl: "https://i.postimg.cc/HkmDGHwd/IMG-20261015-WA0012.jpg",
    linkEntrega: "https://wa.me/5571992297916"
  },
  "likes900-id": {
    id: "likes900-id",
    nome: "LIKES ID 900",
    valor: 70.00,
    estoque: 500,
    categoria: "likes",
    descricao: "AVISO Importante — venha solicitar seus likes rápido e seguro!",
    imagemUrl: "https://i.postimg.cc/HkmDGHwd/IMG-20261015-WA0012.jpg",
    linkEntrega: "https://wa.me/5571992297916"
  },
  "likes1000-id": {
    id: "likes1000-id",
    nome: "LIKES ID 1000",
    valor: 90.00,
    estoque: 500,
    categoria: "likes",
    descricao: "AVISO Importante — venha solicitar seus likes rápido e seguro!",
    imagemUrl: "https://i.postimg.cc/HkmDGHwd/IMG-20261015-WA0012.jpg",
    linkEntrega: "https://wa.me/5571992297916"
  }
});

const CATEGORIAS = {
  sensibilidade: { nome: "MELHORES PACK SENSIBILIDADE FREE FIRE", descricao: "desempenho, resultado e qualidade" },
  aplicativos: { nome: "APLICATIVOS CLIENTE", descricao: "ilimitados" },
  likes: { nome: "LIKES ID FREE FIRE", descricao: "Entregas imediatas após pagamento" }
};

let pedidos = lerArquivo(PEDIDOS_ARQUIVO, {});
let usuariosGerar = lerArquivo(USUARIOS_GERAR_ARQUIVO, {});

// ========== FUNÇÕES AUXILIARES ==========
function diminuirEstoque(produtoId) {
  if (PRODUTOS[produtoId] && PRODUTOS[produtoId].estoque > 0) {
    PRODUTOS[produtoId].estoque -= 1;
    salvarArquivo(PRODUTOS_ARQUIVO, PRODUTOS);
    return true;
  }
  return false;
}

function gerarSensibilidade() {
  const geral = Math.floor(Math.random() * 101) + 100;
  const pontoVermelho = Math.floor(Math.random() * 61) + 40;
  const mira2x = Math.floor(Math.random() * 81) + 60;
  const mira4x = Math.floor(Math.random() * 81) + 60;
  const awm = Math.floor(Math.random() * 101) + 50;
  const olhadinha = Math.floor(Math.random() * 81) + 40;
  const dpi = [320, 360, 390, 411, 450, 480, 520, 576, 600, 720][Math.floor(Math.random() * 10)];
  const botaoAtirar = Math.floor(Math.random() * 31) + 45;
  return `Geral: ${geral}\nPonto vermelho: ${pontoVermelho}\nMira 2x: ${mira2x}\nMira 4x: ${mira4x}\nAwm: ${awm}\nOlhadinha: ${olhadinha}\nDPI recomendado: ${dpi}\nTamanho Botão Atirar: ${botaoAtirar}%\n\nAviso: Sensibilidade gerada aleatoriamente. Ajuste conforme seu celular e seu estilo de jogo. Bom jogo!`;
}

// ========== FUNÇÃO BASE64 → ARQUIVO TEMPORÁRIO ==========
function salvarQrCodeBase64(base64String, caminhoSaida) {
  const buffer = Buffer.from(base64String, 'base64');
  fs.writeFileSync(caminhoSaida, buffer);
  return caminhoSaida;
}

// ========== INICIALIZAR MERCADO PAGO ==========
if (!MP_ACCESS_TOKEN || !BOT_TOKEN || !RENDER_URL) {
  console.error('❌ Faltam variáveis de ambiente!');
  process.exit(1);
}
const mpClient = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN });

// ========== INICIALIZAR SERVIDOR EXPRESS ==========
const app = express();
app.use(express.json());

// ========== WEBHOOK ==========
app.post(WEBHOOK_PATH, async (req, res) => {
  try {
    const { type, data } = req.body;
    if (type === 'payment') {
      const paymentId = data.id;
      console.log('🔔 Notificação — Pagamento:', paymentId);
      
      const payment = await new Payment(mpClient).get({ id: paymentId });
      const pedidoId = payment.external_reference;
      const pedido = pedidos[pedidoId];
      
      if (payment.status === 'approved' && pedido && !pedido.entregue) {
        const usuarioId = pedido.discordUserId;
        
        if (pedido.tipo === 'gerar_sensibilidade') {
          const sensibilidade = gerarSensibilidade();
          try {
            const usuario = await client.users.fetch(usuarioId);
            await usuario.send(`✅ **Pagamento confirmado!** Aqui está sua sensibilidade:\n\n\`\`\`${sensibilidade}\`\`\`\n\nObrigado pela preferência! 🎉`);
          } catch (e) {
            console.log('Não consegui enviar mensagem privada:', e.message);
          }
          usuariosGerar[usuarioId] = { podeGerar: true, ultimaGeracao: new Date().toISOString() };
          salvarArquivo(USUARIOS_GERAR_ARQUIVO, usuariosGerar);
        } else {
          const produto = PRODUTOS[pedido.produtoId];
          diminuirEstoque(pedido.produtoId);
          
          try {
            const usuario = await client.users.fetch(usuarioId);
            const embedEntrega = new EmbedBuilder()
              .setColor('#00FF00')
              .setTitle('✅ PAGAMENTO CONFIRMADO!')
              .setDescription(`Parabéns pela compra!\n\n📦 **${produto.nome}**\n🔽 Aqui está seu produto:`)
              .addFields({ name: '🔗 Link de Entrega', value: produto.linkEntrega })
              .setFooter({ text: 'Obrigado pela preferência — SENS7X VENDAS ✅\nCanal: youtube.com/@fael_100k_yt' })
              .setTimestamp();
            await usuario.send({ embeds: [embedEntrega] });
          } catch (e) {
            console.log('❌ Não consegui enviar mensagem privada:', e.message);
          }
        }
        
        pedidos[pedidoId].entregue = true;
        salvarArquivo(PEDIDOS_ARQUIVO, pedidos);
        console.log(`✅ Pedido ${pedidoId} entregue!`);
      }
    }
    res.sendStatus(200);
  } catch (erro) {
    console.error('❌ Erro Webhook:', erro.message);
    res.sendStatus(500);
  }
});

app.get('/', (req, res) => res.send('✅ SENS7X VENDAS — Discord Bot Online'));

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

// ========== COMANDOS ==========
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;
  
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const comando = args.shift()?.toLowerCase();
  
  // 🎉 !start
  if (comando === 'start' || comando === 'inicio') {
    const embed = new EmbedBuilder()
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
    await message.channel.send({ embeds: [embed] });
    return;
  }
  
  // 🛒 !loja
  if (comando === 'loja' || comando === 'categorias') {
    let mensagem = '🏪 **NOSSA LOJA — ESCOLHA UMA CATEGORIA:**\n\n';
    for (const [chave, cat] of Object.entries(CATEGORIAS)) {
      mensagem += `**${cat.nome}**\n${cat.descricao}\nVer produtos: \`!cat_${chave}\`\n\n`;
    }
    mensagem += '──────────────────────\nPesquise diretamente: `!buscar nome-do-produto`';
    await message.channel.send(mensagem);
    return;
  }
  
  // 📂 !cat_
  if (comando.startsWith('cat_')) {
    const catChave = comando.replace('cat_', '');
    const categoria = CATEGORIAS[catChave];
    
    if (!categoria) {
      return message.reply("❌ Categoria não encontrada! Use `!loja` para ver todas.");
    }
    
    const produtosCategoria = Object.values(PRODUTOS).filter(p => p.categoria === catChave && p.estoque > 0);
    let embed = new EmbedBuilder().setColor('#FF0055').setTitle(`📦 ${categoria.nome}`);
    
    if (produtosCategoria.length === 0) {
      embed.setDescription("😔 Nenhum produto disponível no momento. Volte mais tarde!");
    } else {
      for (const prod of produtosCategoria) {
        const avisoEstoque = prod.estoque <= 5 
          ? `⚠️ Ultimas ${prod.estoque} unidades!`
          : `Em estoque: ${prod.estoque}`;
        embed.addFields({
          name: `${prod.nome} — R$ ${prod.valor.toFixed(2).replace('.', ',')}`,
          value: `${avisoEstoque}\nComprar: \`!comprar ${prod.id}\``
        });
      }
    }
    await message.channel.send({ embeds: [embed] });
    return;
  }
  
  // 🔍 !buscar
  if (comando === 'buscar') {
    const termo = args.join(' ').toLowerCase().trim();
    if (!termo) return message.reply("Uso: `!buscar nome-do-produto`");
    
    const resultados = Object.values(PRODUTOS).filter(p => 
      p.estoque > 0 && (p.nome.toLowerCase().includes(termo) || p.descricao.toLowerCase().includes(termo))
    );
    
    if (resultados.length === 0) return message.reply("❌ Nenhum produto encontrado. Tente outra palavra!");
    
    let resposta = `🔍 **${resultados.length} produto(s) encontrado(s):**\n\n`;
    resultados.forEach(prod => {
      resposta += `📦 **${prod.nome}** — R$ ${prod.valor.toFixed(2).replace('.', ',')}\nComprar: \`!comprar ${prod.id}\`\n\n`;
    });
    await message.channel.send(resposta);
    return;
  }
  
  // 💳 !comprar — COM QR CODE VISUAL ✅
  if (comando === 'comprar') {
    const produtoId = args[0]?.toLowerCase().trim();
    const produto = PRODUTOS[produtoId];
    
    if (!produto) return message.reply("❌ Produto não encontrado! Use `!loja` para ver os disponíveis.");
    if (produto.estoque <= 0) return message.reply("❌ Esse produto está esgotado no momento.");
    
    const pedidoId = `discord_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    const valorFormatado = produto.valor.toFixed(2).replace('.', ',');
    
    try {
      console.log(`🔄 Gerando pagamento para: ${produto.nome}`);
      
      const payment = await new Payment(mpClient).create({
        body: {
          transaction_amount: produto.valor,
          description: produto.nome,
          payment_method_id: 'pix',
          external_reference: pedidoId,
          notification_url: `${RENDER_URL}${WEBHOOK_PATH}`,
          payer: { email: `${message.author.id}@discord.com` }
        }
      });
      
      const pixCode = payment.point_of_interaction?.transaction_data?.qr_code;
      const qrCodeBase64 = payment.point_of_interaction?.transaction_data?.qr_code_base64;
      const ticketUrl = payment.point_of_interaction?.transaction_data?.ticket_url;
      
      if (!pixCode) {
        console.log('⚠️ Resposta MP:', JSON.stringify(payment, null, 2));
        return message.reply("❌ O Mercado Pago não retornou o Pix. Tente novamente em instantes!");
      }
      
      pedidos[pedidoId] = {
        id: pedidoId,
        discordUserId: message.author.id,
        produtoId: produtoId,
        produtoNome: produto.nome,
        linkEntrega: produto.linkEntrega,
        entregue: false,
        paymentId: payment.id,
        data: new Date().toISOString()
      };
      salvarArquivo(PEDIDOS_ARQUIVO, pedidos);
      
      const avisoEstoque = produto.estoque <= 5 
        ? `⚠️ Ultimas ${produto.estoque} unidades!`
        : `Em estoque: ${produto.estoque}`;
      
      // ✅ CRIAR E ANEXAR IMAGEM DO QR CODE
      let anexoQrCode = null;
      let caminhoQrCode = '';
      
      if (qrCodeBase64) {
        caminhoQrCode = `${PASTA_BASE}qrcode_${pedidoId}.png`;
        salvarQrCodeBase64(qrCodeBase64, caminhoQrCode);
        anexoQrCode = new AttachmentBuilder(caminhoQrCode, { name: 'qrcode.png' });
      }
      
      // 📢 MENSAGEM COM QR CODE + PIX NO CANAL PÚBLICO
      const embedPagamento = new EmbedBuilder()
        .setColor('#0099FF')
        .setTitle(`💳 Pagamento — ${produto.nome}`)
        .setThumbnail(produto.imagemUrl)
        .setDescription(
          `✅ Solicitado por: **${message.author.username}**\n` +
          `💰 Valor: **R$ ${valorFormatado}**\n` +
          `${avisoEstoque}\n\n` +
          `📷 **Escaneie o QR Code** ou copie o Pix abaixo:`
        );
      
      if (anexoQrCode) {
        embedPagamento.setImage('attachment://qrcode.png');
      }
      
      embedPagamento
        .addFields(
          { name: '📋 Pix Copia e Cola', value: `\`\`\`${pixCode}\`\`\`` },
          { name: '🔗 Link de Pagamento', value: ticketUrl }
        )
        .setFooter({ 
          text: `⚠️ Somente ${message.author.username} recebe o produto. Após pagamento, confira sua mensagem privada!` 
        })
        .setTimestamp();
      
      const mensagemEnviada = await message.channel.send({ 
        embeds: [embedPagamento],
        files: anexoQrCode ? [anexoQrCode] : []
      });
      
      // 🧹 Remover arquivo temporário da imagem após enviar
      if (caminhoQrCode && fs.existsSync(caminhoQrCode)) {
        setTimeout(() => {
          try { fs.unlinkSync(caminhoQrCode); } catch {}
        }, 60000); // Apaga em 1 minuto
      }
      
      console.log(`✅ Pedido criado: ${pedidoId} — ${produto.nome}`);
      
    } catch (erro) {
      console.error('❌ ERRO AO GERAR PAGAMENTO:');
      console.error('Mensagem:', erro.message);
      if (erro.response?.data) console.error('Resposta MP:', JSON.stringify(erro.response.data, null, 2));
      message.reply("❌ Erro ao gerar pagamento. Tente novamente em alguns instantes!");
    }
    return;
  }
  
  // 🎁 !gerar
  if (comando === 'gerar') {
    const usuario = usuariosGerar[message.author.id];
    
    if (usuario && usuario.podeGerar) {
      const sensibilidade = gerarSensibilidade();
      return message.author.send(`✨ **Sua Sensibilidade:**\n\n\`\`\`${sensibilidade}\`\`\``)
        .then(() => message.reply("✅ Enviado no privado!"))
        .catch(() => message.reply("❌ Não consegui enviar. Ative suas mensagens privadas!"));
    }
    
    const pedidoId = `discord_gerar_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    
    try {
      const payment = await new Payment(mpClient).create({
        body: {
          transaction_amount: 1.00,
          description: 'Gerar Sensibilidade Free Fire',
          payment_method_id: 'pix',
          external_reference: pedidoId,
          notification_url: `${RENDER_URL}${WEBHOOK_PATH}`,
          payer: { email: `${message.author.id}@discord.com` }
        }
      });
      
      const pixCode = payment.point_of_interaction?.transaction_data?.qr_code;
      const qrCodeBase64 = payment.point_of_interaction?.transaction_data?.qr_code_base64;
      const ticketUrl = payment.point_of_interaction?.transaction_data?.ticket_url;
      
      pedidos[pedidoId] = {
        id: pedidoId,
        discordUserId: message.author.id,
        tipo: 'gerar_sensibilidade',
        entregue: false,
        paymentId: payment.id
      };
      salvarArquivo(PEDIDOS_ARQUIVO, pedidos);
      
      let anexoQrCode = null;
      let caminhoQrCode = '';
      
      if (qrCodeBase64) {
        caminhoQrCode = `${PASTA_BASE}qrcode_${pedidoId}.png`;
        salvarQrCodeBase64(qrCodeBase64, caminhoQrCode);
        anexoQrCode = new AttachmentBuilder(caminhoQrCode, { name: 'qrcode.png' });
      }
      
      const embed = new EmbedBuilder()
        .setColor('#9933FF')
        .setTitle('🎲 Gerar Sensibilidade Premium')
        .setDescription(
          `Valor: **R$ 1,00**\n\n` +
          `Escaneie o QR Code ou use o Pix abaixo para receber sua sensibilidade única! ✨`
        );
      
      if (anexoQrCode) embed.setImage('attachment://qrcode.png');
      
      embed
        .addFields(
          { name: '📋 Pix Copia e Cola', value: `\`\`\`${pixCode}\`\`\`` },
          { name: '🔗 Link', value: ticketUrl }
        )
        .setFooter({ text: 'Após pagar, receba automaticamente por mensagem privada!' });
      
      await message.channel.send({ 
        embeds: [embed],
        files: anexoQrCode ? [anexoQrCode] : []
      });
      
      if (caminhoQrCode && fs.existsSync(caminhoQrCode)) {
        setTimeout(() => { try { fs.unlinkSync(caminhoQrCode); } catch {} }, 60000);
      }
      
    } catch (erro) {
      console.error('Erro:', erro.message);
      message.reply("❌ Erro ao gerar. Tente novamente!");
    }
    return;
  }
  
  // ℹ️ Comandos de informação
  if (comando === 'infcompras' || comando === 'compras') {
    await message.channel.send(
      '📋 **SOBRE AS COMPRAS:**\n\n' +
      'Como comprar?\n' +
      '`!loja` → escolha categoria → `!comprar nome-do-produto` → escaneie o QR Code ou copie o Pix → pague → receba automaticamente por mensagem privada!\n\n' +
      '✅ Pagamento seguro via Mercado Pago\n' +
      '✅ Entrega imediata após confirmação\n' +
      '❓ Não recebeu? Aguarde 1-2 minutos ou contate o suporte!'
    );
    return;
  }
  
  if (comando === 'infproduto' || comando === 'produtosinfo') {
    await message.channel.send(
      '📦 **SOBRE OS PRODUTOS:**\n\n' +
      '✅ Funciona no Android\n' +
      '❌ Não funciona no emulador\n' +
      '✅ Sem risco de banimento (apenas sensibilidade)\n' +
      '📺 Canal oficial: youtube.com/@fael_100k_yt\n\n' +
      'Dúvidas? Fale com o vendedor!'
    );
    return;
  }
  
  if (comando === 'pay' || comando === 'pagamento') {
    await message.channel.send(
      '💳 **SOBRE O PAGAMENTO:**\n\n' +
      '✅ Aceitamos apenas Pix\n' +
      '✅ Escaneie o QR Code ou copie a chave Pix\n' +
      '✅ Processado pelo Mercado Pago — seguro e confiável\n' +
      '✅ Entrega automática assim que confirmado o pagamento\n' +
      '⏱️ Confirmação costuma ser instantânea!\n\n' +
      'Obrigado pela confiança!'
    );
    return;
  }
  
  if (comando === 'sobre') {
    const totalVendas = Object.values(pedidos).filter(p => p.entregue).length;
    await message.channel.send(
      new EmbedBuilder()
        .setColor('#FF0055')
        .setTitle('🏪 SENS7X VENDAS')
        .setDescription('Melhores produtos e packs de sensibilidade Free Fire!')
        .addFields(
          { name: '📺 Canal YouTube', value: 'youtube.com/@fael_100k_yt' },
          { name: '📊 Produtos ativos', value: `${Object.values(PRODUTOS).filter(p => p.estoque > 0).length}` },
          { name: '💰 Vendas realizadas', value: `${totalVendas}` }
        )
        .setTimestamp()
    );
    return;
  }
});

// ========== INICIAR SERVIDOR ==========
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
  console.log(`✅ Webhook Discord: ${RENDER_URL}${WEBHOOK_PATH}`);
  console.log('✅ Sistema de pagamentos Mercado Pago conectado!');
  console.log('✅ QR Code visual ativado!');
  console.log('✅ Produtos carregados:', Object.keys(PRODUTOS).length);
});

client.login(BOT_TOKEN).catch(err => {
  console.error('❌ Erro ao conectar bot:', err.message);
});