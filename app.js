// importation de filesystem pour pouvoir créer les dossiers
// enregistrer les fichiers et lire les templates
const fs = require('fs-extra');

// importation inquirer pour poser des questions à l'utilisateur
const inquirer = require('inquirer');

// importation de es-6-template-strings pour gérer
// le remplace des marqueurs sur les modèles
const template = require('es6-template-strings');

const { execSync } = require('child_process');

// Liste des package que pourra choisir l'utilisateur
packageList = [
  {
    name: 'jQuery',
    packageName: 'jquery',
    version: '*',
    js: '/node_modules/jquery/dist/jquery.min.js',
  },
  {
    name: 'Bootstrap',
    packageName: 'bootstrap',
    version: '*',
    js: '/node_modules/bootstrap/dist/js/bootstrap.min.js',
    css: '/node_modules/bootstrap/dist/css/bootstrap.min.css',
  },
];

// Définition des questions
const questions = [
  { message: 'Nom du dossier du projet', name: 'folderName', type: 'input' },
  { message: 'Titre du projet', name: 'title', type: 'input' },
  {
    message: 'Bibliothèques',
    name: 'libs',
    type: 'checkbox',
    choices: packageList,
  },
];
/**
 * Lecture d'un fichier de modèle
 * @param {string} fileName
 */
function getTemplate(fileName, templateFolder = './templates/') {
  return fs.readFileSync(templateFolder + fileName, 'utf8').toString();
}
/**
 * Remplacement des marqueurs dans templateString par les valeurs de data
 * @param {string} templateString
 * @param {object} data
 */
function render(templateString, data) {
  return template(templateString, data);
}
/**
 * Calcul le redu d'un modèle et enregistre le résultat dans
 * un fichier
 * @param {string} path
 * @param {string} templateString
 * @param {object} data
 */
function saveFile(path, templateString, data) {
  const renderedTemplate = render(templateString, data);
  fs.writeFileSync(path, renderedTemplate, 'utf8');
}
/**
 * Créer un dossier, si le dossier existe déjà commence par le supprimer
 * @param {string} folderName
 */
function createFolder(folderName) {
  fs.removeSync(folderName);
  fs.mkdirSync(folderName);
}

/**
 * retourne une liste de dépendances pour package.json
 * @param {Array} answers
 */
function getPackageDependencies(answers) {
  let dependencies = {};
  for (let libName of answers.libs) {
    // recherche dans packageList
    let package = packageList.find(item => item.name === libName);
    // ajouter une clef à l'objet dependencies
    dependencies[package.packageName] = package.version;
  }
  return JSON.stringify(dependencies);
}
/**
 * Modifie la liste des réponses
 * pour injecter les codes html de liaison avec les bibliothèques
 * css et js que l'utilisateur a selectionnées
 * @param {Array} answers
 */
function setScriptsAndLinks(answers) {
  // Ajout de deux clefs à answers
  answers.styles = [];
  answers.scripts = [];
  for (let libName of answers.libs) {
    let package = packageList.find(item => item.name === libName);

    if ('css' in package) {
      answers.styles.push(package.css);
    }

    if ('js' in package) {
      answers.scripts.push(package.js);
    }
  }

  // Transformation des noms de fichier en balise
  answers.styles = answers.styles
    .map(item => {
      return `<link rel="stylesheet" href="${item}">`;
    })
    .join('\n');

  answers.scripts = answers.scripts
    .map(item => {
      return `<script src="${item}"></script>`;
    })
    .join('\n');
}

// Lancement de l'application : Poser les questions
inquirer
  .prompt(questions)
  .then(answers => {
    console.log(answers);
    // Récupérer les templates
    const indexTemplate = getTemplate('index.html');
    const packageTemplate = getTemplate('package.json');
    // créer le dossiers
    const projectFolder = './' + answers.folderName;
    createFolder(projectFolder);

    // Traitement des dépendances pour package.json
    // et stockage dans answers
    answers.dependencies = getPackageDependencies(answers);

    // Traitement des dépendances dans index.html
    setScriptsAndLinks(answers);
    console.log(answers);

    // Remplir les templates enregistrer les fichiers
    saveFile(projectFolder + '/index.html', indexTemplate, answers);
    saveFile(projectFolder + '/package.json', packageTemplate, answers);

    // Exécution de npm install
    execSync(`cd ${answers.folderName} && npm install`);
  })
  .catch(err => console.log(err));
