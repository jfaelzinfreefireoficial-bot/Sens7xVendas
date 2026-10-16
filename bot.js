const { Client, GatewayIntentBits, EmbedBuilder, AttachmentBuilder, ChannelType } = require('discord.js');
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
const SEU_WHATSAPP_NUMERO = '5551993767174';
const PORT = process.env.PORT || 10000;
const PASTA_BASE = './discord_dados/';
const WEBHOOK_PATH = '/mercado-pago-webhook-discord';

// ========== SUA IMAGEM DO BOT ✅ ==========
const IMAGEM_LOGO_URL = "https://i.postimg.cc/RZkVwpYk/1791726554389.png";

// ========== CONFIGURAÇÃO DOS CANAIS ==========
const CANAIS = {
  regras: 'regras-da-loja',
  verProdutos: 'ver-produtos',
  pagamentos: 'pagamentos',
  duvidas: 'duvidas-compras',
  suporte: 'suporte',
  avaliacoes: 'avaliacoes',
  anuncios: 'anuncios-oficiais',
  promocoes: 'promocoes',
  batepapo: 'bate-papo',
  conquistas: 'conquistas'
};

// ========== COMANDOS PERMITIDOS POR CANAL ==========
const COMANDOS_POR_CANAL = {
  [CANAIS.verProdutos]: ['start', 'inicio', 'loja', 'categorias', 'buscar', 'sobre', 'ajuda'],
  [CANAIS.pagamentos]: ['comprar', 'ajuda'],
  [CANAIS.duvidas]: ['infcompras', 'compras', 'infproduto', 'produtosinfo', 'pay', 'pagamento', 'ajuda'],
  [CANAIS.batepapo]: ['gerar', 'ajuda']
};

// ========== MENSAGENS DE BOAS-VINDAS POR CANAL ==========
const MENSAGENS_CANAIS = {
  [CANAIS.verProdutos]: {
    titulo: '🛒 Bem-vindo à Loja!',
    descricao: `Seja bem-vindo(a) à **SENS7X MAX!** 🎉\n\nÉ um prazer enorme receber você aqui! Você chegou no lugar certo pra turbinar sua jogabilidade no Free Fire!\n\n✅ Packs de sensibilidade otimizados\n✅ Atualizações constantes\n✅ Suporte sempre que precisar\n\n📋 **Comandos disponíveis:**\n\`!start\` — Início\n\`!loja\` — Ver categorias\n\`!buscar nome\` — Procurar produto\n\`!sobre\` — Sobre nós\n\`!ajuda\` — Todos os comandos`
  },
  [CANAIS.pagamentos]: {
    titulo: '💳 Canal de Pagamentos',
    descricao: `Seja bem-vindo(a) ao canal de pagamentos! 💳\n\n⚠️ Use SOMENTE os comandos abaixo aqui:\n\n📋 **Comandos disponíveis:**\n\`!comprar nome-do-produto\` — Gerar pagamento de um produto\n\`!ajuda\` — Ver todos os comandos\n\n⚠️ Escaneie o QR Code, pague e confira sua mensagem privada com nosso WhatsApp!`
  },
  [CANAIS.duvidas]: {
    titulo: '❓ Dúvidas e Informações',
    descricao: `Bem-vindo(a)! Aqui você encontra todas as informações sobre nossas compras e produtos! 💙\n\n📋 **Comandos disponíveis:**\n\`!infcompras\` — Como funciona a compra\n\`!infproduto\` — Sobre os produtos\n\`!pay\` — Sobre formas de pagamento\n\`!ajuda\` — Ver todos os comandos`
  },
  [CANAIS.batepapo]: {
    titulo: '💭 Bate-Papo da Comunidade',
    descricao: `Bem-vindo(a)! Converse com outros jogadores! Troque experiências e dicas! 🎮🔥\n\n📋 **Comandos disponíveis:**\n\`!gerar\` — Gerar sensibilidade diária\n\`!ajuda\` — Ver todos os comandos`
  },
  [CANAIS.suporte]: {
    titulo: '🆘 Canal de Suporte',
    descricao: `Bem-vindo(a)! Fale conosco diretamente aqui ou pelo WhatsApp:\n📲 [Clique aqui](https://wa.me/5551993767174)\n\nPor favor, seja claro em sua mensagem e aguarde nosso retorno! 💙`
  },
  [CANAIS.avaliacoes]: {
    titulo: '⭐ Avaliações',
    descricao: `Bem-vindo(a)! Gostou do produto? Deixe sua avaliação aqui! Sua opinião é muito importante para nós! ❤️`
  },
  [CANAIS.anuncios]: {
    titulo: '📢 Anúncios Oficiais',
    descricao: `Fique por dentro de novidades, novos produtos e atualizações! 🔥`
  },
  [CANAIS.promocoes]: {
    titulo: '🎁 Promoções',
    descricao: `Aqui você encontra nossas ofertas especiais! Aproveite! 🎉`
  },
  [CANAIS.conquistas]: {
    titulo: '🏆 Conquistas',
    descricao: `Compartilhe seus resultados e mostre que evoluiu com nossas sensibilidades! Parabéns pelo progresso! 🔥🏆`
  }
};

