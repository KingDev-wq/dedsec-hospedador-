const fs = require('fs');
const unzipper = require('unzipper');
const path = require('path');
const { Client } = require('discord.js');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const readlineSync = require('readline-sync');
const { Fore, Back, Style } = require('colorama');
const https = require('https');

// Configuração do banco de dados
const adapter = new FileSync('database.json');
const db = low(adapter);

// Banco de dados para armazenar os bots cadastrados
const bots = db.get('bots').value() || [];
const logs = [];

// Função para mostrar o painel de interação
function showPanel() {
  console.clear();
  console.log(Fore.GREEN + '=============================');
  console.log(Fore.CYAN + '    DedSec Hospedador');
  console.log(Fore.GREEN + '=============================');
  
  let option = readlineSync.keyInSelect(
    ['Adicionar Bot', 'Ver meus Bots', 'Ligar Bots', 'Ver Logs', 'Sair'],
    'Escolha uma opção:'
  );

  switch (option) {
    case 0:
      addBot();
      break;
    case 1:
      viewBots();
      break;
    case 2:
      startBots();
      break;
    case 3:
      viewLogs();
      break;
    case 4:
      console.log('Saindo...');
      process.exit();
      break;
    default:
      showPanel();
      break;
  }
}

// Função para adicionar um bot
function addBot() {
  console.clear();
  console.log(Fore.YELLOW + 'Adicionando Bot...');

  const botName = readlineSync.question('Nome do bot: ');
  const botFileLink = readlineSync.question('Link do arquivo .zip do bot (Google Drive link): ');

  // Baixar o arquivo .zip do Google Drive
  const botFolderPath = path.join(__dirname, botName);
  downloadFile(botFileLink, botFolderPath + '.zip', () => {
    console.log(Fore.YELLOW + 'Arquivo .zip recebido! Extraindo...');
    
    // Extrair os arquivos do .zip
    extractZip(botFolderPath + '.zip', botFolderPath, () => {
      console.log(Fore.GREEN + 'Arquivos extraídos com sucesso!');

      // Adicionar bot à lista de bots
      const newBot = { name: botName, folder: botFolderPath };
      bots.push(newBot);
      db.set('bots', bots).write();
      logs.push(`Bot ${botName} adicionado com sucesso.`);
      db.set('logs', logs).write();

      console.log(Fore.GREEN + 'Bot adicionado com sucesso!');
      showPanel();
    });
  });
}

// Função para visualizar os bots e excluí-los
function viewBots() {
  console.clear();
  if (bots.length === 0) {
    console.log(Fore.RED + 'Nenhum bot cadastrado.');
    showPanel();
    return;
  }

  console.log(Fore.CYAN + 'Bots cadastrados:');
  console.table(bots);

  const botName = readlineSync.question('Digite o nome do bot para excluir (ou pressione Enter para voltar): ');
  if (botName) {
    const botIndex = bots.findIndex((bot) => bot.name === botName);
    if (botIndex === -1) {
      console.log(Fore.RED + 'Bot não encontrado!');
    } else {
      bots.splice(botIndex, 1);
      db.set('bots', bots).write();
      logs.push(`Bot ${botName} excluído.`);
      db.set('logs', logs).write();
      console.log(Fore.GREEN + 'Bot excluído com sucesso!');
    }
  }
  showPanel();
}

// Função para ligar os bots
function startBots() {
  console.clear();
  if (bots.length === 0) {
    console.log(Fore.RED + 'Nenhum bot cadastrado para ligar.');
    showPanel();
    return;
  }

  const botName = readlineSync.question('Digite o nome do bot para ligar: ');

  const bot = bots.find((bot) => bot.name === botName);
  if (!bot) {
    console.log(Fore.RED + 'Bot não encontrado!');
  } else {
    console.log(Fore.YELLOW + `Ligando o bot: ${botName}...`);
    startBot(bot);
    logs.push(`Bot ${botName} iniciado.`);
    db.set('logs', logs).write();
  }

  showPanel();
}

// Função para iniciar o bot
function startBot(bot) {
  const botFolder = bot.folder;
  const botFile = path.join(botFolder, 'bot.js'); // Supondo que o arquivo principal do bot seja bot.js

  if (fs.existsSync(botFile)) {
    console.log(Fore.GREEN + `Iniciando bot ${bot.name}...`);
    require(botFile);
    console.log(Fore.GREEN + `${bot.name} está online!`);
  } else {
    console.log(Fore.RED + 'Arquivo bot.js não encontrado dentro da pasta do bot.');
  }
}

// Função para fazer o download do arquivo .zip do bot
function downloadFile(url, destination, callback) {
  const file = fs.createWriteStream(destination);
  https.get(url, (response) => {
    response.pipe(file);
    file.on('finish', () => {
      file.close(callback);
    });
  }).on('error', (err) => {
    fs.unlink(destination);
    console.log(Fore.RED + 'Erro ao baixar o arquivo:', err.message);
  });
}

// Função para extrair o arquivo .zip
function extractZip(zipPath, destination, callback) {
  fs.createReadStream(zipPath)
    .pipe(unzipper.Extract({ path: destination }))
    .on('close', () => {
      fs.unlinkSync(zipPath); // Remover o arquivo .zip após a extração
      callback();
    })
    .on('error', (err) => {
      console.log(Fore.RED + 'Erro ao extrair o arquivo .zip:', err.message);
    });
}

// Função para visualizar os logs
function viewLogs() {
  console.clear();
  if (logs.length === 0) {
    console.log(Fore.RED + 'Nenhum log encontrado.');
    showPanel();
    return;
  }

  console.log(Fore.CYAN + 'Logs recentes:');
  console.table(logs);
  showPanel();
}

// Chamada inicial do painel
showPanel();

// Mensagem "By: DedSec"
console.log(Style.BRIGHT + Fore.CYAN + "\n\nBy: DedSec");
