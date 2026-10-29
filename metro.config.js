const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// O PDF.js é distribuído como código JavaScript, mas precisa chegar ao WebView
// como arquivo bruto. A extensão dedicada impede o Metro de transpilar o motor.
config.resolver.assetExts.push('pdfjs');

module.exports = config;

// O Metro é o empacotador do Expo/React Native:
// ele processa os arquivos JavaScript do aplicativo antes de enviá-los ao app. Porém, nesse caso, o código do PDF.js precisa ser entregue ao WebView como um arquivo pronto, sem que o Metro tente interpretá-lo ou transformá-lo como parte do código React Native.
// A extensão dedicada faz o Metro tratar o arquivo como um recurso, parecido com uma imagem, em vez de tratá-lo como código JavaScript do aplicativo. Assim, o WebView consegue carregar o PDF.js e usá-lo para exibir PDFs.
