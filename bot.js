/* ============================================================
   SENS7X VENDAS — Bot Discord Profissional
   Versão: 4.0 (Final)
   Novidades:
   - 18 anúncios programados (manhã + tarde + noite)
   - Limpeza automática a cada 24h (reenvia tudo)
   - Comandos separados por canal
   - QR Code visual + Pix
   - Entrega por WhatsApp
   - Boas-vindas com logo em todos os canais
   - Lembrete de inatividade (1x a cada 24h)
   ============================================================ */

const { Client, GatewayIntentBits, EmbedBuilder, AttachmentBuilder, ChannelType } = require('discord.js');
const express = require('express');
const fs = require('fs');
const { MercadoPagoConfig, Payment } = require('mercadopago');

console.log('🚀 Iniciando bot Discord — SENS7X VENDAS v4.0...');

// ========== VARIÁVEIS DE AMBIENTE ==========
const BOT_TOKEN = process.env.BOT_TOKEN;
const RENDER_URL = process.env.RENDER_EXTERNAL_URL;
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
const SEU_WHATSAPP_NUMERO = '5551993767174';
const PORT = process.env.PORT || 10000;
const PASTA_BASE = './discord_dados/';
const WEBHOOK_PATH = '/mercado-pago-webhook-discord';

// ========== IMAGEM DO BOT (LOGO) ==========
const IMAGEM_LOGO_URL = "https://i.postimg.cc/RZkVwpYk/1791726554389.png";

// ========== NOMES DOS CANAIS ==========
const CANAIS = {
  verProdutos: 'ver-produtos',
  pagamentos: 'pagamentos',
  duvidas: 'duvidas-compras',
  batepapo: 'bate-papo',
  suporte: 'suporte',
  avaliacoes: 'avaliacoes',
  anuncios: 'anuncios-oficiais',
  promocoes: 'promocoes',
  conquistas: 'conquistas'
};