// ========== GARANTIR PASTA EXISTE ==========
if (!fs.existsSync(PASTA_BASE)) fs.mkdirSync(PASTA_BASE, { recursive: true });

// ========== FUNÇÕES DE ARQUIVO ==========
const PRODUTOS_ARQUIVO = `${PASTA_BASE}produtos.json`;
const PEDIDOS_ARQUIVO = `${PASTA_BASE}pedidos.json`;
const USUARIOS_GERAR_ARQUIVO = `${PASTA_BASE}usuarios_gerar.json`;
const LEMBRETES_ARQUIVO = `${PASTA_BASE}lembretes.json`;
const ATIVIDADE_ARQUIVO = `${PASTA_BASE}atividade.json`;
const USUARIOS_CANAIS = `${PASTA_BASE}usuarios_canais.json`;

function lerArquivo(caminho, padrao) {
  try {
    if (!fs.existsSync(caminho)) return padrao;
    return JSON.parse(fs.readFileSync(caminho, 'utf8'));
  } catch { return padrao; }
}
function salvarArquivo(caminho, dados) {
  fs.writeFileSync(caminho, JSON.stringify(dados, null, 2));
}

let usuariosQueViramCanal = lerArquivo(USUARIOS_CANAIS, {});

// ========== SEUS PRODUTOS ==========
let PRODUTOS = lerArquivo(PRODUTOS_ARQUIVO, {
  "sens7x-freefire": {
    id: "sens7x-freefire",
    nome: "SENS7X FREE FIRE",
    valor: 2.79,
    estoque: 500,
    categoria: "sensibilidade",
    descricao: "VENHA ADQUIRIR O MELHOR PACK DE SENSIBILIDADE FREE FIRE!\n\n✅ Sensibilidade completa\n✅ Funciona em qualquer celular\n✅ Mais precisão e menos tiros perdidos\n✅ Resultado já na primeira partida!\n\nNão fique pra trás, melhore seu jogo HOJE!",
    imagemUrl: "https://i.postimg.cc/TwBc5qzw/1791720026046.jpg"
  },
  "likes100-id": {
    id: "likes100-id",
    nome: "LIKES ID 100",
    valor: 8.00,
    estoque: 500,
    categoria: "likes",
    descricao: "Solicite seus likes rápido e seguro!",
    imagemUrl: "https://i.postimg.cc/HkmDGHwd/IMG-20261015-WA0012.jpg"
  }
});

const CATEGORIAS = {
  sensibilidade: { nome: "MELHORES PACK SENSIBILIDADE FREE FIRE", descricao: "desempenho, resultado e qualidade" },
  aplicativos: { nome: "APLICATIVOS CLIENTE", descricao: "ilimitados" },
  likes: { nome: "LIKES ID FREE FIRE", descricao: "Entregas imediatas após pagamento" }
};

