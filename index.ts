import { registerRootComponent } from 'expo';

import App from './App';

// Registra o componente principal e prepara o ambiente tanto no Expo Go
// quanto em uma versão nativa do aplicativo.
registerRootComponent(App);

// 1. Importa registerRootComponent do Expo.
// 2. Importa o componente App, que está no arquivo App.tsx.
// 3. Registra o App como componente principal, para que o aplicativo saiba por onde começar.