// ========== 📢 ANÚNCIOS PROGRAMADOS (18 por dia) ==========
const MENSAGENS_PROGRAMADAS = [
  // ☀️ TURNO DA MANHÃ
  { hora: 6, minuto: 0, titulo: '🌅 BOM DIA! LOJA ABERTA!', mensagem: 'Loja aberta com sucesso!\n\nEstamos prontos pra te atender! 💙\n\n🛒 Digite `!loja` e confira nossos produtos agora!' },
  { hora: 7, minuto: 0, titulo: '🏪 ESTAMOS ABERTOS!', mensagem: 'Venha adquirir nossos produtos!\n\nQualidade, preço justo e entrega rápida! ✨\n\n🛒 `!loja` — confira aqui!' },
  { hora: 8, minuto: 0, titulo: '🔥 DESCONTOS BRABOS!', mensagem: 'Eitaa, descontos brabo! Confira!\n\nNão perca os melhores preços do mercado! 🎮💰\n\n🛒 `!loja` — corre pra garantir o seu!' },
  { hora: 9, minuto: 0, titulo: '🎁 DESCONTO DE PRIMEIRA COMPRA!', mensagem: 'Descontos na sua primeira compra!\n\nComece hoje com vantagem exclusiva! 🎉\n\n🛒 `!loja` — aproveite agora!' },
  { hora: 10, minuto: 0, titulo: '🤝 COMPARTILHE!', mensagem: 'Compartilhe nossa Loja!\n\nIndique pra aquele amigo que joga bem! Quanto mais gente, mais promoções! 🏆🔥\n\nJuntos somos mais fortes!' },
  { hora: 11, minuto: 0, titulo: '💼 SEJA UM AFILIADO!', mensagem: 'Torna-se afiliado profissional!\n\nDivulgue nossos produtos e ganhe comissão em cada venda! 💵🔥\n\nFale com um administrador e comece a lucrar hoje!' },
  { hora: 12, minuto: 0, titulo: '🌙 HORÁRIO DE DESCANSO', mensagem: 'Loja fechada até 14:00!\n\nVamos fazer uma pausinha, mas não se preocupe:\n✅ Você pode comprar a qualquer momento pelo bot\n✅ Pagamento automático 24h\n✅ Entrega automática após confirmação\n\nVoltamos às 14h! Bom descanso! ☀️✨' },

  // 🌤️ TURNO DA TARDE E NOITE
  { hora: 14, minuto: 0, titulo: '☀️ BEM-VINDO DE VOLTA!', mensagem: 'Atendimento rápido e seguro!\n\nProdutos disponíveis agora — confira tudo com tranquilidade 😊\n\n🛒 `!loja` — veja nossos produtos!' },
  { hora: 15, minuto: 0, titulo: '🏪 PRODUTOS DISPONÍVEIS!', mensagem: 'Venha adquirir nossos produtos!\n\nMelhores packs de sensibilidade com entrega rápida! 🎮✨\n\n🛒 `!loja` — confira agora!' },
  { hora: 16, minuto: 0, titulo: '✅ LOJA ATUALIZADA!', mensagem: 'Loja atualizada com sucesso!\n\nNovidades e tudo funcionando perfeitamente pra você! 🚀💙\n\n🛒 `!loja` — confira o que há de novo!' },
  { hora: 17, minuto: 0, titulo: '📞 PRECISA DE AJUDA?', mensagem: 'Reclamações? Sugestões? Dúvidas?\n\nAbra um ticket no canal de suporte! Estamos aqui pra te ouvir e resolver! 💙🤝\n\n📲 Ou nos chame no WhatsApp!' },
  { hora: 18, minuto: 0, titulo: '🛒 AINDA HOJE!', mensagem: 'Adquira nossos produtos ainda hoje!\n\nNão deixe pra amanhã o que pode te ajudar a vencer hoje! 🏆🔥\n\n🛒 `!loja` — garanta já o seu!' },
  { hora: 19, minuto: 0, titulo: '🎁 DESCONTO ESPECIAL!', mensagem: 'Descontos na sua primeira compra!\n\nComece agora com vantagem! Aproveite essa oportunidade! ✨💰\n\n🛒 `!loja` — confira!' },
  { hora: 20, minuto: 0, titulo: '📱 NOSSO GRUPO WHATSAPP!', mensagem: 'Entre para nosso grupo do WhatsApp!\n\nLá compartilhamos dicas, novidades e promoções exclusivas! 📲🔥\n\nFale com um administrador e peça o link!' },
  { hora: 21, minuto: 0, titulo: '💼 SEJA UM AFILIADO!', mensagem: 'Torna-se afiliado profissional!\n\nDivulgue, cresça e lucre com a gente! 💵🚀\n\nFale com um administrador e comece hoje mesmo!' },
  { hora: 22, minuto: 0, titulo: '🌙 QUASE FECHANDO!', mensagem: 'Loja quase fechando... ⏰\n\nAinda dá tempo de garantir seu produto! Corra antes que feche! 🏃💨\n\n🛒 `!loja` — não perca!' },
  { hora: 23, minuto: 50, titulo: '⏰ ÚLTIMA HORA!', mensagem: 'Atendimento — falta só 1 hora pra encerrar! ⏳\n\nAproveite os últimos minutos de atendimento do dia! Amanhã voltamos às 06h! 🌙✨\n\n🛒 Compre agora pelo bot — disponível 24h!' },
  { hora: 0, minuto: 0, titulo: '🔐 LOJA FECHADA — ATÉ AMANHÃ!', mensagem: 'Volte amanhã! Atendimento encerrado por hoje 🔐\n\nMas lembre-se:\n🛒 Você pode comprar a qualquer momento pelo bot\n💳 Pagamento automático 24h\n📲 Entrega automática após confirmação\n\nBoa noite e bons jogos! Até amanhã às 06h! ✨🔥' }
];

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
    titulo: '🛒 Bem-vindo à Loja SENS7X!',
    descricao: `Seja bem-vindo(a) à **SENS7X MAX!** 🎉\n\nÉ um prazer enorme receber você aqui! Você chegou no lugar certo pra turbinar sua jogabilidade no Free Fire!\n\n✅ Packs de sensibilidade otimizados\n✅ Atualizações constantes\n✅ Suporte sempre que precisar\n\n📋 **Comandos disponíveis:**\n\`!start\` — Início\n\`!loja\` — Ver categorias\n\`!buscar nome\` — Procurar produto\n\`!sobre\` — Sobre nós\n\`!ajuda\` — Ver comandos`
  },
  [CANAIS.pagamentos]: {
    titulo: '💳 Canal de Pagamentos',
    descricao: `Seja bem-vindo(a) ao canal de pagamentos! 💳\n\n⚠️ Use SOMENTE os comandos abaixo aqui:\n\n📋 **Comandos disponíveis:**\n\`!comprar nome-do-produto\` — Gerar pagamento\n\`!ajuda\` — Ver comandos\n\n⚠️ Escaneie o QR Code, pague e confira sua mensagem privada com nosso WhatsApp!`
  },
  [CANAIS.duvidas]: {
    titulo: '❓ Dúvidas e Informações',
    descricao: `Bem-vindo(a)! Aqui você encontra todas as informações sobre nossas compras e produtos! 💙\n\n📋 **Comandos disponíveis:**\n\`!infcompras\` — Como funciona a compra\n\`!infproduto\` — Sobre os produtos\n\`!pay\` — Formas de pagamento\n\`!ajuda\` — Ver comandos`
  },
  [CANAIS.batepapo]: {
    titulo: '💭 Bate-Papo da Comunidade',
    descricao: `Bem-vindo(a)! Converse com outros jogadores! Troque experiências e dicas! 🎮🔥\n\n📋 **Comandos disponíveis:**\n\`!gerar\` — Gerar sensibilidade diária\n\`!ajuda\` — Ver comandos`
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

// ========== GARANTIR PASTAS EXISTEM ==========
if (!fs.existsSync(PASTA_BASE)) fs.mkdirSync(PASTA_BASE, { recursive: true });

// ========== ARQUIVOS DE DADOS ==========
const PRODUTOS_ARQUIVO = `${PASTA_BASE}produtos.json`;
const PEDIDOS_ARQUIVO = `${PASTA_BASE}pedidos.json`;
const USUARIOS_GERAR_ARQUIVO = `${PASTA_BASE}usuarios_gerar.json`;
const LEMBRETES_ARQUIVO = `${PASTA_BASE}lembretes.json`;
const ATIVIDADE_ARQUIVO = `${PASTA_BASE}atividade.json`;
const USUARIOS_CANAIS = `${PASTA_BASE}usuarios_canais.json`;
const ULTIMO_ANUNCIO = `${PASTA_BASE}ultimo_anuncio.json`;

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
let PRODUTOS = lerArquivo(PRODUTOS_ARQUIVO, {
  "sens7x-freefire": { id: "sens7x-freefire", nome: "SENS7X FREE FIRE", valor: 2.79, estoque: 500, categoria: "sensibilidade", descricao: "O MELHOR PACK DE SENSIBILIDADE FREE FIRE!", imagemUrl: "https://i.postimg.cc/TwBc5qzw/1791720026046.jpg" },
  "nubank-editavel": { id: "nubank-editavel", nome: "NUBANK ENTRETENIMENTO", valor: 11.99, estoque: 500, categoria: "aplicativos", descricao: "Apenas para entretenimento. Não tem valor real.", imagemUrl: "https://i.postimg.cc/nzkvYxVt/NUBANK.png" },
  "inter-editavel": { id: "inter-editavel", nome: "INTER ENTRETENIMENTO", valor: 11.99, estoque: 80, categoria: "aplicativos", descricao: "Apenas para entretenimento. Não tem valor real.", imagemUrl: "https://i.postimg.cc/0Q7zZY6r/download-(1).png" },
  "likes100-id": { id: "likes100-id", nome: "LIKES ID 100", valor: 8.00, estoque: 500, categoria: "likes", descricao: "Solicite seus likes rápido e seguro!", imagemUrl: "https://i.postimg.cc/HkmDGHwd/IMG-20261015-WA0012.jpg" },
  "likes200-id": { id: "likes200-id", nome: "LIKES ID 200", valor: 10.00, estoque: 500, categoria: "likes", descricao: "Solicite seus likes rápido e seguro!", imagemUrl: "https://i.postimg.cc/HkmDGHwd/IMG-20261015-WA0012.jpg" },
  "likes300-id": { id: "likes300-id", nome: "LIKES ID 300", valor: 15.00, estoque: 500, categoria: "likes", descricao: "Solicite seus likes rápido e seguro!", imagemUrl: "https://i.postimg.cc/HkmDGHwd/IMG-20261015-WA0012.jpg" },
  "likes400-id": { id: "likes400-id", nome: "LIKES ID 400", valor: 20.00, estoque: 500, categoria: "likes", descricao: "Solicite seus likes rápido e seguro!", imagemUrl: "https://i.postimg.cc/HkmDGHwd/IMG-20261015-WA0012.jpg" },
  "likes500-id": { id: "likes500-id", nome: "LIKES ID 500", valor: 30.00, estoque: 500, categoria: "likes", descricao: "Solicite seus likes rápido e seguro!", imagemUrl: "https://i.postimg.cc/HkmDGHwd/IMG-20261015-WA0012.jpg" },
  "likes600-id": { id: "likes600-id", nome: "LIKES ID 600", valor: 40.00, estoque: 500, categoria: "likes", descricao: "Solicite seus likes rápido e seguro!", imagemUrl: "https://i.postimg.cc/HkmDGHwd/IMG-20261015-WA0012.jpg" },
  "likes700-id": { id: "likes700-id", nome: "LIKES ID 700", valor: 50.00, estoque: 500, categoria: "likes", descricao: "Solicite seus likes rápido e seguro!", imagemUrl: "https://i.postimg.cc/HkmDGHwd/IMG-20261015-WA0012.jpg" },
  "likes800-id": { id: "likes800-id", nome: "LIKES ID 800", valor: 60.00, estoque: 500, categoria: "likes", descricao: "Solicite seus likes rápido e seguro!", imagemUrl: "https://i.postimg.cc/HkmDGHwd/IMG-20261015-WA0012.jpg" },
  "likes900-id": { id: "likes900-id", nome: "LIKES ID 900", valor: 70.00, estoque: 500, categoria: "likes", descricao: "Solicite seus likes rápido e seguro!", imagemUrl: "https://i.postimg.cc/HkmDGHwd/IMG-20261015-WA0012.jpg" },
  "likes1000-id": { id: "likes1000-id", nome: "LIKES ID 1000", valor: 90.00, estoque: 500, categoria: "likes", descricao: "Solicite seus likes rápido e seguro!", imagemUrl: "https://i.postimg.cc/HkmDGHwd/IMG-20261015-WA0012.jpg" }
});

const CATEGORIAS = {
  sensibilidade: { nome: "PACKS DE SENSIBILIDADE FREE FIRE", descricao: "Desempenho, resultado e qualidade" },
  aplicativos: { nome: "APLICATIVOS CLIENTE", descricao: "Ilimitados" },
  likes: { nome: "LIKES ID FREE FIRE", descricao: "Entregas imediatas após pagamento" }
};

// ========== ESTADO ==========
let pedidos = lerArquivo(PEDIDOS_ARQUIVO, {});
let usuariosGerar = lerArquivo(USUARIOS_GERAR_ARQUIVO, {});
let lembretes = lerArquivo(LEMBRETES_ARQUIVO, {});
let atividadeUsuarios = lerArquivo(ATIVIDADE_ARQUIVO, {});
let usuariosQueViramCanal = lerArquivo(USUARIOS_CANAIS, {});
let ultimosAnuncios = lerArquivo(ULTIMO_ANUNCIO, {});

// ========== 🔄 LIMPEZA AUTOMÁTICA A CADA 24H ==========
function limparDadosAntigos() {
  const agora = Date.now();
  const vinteQuatroHoras = 24 * 60 * 60 * 1000;
  let limpou = false;

  for (const chave of Object.keys(ultimosAnuncios)) {
    if (agora - ultimosAnuncios[chave] > vinteQuatroHoras) {
      delete ultimosAnuncios[chave];
      limpou = true;
    }
  }
  if (limpou) salvarArquivo(ULTIMO_ANUNCIO, ultimosAnuncios);

  limpou = false;
  for (const chave of Object.keys(usuariosQueViramCanal)) {
    if (agora - usuariosQueViramCanal[chave] > vinteQuatroHoras) {
      delete usuariosQueViramCanal[chave];
      limpou = true;
    }
  }
  if (limpou) salvarArquivo(USUARIOS_CANAIS, usuariosQueViramCanal);

  limpou = false;
  for (const chave of Object.keys(lembretes)) {
    if (agora - lembretes[chave] > vinteQuatroHoras) {
      delete lembretes[chave];
      limpou = true;
    }
  }
  if (limpou) salvarArquivo(LEMBRETES_ARQUIVO, lembretes);

  limpou = false;
  for (const chave of Object.keys(atividadeUsuarios)) {
    if (agora - atividadeUsuarios[chave].ultimaAtividade > vinteQuatroHoras) {
      delete atividadeUsuarios[chave];
      limpou = true;
    }
  }
  if (limpou) salvarArquivo(ATIVIDADE_ARQUIVO, atividadeUsuarios);

  console.log('🔄 Limpeza automática de 24h verificada — anúncios serão reenviados!');
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

function identificarCanal(canalNome) {
  for (const [chave, nome] of Object.entries(CANAIS)) {
    if (canalNome.includes(nome)) return chave;
  }
  return null;
}

// ========== 📢 ENVIAR ANÚNCIO PROGRAMADO ==========
async function enviarAnuncioProgramado(client) {
  const agora = new Date();
  const horaAtual = agora.getHours();
  const minutoAtual = agora.getMinutes();
  const hoje = agora.toISOString().split('T')[0];

  for (const anuncio of MENSAGENS_PROGRAMADAS) {
    if (anuncio.hora === horaAtual && anuncio.minuto === minutoAtual) {
      const chave = `${hoje}_${anuncio.hora}_${anuncio.minuto}`;
      if (ultimosAnuncios[chave]) continue;

      const canalAnuncios = client.channels.cache.find(
        canal => canal.type === ChannelType.GuildText && canal.name.toLowerCase().includes(CANAIS.anuncios)
      );

      if (canalAnuncios) {
        const embed = new EmbedBuilder()
          .setColor('#FF0055')
          .setTitle(anuncio.titulo)
          .setDescription(anuncio.mensagem)
          .setThumbnail(IMAGEM_LOGO_URL)
          .setFooter({ text: 'SENS7X VENDAS — O melhor para seu jogo! 🔥' })
          .setTimestamp();

        await canalAnuncios.send({ embeds: [embed] }).catch(err => {
          console.log(`⚠️ Não consegui enviar anúncio: ${err.message}`);
        });

        console.log(`📢 Anúncio enviado: ${anuncio.titulo}`);
        ultimosAnuncios[chave] = Date.now();
        salvarArquivo(ULTIMO_ANUNCIO, ultimosAnuncios);
      }
    }
  }
}

// ========== VALIDAÇÃO INICIAL ==========
if (!MP_ACCESS_TOKEN || !BOT_TOKEN || !RENDER_URL) {
  console.error('❌ Faltam variáveis de ambiente! Verifique BOT_TOKEN, MP_ACCESS_TOKEN e RENDER_EXTERNAL_URL.');
  process.exit(1);
}
const mpClient = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN });

// ========== SERVIDOR EXPRESS ==========
const app = express();
app.use(express.json());

// ========== WEBHOOK MERCADO PAGO ==========
app.post(WEBHOOK_PATH, async (req, res) => {
  try {
    const { type, data } = req.body;
    if (type === 'payment' && data && data.id) {
      const payment = await new Payment(mpClient).get({ id: data.id });
      const pedidoId = payment.external_reference;
      const pedido = pedidos[pedidoId];

      if (payment.status === 'approved' && pedido && !pedido.entregue) {
        const usuarioId = pedido.discordUserId;

        if (pedido.tipo === 'gerar_sensibilidade') {
          const sensibilidade = gerarSensibilidade();
          try {
            const usuario = await client.users.fetch(usuarioId);
            await usuario.send(`✅ **Pagamento confirmado!** Aqui está sua sensibilidade:\n\n\`\`\`${sensibilidade}\`\`\`\n\nObrigado pela preferência! 🎉`);
          } catch (e) { console.log('Erro DM:', e.message); }
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
          } catch (e) { console.log('Erro DM:', e.message); }
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
    GatewayIntentBits.GuildVoiceStates
  ]
});

client.on('ready', () => {
  console.log(`✅ Bot conectado como: ${client.user.tag}`);
  client.user.setActivity('!loja — Confira nossos produtos 🛒', { type: 3 });

  setInterval(() => verificarInatividade(), 60 * 1000);
  setInterval(() => enviarAnuncioProgramado(client), 60 * 1000);
  setInterval(() => limparDadosAntigos(), 60 * 60 * 1000);

  console.log('✅ Sistema de anúncios programados: 18 horários ATIVADOS');
  console.log('✅ Limpeza automática a cada 24h: ATIVADA');
  console.log('✅ Logo do bot em todas as mensagens: ATIVADA');
});

const prefix = '!';

// ========== LEMBRETE DE INATIVIDADE ==========
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
              `Se tiver dúvidas, digite \`!ajuda\` para ver os comandos disponíveis!\n\n` +
              `Estamos aqui pra te ajudar! 💙`
            )
            .setThumbnail(IMAGEM_LOGO_URL);
          canal.send({ embeds: [embedLembrete] }).catch(() => {});
        }
      }
    }
  }
}

