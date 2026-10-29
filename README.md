<div align="center">

<img src="assets/icon.png" alt="Ícone do Leittura" width="96" />

# 📖 Leittura

**Sua estante de PDFs. Sem anuncios. Livre.**

![Expo SDK 56](https://img.shields.io/badge/Expo-SDK%2056-211d1a?style=flat-square&logo=expo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Android](https://img.shields.io/badge/Android-4a6354?style=flat-square&logo=android&logoColor=white)
![Licença MIT](https://img.shields.io/badge/Licen%C3%A7a-MIT-c87a5e?style=flat-square)

Leittura, um leitor de PDF's locais, sem internet, sem anuncios, sem compromisso, open source.

</div>

```text
        ___________________ ___________________
       /                  / \                  \
      /   mais um        /   \   sem            \
     /     capitulo.    /     \    anuncios.     \
    /__________________/       \_________________\
    \__________________\_______/_________________/

          [ Estante ] ---- ( + ) ---- [ Perfil ]
```

## ✨ O que tem na estante?

| | Recurso | Como funciona |
| :---: | --- | --- |
| 📥 | Importação de PDFs | Escolha um arquivo de até **50 MB**, dê um título e comece a ler. |
| 🗂️ | Categorias | Crie prateleiras com seus próprios livros e organize do seu jeito. |
| ⭐ | Favoritos | Deixe aquelas leituras especiais por perto. |
| 🔎 | Busca na biblioteca | Encontre seus livros sem passear por todas as prateleiras. |
| 🔖 | Continue de onde parou | A posição e o progresso ficam salvos no dispositivo. |
| 🖍️ | Grifos | Selecione trechos e destaque em amarelo, azul ou vermelho. |
| 🎨 | Três temas de leitura | Alterne entre **Claro**, **Sépia** e **Escuro**, em breve mais ajustes. |
| 🎯 | Meta anual | Escolha quantos livros quer ler. O ano se renova mantendo sua meta. |
| 📊 | Estatísticas | Acompanhe livros concluídos, sequência de dias e páginas estimadas. |


Na Estante, **toque para ler** e **segure um livro para abrir suas ações**: favoritar, escolher uma categoria ou remover.

## ☕ Da importação ao “só mais uma página”

```text
       Seu PDF
          |
          v
    (+) > PDF > Titulo e autor
          |
          v
    Copia salva no dispositivo
          |
          v
    PDF.js extrai o texto
          |
          v
    Ler > Grifar > Continuar depois
```

No primeiro acesso, você escolhe como quer ser chamado e define sua meta. Depois, o botão **“+”** permite importar PDFs ou criar categorias. O **Perfil** reúne seu nome, estatísticas, meta e informações sobre o app. Informamos que nenhum dado e coletado.

## 🧠 Como a leitura funciona

O Leittura usa o **PDF.js**, incluído no próprio projeto, para extrair o texto do arquivo. Esse texto é reorganizado em uma leitura contínua dentro de um WebView, permitindo ajustar a fonte e o tema.

Alguns pontos para corrigir em breve:

- **PDFs com texto selecionável são o foco.** Arquivos escaneados ou feitos apenas de imagens precisam de OCR, que ainda não faz parte do app. (Em breve).
- **A diagramação original não é preservada.** Imagens, tabelas e documentos com várias colunas podem perder informações ou ordem na extração. 
- **A leitura é local.** Os PDFs importados, grifos e preferências ficam no dispositivo; não há sincronização de biblioteca entre aparelhos.

## 🔒 Seus arquivos, no seu dispositivo

O processamento dos PDFs acontece no aparelho. O app funciona sem cadastro em conta, não inclui anúncios e guarda a biblioteca localmente.

Como não há backup em nuvem no app, **guarde uma cópia dos PDFs originais**. Desinstalar o aplicativo ou limpar seus dados pelo sistema pode remover a biblioteca e o histórico local.

O Leittura abre os arquivos que você importa. Use PDFs que você tenha direito de acessar.

📄 [Política de privacidade](https://gabsquick.github.io/leittura-privacy-term/)

## 🚀 Rodando o projeto

Você vai precisar de **Node.js compatível com o Expo SDK 56**, npm e **Expo Go compatível com o SDK do projeto**, no celular Android ou em um emulador.

Na pasta do projeto:

```bash
npm ci
npm start
```

Depois, abra pelo Expo Go usando o QR Code ou pressione **`a`** no terminal para usar um emulador Android já iniciado.

Se precisar reiniciar o Metro com o cache limpo:

```bash
npx expo start -c
```

> 💡 O Expo Go usa seu próprio ícone. Para ver o nome e o ícone do Leittura no launcher, instale uma build do aplicativo.

## 🛠️ Por trás das páginas

| Peça | Papel no projeto |
| --- | --- |
| **Expo SDK 56 + React Native** | Base do aplicativo. |
| **TypeScript** | Tipagem do código. |
| **React Context + AsyncStorage** | Estado e persistência dos dados locais. |
| **Expo FileSystem** | Seleção, cópia e leitura dos arquivos. |
| **PDF.js + React Native WebView** | Extração e apresentação do texto. |
| **Reanimated + Worklets** | Animação de abertura da navegação. |
| **Newsreader + Archivo** | Tipografia com um toque editorial. |

```text
leittura/
|-- App.tsx                  # Composicao e navegacao entre telas
|-- src/
|   |-- screens/             # Estante, Perfil, leitor e boas-vindas
|   |-- components/          # Navbar, capas e icones
|   |-- reader/readerHtml.ts # Leitura e grifos dentro do WebView
|   |-- books.tsx           # Biblioteca, categorias e progresso
|   |-- goal.tsx            # Meta anual
|   |-- stats.tsx           # Estatisticas de leitura
|   |-- reader.tsx          # Preferencias do leitor
|   `-- theme.ts            # Cores, fontes e espacamentos
|-- assets/pdfjs/           # Motor PDF e suas licencas
`-- privacy-policy/         # Copia local da politica de privacidade
```

## 🤝 Quer contribuir?

Sugestões e melhorias são bem-vindas. Ao relatar um problema, inclua o modelo do aparelho, o que aconteceu e os passos para reproduzir. Para dificuldades com um PDF, descreva o tipo de documento sem expor arquivos privados.

Meu e-mail pessoal: gabrielgrando99@gmail.com

## 📜 Licenças

O código do projeto está sob a [licença MIT](LICENSE). O **PDF.js**, da Mozilla Foundation, mantém sua [licença Apache 2.0](assets/pdfjs/LICENSE) e os avisos distribuídos em `assets/pdfjs/`.

---

<div align="center">

**📚 Uma estante organizada. Uma boa leitura. O resto pode esperar um capítulo.**

</div>