let pedidos = lerArquivo(PEDIDOS_ARQUIVO, {});
let usuariosGerar = lerArquivo(USUARIOS_GERAR_ARQUIVO, {});
let lembretes = lerArquivo(LEMBRETES_ARQUIVO, {});
let atividadeUsuarios = lerArquivo(ATIVIDADE_ARQUIVO, {});

// ========== FUNÇÃO: ENVIAR MENSAGEM DE BOAS-VINDAS DO CANAL ==========
async function enviarBoasVindasCanal(canal, membro) {
  if (!canal || canal.type !== ChannelType.GuildText) return;
  if (membro.user.bot) return;

  const canalNome = canal.name.toLowerCase();
  const canalInfo = Object.entries(CANAIS).find(([chave, nome]) => canalNome.includes(nome));
  
  if (!canalInfo) return;
  
  const [chave] = canalInfo;
  const mensagem = MENSAGENS_CANAIS[chave];
  if (!mensagem) return;

  const idUnico = `${membro.id}_${canal.id}`;
  const agora = Date.now();
  
  // Só mostra 1x a cada 12 horas por pessoa por canal, não enche o chat
  if (usuariosQueViramCanal[idUnico] && (agora - usuariosQueViramCanal[idUnico]) < 12 * 60 * 60 * 1000) {
    return;
  }
  
  usuariosQueViramCanal[idUnico] = agora;
  salvarArquivo(USUARIOS_CANAIS, usuariosQueViramCanal);

  const embed = new EmbedBuilder()
    .setColor('#FF0055')
    .setTitle(mensagem.titulo)
    .setDescription(mensagem.descricao)
    .setThumbnail(IMAGEM_LOGO_URL)
    .setFooter({ text: 'SENS7X VENDAS — O melhor para seu jogo! 🔥' });

  await canal.send({ embeds: [embed] }).catch(() => {});
}

// ========== FUNÇÃO: VERIFICAR CANAL PERMITIDO ==========
function verificarCanalPermitido(canalNome, comando) {
  for (const [canalPermitido, comandos] of Object.entries(COMANDOS_POR_CANAL)) {
    if (canalNome.includes(canalPermitido)) {
      return { 
        permitido: comandos.includes(comando), 
        canalCorreto: true,
        comandosPermitidos: comandos,
        canalChave: canalPermitido
      };
    }
  }
  return { permitido: false, canalCorreto: false, comandosPermitidos: [] };
}

// ========== FUNÇÃO: MOSTRAR COMANDOS DISPONÍVEIS DO CANAL ==========
async function mostrarComandosDoCanal(message, canalNome) {
  const canalInfo = Object.entries(CANAIS).find(([chave, nome]) => canalNome.includes(nome));
  if (!canalInfo) return null;
  
  const [chave] = canalInfo;
  const info = MENSAGENS_CANAIS[chave];
  const comandos = COMANDOS_POR_CANAL[chave] || [];
  
  const embed = new EmbedBuilder()
    .setColor('#FF0055')
    .setTitle(info.titulo)
    .setDescription(info.descricao)
    .setThumbnail(IMAGEM_LOGO_URL)
    .setFooter({ text: 'SENS7X VENDAS — O melhor para seu jogo! 🔥' });
  
  return embed;
}

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

function salvarQrCodeBase64(base64String, caminhoSaida) {
  const buffer = Buffer.from(base64String, 'base64');
  fs.writeFileSync(caminhoSaida, buffer);
  return caminhoSaida;
}