// ========== BOAS-VINDAS AO ENTRAR NO SERVIDOR ==========
client.on('guildMemberAdd', async (member) => {
  if (member.user.bot) return;
  try {
    const embed = new EmbedBuilder()
      .setColor('#FF0055')
      .setTitle(`👋 Bem-vindo(a), ${member.user.username}!`)
      .setThumbnail(IMAGEM_LOGO_URL)
      .setDescription(
        `É um prazer recebê-lo na **SENS7X VENDAS**! 🎉\n\n` +
        `Explore nossos canais:\n` +
        `🛒 Ver produtos → \`!loja\`\n` +
        `💳 Comprar → vá ao canal pagamentos\n` +
        `❓ Dúvidas → consulte nosso canal de informações\n\n` +
        `Bem-vindo e boas compras! ❤️`
      )
      .setTimestamp();
    await member.send({ embeds: [embed] });
  } catch (e) { console.log('Erro boas-vindas:', e.message); }
});

// ========== ENTRADA EM CANAL DE VOZ ==========
client.on('voiceStateUpdate', async (oldState, newState) => {
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
          `📋 **Comandos disponíveis:**\n` +
          `\`!loja\` — Ver produtos\n` +
          `\`!ajuda\` — Todos os comandos\n\n` +
          `Se precisar de ajuda, é só chamar! 💙`
        )
        .setFooter({ text: 'SENS7X VENDAS — O melhor para seu jogo! 🔥' });
      await membro.send({ embeds: [embed] });
    } catch (e) {}
  }
});

