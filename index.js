const fs = require('fs');
const path = require('path');
const readlineSync = require('readline-sync');
const unzipper = require('unzipper');
const { exec } = require('child_process');

// Caminho onde os bots serão armazenados
const botsDir = path.join(__dirname, 'bots');

// Garantir que o diretório de bots exista
if (!fs.existsSync(botsDir)) {
  fs.mkdirSync(botsDir);
}

// Função para adicionar bot
function addBot() {
  const zipPath = readlineSync.question('Digite o caminho do arquivo .zip do bot: ');

  // Verifica se o arquivo existe
  if (!fs.existsSync(zipPath)) {
    console.log('Arquivo não encontrado!');
    return;
  }

  const botName = path.basename(zipPath, '.zip');
  const botDir = path.join(botsDir, botName);

  // Verifica se o bot já foi adicionado
  if (fs.existsSync(botDir)) {
    console.log(`Bot ${botName} já existe.`);
    return;
  }

  // Extrai o .zip para o diretório de bots
  fs.createReadStream(zipPath)
    .pipe(unzipper.Extract({ path: botDir }))
    .on('close', () => {
      console.log(`Bot ${botName} adicionado com sucesso!`);
    });
}

// Função para listar os bots
function listBots() {
  const bots = fs.readdirSync(botsDir);
  
  if (bots.length === 0) {
    console.log('Nenhum bot encontrado.');
    return;
  }

  console.log('Bots cadastrados:');
  bots.forEach((bot, index) => {
    console.log(`${index + 1}. ${bot}`);
  });
}

// Função para excluir bot
function deleteBot() {
  listBots();
  const botIndex = readlineSync.questionInt('Escolha o bot que deseja excluir (número): ') - 1;
  
  const botName = fs.readdirSync(botsDir)[botIndex];
  if (!botName) {
    console.log('Bot não encontrado!');
    return;
  }

  const botDir = path.join(botsDir, botName);
  fs.rmSync(botDir, { recursive: true, force: true });
  console.log(`Bot ${botName} excluído com sucesso!`);
}

// Função para ligar bot
function startBot() {
  listBots();
  const botIndex = readlineSync.questionInt('Escolha o bot que deseja ligar (número): ') - 1;
  
  const botName = fs.readdirSync(botsDir)[botIndex];
  if (!botName) {
    console.log('Bot não encontrado!');
    return;
  }

  const botDir = path.join(botsDir, botName);
  const botFile = path.join(botDir, 'bot.js'); // A partir do arquivo bot.js dentro do bot extraído
  
  if (!fs.existsSync(botFile)) {
    console.log('Arquivo bot.js não encontrado!');
    return;
  }

  // Executa o bot
  exec(`node ${botFile}`, (err, stdout, stderr) => {
    if (err) {
      console.log(`Erro ao iniciar o bot: ${stderr}`);
      return;
    }
    console.log(`Bot ${botName} iniciado com sucesso!`);
    console.log(stdout);
  });
}

// Função para exibir o painel
function showMenu() {
  console.log('\n----- DedSec Hospedador -----');
  console.log('1. Adicionar Bot');
  console.log('2. Ver meus Bots');
  console.log('3. Ligar Bots');
  console.log('4. Excluir Bot');
  console.log('0. Sair');

  const choice = readlineSync.questionInt('Escolha uma opção: ');

  switch (choice) {
    case 1:
      addBot();
      break;
    case 2:
      listBots();
      break;
    case 3:
      startBot();
      break;
    case 4:
      deleteBot();
      break;
    case 0:
      console.log('Saindo...');
      process.exit();
      break;
    default:
      console.log('Opção inválida. Tente novamente.');
  }

  // Chama novamente o menu após uma ação
  showMenu();
}

// Inicia o painel
showMenu();