function gerarLinkWhatsapp(nomeCliente, nomeProduto) {
  const mensagem = encodeURIComponent(`Olá! Acabei de comprar ${nomeProduto} pelo Discord! Meu usuário é: ${nomeCliente}`);
  return `https://wa.me/${SEU_WHATSAPP_NUMERO}?text=${mensagem}`;
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

// ========== WEBHOOK — ENTREGA POR WHATSAPP ==========
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
            const linkWhatsApp = gerarLinkWhatsapp(usuario.username, produto.nome);
            
            const embedEntrega = new EmbedBuilder()
              .setColor('#25D366')
              .setTitle('✅ PAGAMENTO CONFIRMADO!')
              .setThumbnail(IMAGEM_LOGO_URL)
              .setDescription(
                `Olá, cliente **${usuario.username}**! 🎉\n\n` +
                `Acesse nosso link do WhatsApp abaixo, confirme com o administrador dono o seu pedido e informe: **${produto.nome}**\n\n` +
                `📲 [👉 Clique aqui para falar conosco](${linkWhatsApp})\n\n` +
                `⚠️ **AVISO:** Não enviamos o seu produto em público para evitar roubos de produtos (links, APK e ambos). Enviamos o seu produto somente para o solicitante que pagou pelo produto.\n\n` +
                `Obrigado pela confiança, compra e referência! ❤️\n` +
                `Deixe sua avaliação após receber seu produto! 📦`
              )
              .setFooter({ text: 'SENS7X VENDAS — Obrigado pela preferência! ✅' })
              .setTimestamp();
            
            await usuario.send({ embeds: [embedEntrega] });
            console.log(`✅ Link WhatsApp enviado para: ${usuario.username}`);
          } catch (e) {
            console.log('❌ Não consegui enviar mensagem privada:', e.message);
          }
        }
        
        pedidos[pedidoId].entregue = true;
        salvarArquivo(PEDIDOS_ARQUIVO, pedidos);
        console.log(`✅ Pedido ${pedidoId} concluído!`);
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
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildVoiceStates
  ]
});

client.on('ready', () => {
  console.log(`✅ Bot conectado como: ${client.user.tag}`);
  client.user.setActivity('!loja — Confira nossos produtos 🛒', { type: 3 });
  
  // ⏰ Verificar inatividade a cada 60 segundos
  setInterval(() => verificarInatividade(), 60 * 1000);
});

const prefix = '!';