// ========== COMANDOS ==========
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  atividadeUsuarios[message.author.id] = { ultimaAtividade: Date.now(), canalId: message.channel.id };
  salvarArquivo(ATIVIDADE_ARQUIVO, atividadeUsuarios);

  const canalNome = message.channel.name ? message.channel.name.toLowerCase() : '';
  const canalChave = identificarCanal(canalNome);

  // Boas-vindas na primeira mensagem do canal (reenvia após 24h)
  const idUnico = `${message.author.id}_${message.channel.id}`;
  if (!usuariosQueViramCanal[idUnico] && canalChave && MENSAGENS_CANAIS[canalChave]) {
    const info = MENSAGENS_CANAIS[canalChave];
    const embedBv = new EmbedBuilder()
      .setColor('#FF0055')
      .setTitle(info.titulo)
      .setDescription(info.descricao)
      .setThumbnail(IMAGEM_LOGO_URL)
      .setFooter({ text: 'SENS7X VENDAS — O melhor para seu jogo! 🔥' });
    await message.channel.send({ embeds: [embedBv] }).catch(() => {});
    usuariosQueViramCanal[idUnico] = Date.now();
    salvarArquivo(USUARIOS_CANAIS, usuariosQueViramCanal);
  }

  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const comando = args.shift()?.toLowerCase();

  if (canalChave && COMANDOS_POR_CANAL[canalChave]) {
    const permitidos = COMANDOS_POR_CANAL[canalChave];
    if (!permitidos.includes(comando)) {
      const lista = permitidos.map(c => `\`!${c}\``).join(' • ');
      const embedErro = new EmbedBuilder()
        .setColor('#FF6600')
        .setTitle('⚠️ Comando errado para este canal')
        .setDescription(`Neste canal você pode usar apenas:\n${lista}\n\nDigite \`!ajuda\` para ver os comandos deste canal!`)
        .setThumbnail(IMAGEM_LOGO_URL);
      return message.channel.send({ embeds: [embedErro] });
    }
  }

  // ========== !ajuda ==========
  if (comando === 'ajuda') {
    if (canalChave && MENSAGENS_CANAIS[canalChave]) {
      const info = MENSAGENS_CANAIS[canalChave];
      const embed = new EmbedBuilder()
        .setColor('#FF0055')
        .setTitle(info.titulo)
        .setDescription(info.descricao)
        .setThumbnail(IMAGEM_LOGO_URL)
        .setFooter({ text: 'SENS7X VENDAS — O melhor para seu jogo! 🔥' });
      return message.channel.send({ embeds: [embed] });
    }
    const embedGeral = new EmbedBuilder()
      .setColor('#FF0055')
      .setTitle('📋 TODOS OS CANAIS E COMANDOS')
      .setThumbnail(IMAGEM_LOGO_URL)
      .addFields(
        { name: '🛒 ver-produtos', value: '`!start` `!loja` `!buscar` `!sobre` `!ajuda`' },
        { name: '💳 pagamentos', value: '`!comprar nome-do-produto` `!ajuda`' },
        { name: '❓ duvidas-compras', value: '`!infcompras` `!infproduto` `!pay` `!ajuda`' },
        { name: '💭 bate-papo', value: '`!gerar` `!ajuda`' }
      )
      .setFooter({ text: 'Use os comandos apenas no canal correto! ✅' });
    return message.channel.send({ embeds: [embedGeral] });
  }

  // ========== !start ==========
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

  // ========== !loja ==========
  if (comando === 'loja' || comando === 'categorias') {
    let mensagem = '🏪 **NOSSA LOJA — ESCOLHA UMA CATEGORIA:**\n\n';
    for (const [chave, cat] of Object.entries(CATEGORIAS)) {
      mensagem += `**${cat.nome}**\n${cat.descricao}\nVer produtos: \`!cat_${chave}\`\n\n`;
    }
    mensagem += '──────────────────────\nPesquise diretamente: `!buscar nome-do-produto`';
    return message.channel.send(mensagem);
  }

  // ========== !cat_ ==========
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
        const avisoEstoque = prod.estoque <= 5 ? `⚠️ Últimas ${prod.estoque} unidades!` : `Em estoque: ${prod.estoque}`;
        embed.addFields({
          name: `${prod.nome} — R$ ${prod.valor.toFixed(2).replace('.', ',')}`,
          value: `${avisoEstoque}\nComprar: \`!comprar ${prod.id}\``
        });
      }
    }
    return message.channel.send({ embeds: [embed] });
  }

  // ========== !buscar ==========
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

  // ========== !comprar ==========
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
        entregue: false,
        paymentId: payment.id,
        data: new Date().toISOString()
      };
      salvarArquivo(PEDIDOS_ARQUIVO, pedidos);

      const avisoEstoque = produto.estoque <= 5 ? `⚠️ Últimas ${produto.estoque} unidades!` : `Em estoque: ${produto.estoque}`;

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
          { name: '🔗 Link de Pagamento', value: ticketUrl || 'Acesse o app do Mercado Pago' }
        )
        .setFooter({ text: `⚠️ Após pagar, confira sua mensagem privada! O produto é enviado por lá.` })
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
      if (erro.response?.data) console.error('Resposta MP:', JSON.stringify(erro.response.data, null, 2));
      message.reply("❌ Erro ao gerar pagamento. Tente novamente em alguns instantes!");
    }
    return;
  }

  // ========== !gerar ==========
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
        .setDescription(`Valor: **R$ 1,00**\n\nEscaneie o QR Code ou use o Pix abaixo para receber sua sensibilidade única! ✨`);

      if (anexoQrCode) embed.setImage('attachment://qrcode.png');

      embed
        .addFields(
          { name: '📋 Pix Copia e Cola', value: `\`\`\`${pixCode}\`\`\`` },
          { name: '🔗 Link', value: ticketUrl || 'Acesse o app do Mercado Pago' }
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

  // ========== !infcompras ==========
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

  // ========== !infproduto ==========
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

  // ========== !pay ==========
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

  // ========== !sobre ==========
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

// ========== INICIAR SERVIDOR ==========
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
  console.log(`✅ Webhook: ${RENDER_URL}${WEBHOOK_PATH}`);
  console.log(`✅ WhatsApp: ${SEU_WHATSAPP_NUMERO}`);
  console.log('✅ Anúncios programados: 18 horários ATIVADOS');
  console.log('✅ Limpeza automática a cada 24h: ATIVADA');
  console.log('✅ Comandos separados por canal: ATIVADO');
  console.log(`✅ Produtos carregados: ${Object.keys(PRODUTOS).length}`);
});

client.login(BOT_TOKEN).catch(err => {
  console.error('❌ Erro ao conectar bot:', err.message);
});
