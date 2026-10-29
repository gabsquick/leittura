import * as Application from 'expo-application';
import Constants from 'expo-constants';

// A configuração do Expo evita mostrar a versão do Expo Go durante o
// desenvolvimento; no APK/AAB, o valor nativo confirma a versão instalada.
export const versaoAplicativo =
  Constants.expoConfig?.version ?? Application.nativeApplicationVersion ?? 'desconhecida';