// ========== DETECTAR QUANDO ALGUÉM ENVIA PRIMEIRA MENSAGEM NO CANAL ==========
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  
  // Envia boas-vindas + comandos na primeira vez que alguém fala no canal
  const idUnico = `${message.author.id}_${message.channel.id}`;
  if (!usuariosQueViramCanal[idUnico]) {
    const embed = await mostrarComandosDoCanal(message, message.channel.name.toLowerCase());
    if (embed) {
      await message.channel.send({ embeds: [embed] }).catch(() => {});
      usuariosQueViramCanal[idUnico] = Date.now();
      salvarArquivo(USUARIOS_CANAIS, usuariosQueViramCanal);
    }
  }
  
  // Registrar atividade do usuário
  atividadeUsuarios[message.author.id] = {
    ultimaAtividade: Date.now(),
    canalId: message.channel.id
  };
  salvarArquivo(ATIVIDADE_ARQUIVO, atividadeUsuarios);
  
  // Se não for comando, ignorar
  if (!message.content.startsWith(prefix)) return;
  
  const canalNome = message.channel.name.toLowerCase();
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const comando = args.shift()?.toLowerCase();
  
  // ✅ VERIFICAR SE COMANDO É PERMITIDO NESTE CANAL
  const verificacao = verificarCanalPermitido(canalNome, comando);
  
  if (!verificacao.permitido && verificacao.canalCorreto) {
    const comandosLista = verificacao.comandosPermitidos.map(c => `\`!${c}\``).join(' • ');
    
    const embedErro = new EmbedBuilder()
      .setColor('#FF6600')
      .setTitle('⚠️ Comando errado para este canal')
      .setDescription(
        `Neste canal você pode usar apenas:\n${comandosLista}\n\n` +
        `Digite \`!ajuda\` para ver todos os canais e comandos!`
      )
      .setThumbnail(IMAGEM_LOGO_URL);
    
    return message.channel.send({ embeds: [embedErro] });
  }
  
  if (!verificacao.canalCorreto) {
    // Canal não identificado — mostra ajuda geral
    if (comando === 'ajuda') {
      const embed = new EmbedBuilder()
        .setColor('#FF0055')
        .setTitle('📋 TODOS OS CANAIS E COMANDOS')
        .setThumbnail(IMAGEM_LOGO_URL)
        .addFields(
          { name: '🛒 ver-produtos', value: '`!start` `!loja` `!buscar` `!sobre` `!ajuda`', inline: false },
          { name: '💳 pagamentos', value: '`!comprar nome-do-produto` `!ajuda`', inline: false },
          { name: '❓ duvidas-compras', value: '`!infcompras` `!infproduto` `!pay` `!ajuda`', inline: false },
          { name: '💭 bate-papo', value: '`!gerar` `!ajuda`', inline: false }
        )
        .setFooter({ text: 'Use os comandos apenas no canal correto! ✅' });
      return message.channel.send({ embeds: [embed] });
    }
    return;
  }
  
  // 🎯 !ajuda — Mostra comandos DO CANAL ATUAL
  if (comando === 'ajuda') {
    const embed = await mostrarComandosDoCanal(message, canalNome);
    if (embed) return message.channel.send({ embeds: [embed] });
    return;
  }
  
  // 🎉 !start
  if (comando === 'start' || comando === 'inicio') {
    const embed = new EmbedBuilder()
      .setColor('#FF0055')
      .setTitle('👋 Bem-vindo(a) à SENS7X MAX!')
      .setThumbnail(IMAGEM_LOGO_URL)
      .setDescription(
        "É um prazer enorme receber você aqui! 🎉\n" +
        "Você chegou no lugar certo pra turbinar sua jogabilidade no Free Fire!\n\n" +
        "✅ Packs de sensibilidade otimizados\n" +
        "✅ Atualizações constantes\n" +
        "✅ Suporte sempre que precisar\n\n" +
        "Digite `!loja` para ver nossos produtos!"
      )
      .setFooter({ text: 'SENS7X VENDAS — O melhor para seu jogo! 🔥' });
    return message.channel.send({ embeds: [embed] });
  }
  
  // 🛒 !loja
  if (comando === 'loja' || comando === 'categorias') {
    let mensagem = '🏪 **NOSSA LOJA — ESCOLHA UMA CATEGORIA:**\n\n';
    for (const [chave, cat] of Object.entries(CATEGORIAS)) {
      mensagem += `**${cat.nome}**\n${cat.descricao}\nVer produtos: \`!cat_${chave}\`\n\n`;
    }
    mensagem += '──────────────────────\nPesquise diretamente: `!buscar nome-do-produto`';
    return message.channel.send(mensagem);
  }
  
  // 📂 !cat_
  if (comando.startsWith('cat_')) {
    const catChave = comando.replace('cat_', '');
    const categoria = CATEGORIAS[catChave];
    
    if (!categoria) return message.reply("❌ Categoria não encontrada! Use `!loja` para ver todas.");
    
    const produtosCategoria = Object.values(PRODUTOS).filter(p => p.categoria === catChave && p.estoque > 0);
    let embed = new EmbedBuilder().setColor('#FF0055').setTitle(`📦 ${categoria.nome}`).setThumbnail(IMAGEM_LOGO_URL);
    
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
    return message.channel.send({ embeds: [embed] });
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
    return message.channel.send(resposta);
  }
  
  // 💳 !comprar
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
        return message.reply("❌ O Mercado Pago não retornou o Pix. Tente novamente em instantes!");
      }
      
      pedidos[pedidoId] = {
        id: pedidoId,
        discordUserId: message.author.id,
        produtoId: produtoId,
        produtoNome: produto.nome,
        entregue: false,
        paymentId: payment.id,
        data: new Date().toISOString()
      };
      salvarArquivo(PEDIDOS_ARQUIVO, pedidos);
      
      const avisoEstoque = produto.estoque <= 5 
        ? `⚠️ Ultimas ${produto.estoque} unidades!`
        : `Em estoque: ${produto.estoque}`;
      
      let anexoQrCode = null;
      let caminhoQrCode = '';
      
      if (qrCodeBase64) {
        caminhoQrCode = `${PASTA_BASE}qrcode_${pedidoId}.png`;
        salvarQrCodeBase64(qrCodeBase64, caminhoQrCode);
        anexoQrCode = new AttachmentBuilder(caminhoQrCode, { name: 'qrcode.png' });
      }
      
      const embedPagamento = new EmbedBuilder()
        .setColor('#0099FF')
        .setTitle(`💳 Pagamento — ${produto.nome}`)
        .setThumbnail(produto.imagemUrl || IMAGEM_LOGO_URL)
        .setDescription(
          `✅ Solicitado por: **${message.author.username}**\n` +
          `💰 Valor: **R$ ${valorFormatado}**\n` +
          `${avisoEstoque}\n\n` +
          `📷 **Escaneie o QR Code** ou copie o Pix abaixo:`
        );
      
      if (anexoQrCode) embedPagamento.setImage('attachment://qrcode.png');
      
      embedPagamento
        .addFields(
          { name: '📋 Pix Copia e Cola', value: `\`\`\`${pixCode}\`\`\`` },
          { name: '🔗 Link de Pagamento', value: ticketUrl }
        )
        .setFooter({ 
          text: `⚠️ Após pagar, confira sua mensagem privada! O produto é enviado por lá.` 
        })
        .setTimestamp();
      
      await message.channel.send({ 
        embeds: [embedPagamento],
        files: anexoQrCode ? [anexoQrCode] : []
      });
      
      if (caminhoQrCode && fs.existsSync(caminhoQrCode)) {
        setTimeout(() => { try { fs.unlinkSync(caminhoQrCode); } catch {} }, 60000);
      }
      
      console.log(`✅ Pedido criado: ${pedidoId} — ${produto.nome}`);
      
    } catch (erro) {
      console.error('❌ ERRO AO GERAR PAGAMENTO:', erro.message);
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
        .setThumbnail(IMAGEM_LOGO_URL)
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
    const embed = new EmbedBuilder()
      .setColor('#0099FF')
      .setTitle('📋 SOBRE AS COMPRAS')
      .setThumbnail(IMAGEM_LOGO_URL)
      .setDescription(
        'Como comprar?\n' +
        '1️⃣ Vá em `🛒┃ver-produtos` → escolha seu produto\n' +
        '2️⃣ Vá em `💳┃pagamentos` → digite `!comprar nome-do-produto`\n' +
        '3️⃣ Escaneie o QR Code ou copie o Pix e pague\n' +
        '4️⃣ Confira sua mensagem privada com nosso link do WhatsApp!\n\n' +
        '✅ Pagamento seguro via Mercado Pago\n' +
        '⏱️ Confirmação costuma ser instantânea!\n' +
        '❓ Não recebeu? Aguarde 1-2 minutos ou contate o suporte!'
      );
    return message.channel.send({ embeds: [embed] });
  }
  
  if (comando === 'infproduto' || comando === 'produtosinfo') {
    const embed = new EmbedBuilder()
      .setColor('#0099FF')
      .setTitle('📦 SOBRE OS PRODUTOS')
      .setThumbnail(IMAGEM_LOGO_URL)
      .setDescription(
        '✅ Funciona no Android\n' +
        '❌ Não funciona no emulador\n' +
        '✅ Sem risco de banimento (apenas sensibilidade)\n' +
        '📺 Canal YouTube: youtube.com/@fael_100k_yt\n\n' +
        'Dúvidas? Fale com o vendedor pelo WhatsApp!'
      );
    return message.channel.send({ embeds: [embed] });
  }
  
  if (comando === 'pay' || comando === 'pagamento') {
    const embed = new EmbedBuilder()
      .setColor('#0099FF')
      .setTitle('💳 SOBRE O PAGAMENTO')
      .setThumbnail(IMAGEM_LOGO_URL)
      .setDescription(
        '✅ Aceitamos apenas Pix\n' +
        '✅ Escaneie o QR Code ou copie a chave Pix\n' +
        '✅ Processado pelo Mercado Pago — seguro e confiável\n' +
        '✅ Após confirmação, clique no link do WhatsApp que enviamos no privado\n' +
        '⏱️ Confirmação costuma ser instantânea!\n\n' +
        'Obrigado pela confiança!'
      );
    return message.channel.send({ embeds: [embed] });
  }
  
  if (comando === 'sobre') {
    const totalVendas = Object.values(pedidos).filter(p => p.entregue).length;
    const embed = new EmbedBuilder()
      .setColor('#FF0055')
      .setTitle('🏪 SENS7X VENDAS')
      .setThumbnail(IMAGEM_LOGO_URL)
      .setDescription('Melhores produtos e packs de sensibilidade Free Fire!')
      .addFields(
        { name: '📺 Canal YouTube', value: 'youtube.com/@fael_100k_yt' },
        { name: '📊 Produtos ativos', value: `${Object.values(PRODUTOS).filter(p => p.estoque > 0).length}` },
        { name: '💰 Vendas realizadas', value: `${totalVendas}` },
        { name: '📲 WhatsApp', value: '[Falar conosco](https://wa.me/5551993767174)' }
      )
      .setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }
});

// ========== SISTEMA DE DETECÇÃO DE ENTRADA EM CANAL DE VOZ ==========
client.on('voiceStateUpdate', async (oldState, newState) => {
  // Entrou em um canal de voz
  if (!oldState.channel && newState.channel) {
    const membro = newState.member;
    if (membro.user.bot) return;
    
    try {
      const embed = new EmbedBuilder()
        .setColor('#FF0055')
        .setTitle('🎙️ Bem-vindo ao Canal de Voz!')
        .setThumbnail(IMAGEM_LOGO_URL)
        .setDescription(
          `Olá ${membro.user.username}! 👋\n\n` +
          `Estamos felizes em tê-lo aqui! 🎉\n\n` +
          `📋 **Comandos disponíveis no Discord:**\n` +
          `\`!loja\` — Ver produtos\n` +
          `\`!ajuda\` — Todos os comandos\n\n` +
          `Se precisar de ajuda, é só chamar! 💙`
        )
        .setFooter({ text: 'SENS7X VENDAS — O melhor para seu jogo! 🔥' });
      
      await membro.send({ embeds: [embed] });
    } catch (e) {}
  }
});

// ========== SISTEMA DE LEMBRETE DE INATIVIDADE ==========
function verificarInatividade() {
  const agora = Date.now();
  const umMinuto = 60 * 1000;
  const vinteQuatroHoras = 24 * 60 * 60 * 1000;
  
  for (const [usuarioId, dados] of Object.entries(atividadeUsuarios)) {
    const tempoInativo = agora - dados.ultimaAtividade;
    const ultimoLembrete = lembretes[usuarioId] || 0;
    
    if (tempoInativo > umMinuto && (agora - ultimoLembrete) > vinteQuatroHoras) {
      lembretes[usuarioId] = agora;
      salvarArquivo(LEMBRETES_ARQUIVO, lembretes);
      
      if (dados.canalId) {
        const canal = client.channels.cache.get(dados.canalId);
        if (canal && canal.type === ChannelType.GuildText) {
          const embedLembrete = new EmbedBuilder()
            .setColor('#FF9900')
            .setTitle('⏰ Ainda precisa de ajuda?')
            .setDescription(
              `Olá! Ficou um tempinho sem ver você por aqui 😊\n\n` +
              `Se tiver dúvidas sobre como usar os comandos deste canal, é só digitar \`!ajuda\` para ver os comandos disponíveis!\n\n` +
              `Estamos aqui pra te ajudar! 💙`
            )
            .setThumbnail(IMAGEM_LOGO_URL);
          
          canal.send({ embeds: [embedLembrete] }).catch(() => {});
        }
      }
    }
  }
}

// ========== INICIAR SERVIDOR ==========
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
  console.log(`✅ Webhook Discord: ${RENDER_URL}${WEBHOOK_PATH}`);
  console.log('✅ Sistema de boas-vindas por canal: ATIVADO');
  console.log('✅ Logo do Bot em TODAS as mensagens: ATIVADO ✅');
  console.log('✅ Primeira mensagem no canal = boas-vindas + comandos: ATIVADO');
  console.log('✅ Produtos carregados:', Object.keys(PRODUTOS).length);
});

client.login(BOT_TOKEN).catch(err => {
  console.error('❌ Erro ao conectar bot:', err.message);
});