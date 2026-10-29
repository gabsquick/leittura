// HTML isolado que roda dentro do WebView. Manter esta string fora da tela
// evita misturar UI nativa com a lógica específica de extração/reflow do PDF.
export const readerHtml = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <style>
      :root {
        --bg: #f4f1ea;
        --fg: #1c1917;
        --fs: 19px;
        --ff: Georgia, "Times New Roman", serif;
        --reader-top: 86px;
        --reader-bottom: 142px;
      }

      html,
      body {
        width: 100%;
        height: 100%;
        margin: 0;
        background: var(--bg);
        color: var(--fg);
        overflow: hidden;
      }

      body {
        font-family: var(--ff);
        -webkit-font-smoothing: antialiased;
      }

      #reader {
        width: 100vw;
        height: 100vh;
        overflow-x: hidden;
        overflow-y: auto;
        box-sizing: border-box;
        padding: var(--reader-top) 28px var(--reader-bottom);
        touch-action: pan-y;
        -webkit-overflow-scrolling: touch;
      }

      #reader::-webkit-scrollbar {
        display: none;
      }

      p {
        margin: 0 0 1.05em;
        font-size: var(--fs);
        line-height: 1.58;
        text-align: left;
      }

      .empty,
      .status {
        height: calc(100vh - 140px);
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        font-size: 16px;
        line-height: 1.45;
        opacity: 0.72;
        padding: 0 18px;
        box-sizing: border-box;
      }

      .readerHighlight {
        border-radius: 0.18em;
        box-decoration-break: clone;
        -webkit-box-decoration-break: clone;
        padding: 0.03em 0.08em;
      }

      .readerHighlight-red {
        background: rgba(224, 72, 72, 0.42);
      }

      .readerHighlight-blue {
        background: rgba(58, 143, 214, 0.42);
      }

      .readerHighlight-yellow {
        background: rgba(238, 191, 75, 0.48);
      }

      #highlightMenu {
        position: fixed;
        z-index: 20;
        display: none;
        align-items: center;
        gap: 10px;
        padding: 8px 10px;
        border-radius: 999px;
        background: rgba(250, 246, 239, 0.94);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.22);
      }

      .highlightDot {
        width: 30px;
        height: 30px;
        border: 0;
        border-radius: 999px;
        box-shadow: inset 0 0 0 2px rgba(28, 25, 23, 0.16);
      }

      .highlightDot-red {
        background: #e04848;
      }

      .highlightDot-blue {
        background: #3a8fd6;
      }

      .highlightDot-yellow {
        background: #eebf4b;
      }
    </style>
  </head>
  <body>
    <main id="reader">
      <div class="status">Preparando leitura...</div>
    </main>
    <div id="highlightMenu" aria-hidden="true">
      <button class="highlightDot highlightDot-red" data-color="red" aria-label="Grifar em vermelho"></button>
      <button class="highlightDot highlightDot-blue" data-color="blue" aria-label="Grifar em azul"></button>
      <button class="highlightDot highlightDot-yellow" data-color="yellow" aria-label="Grifar em amarelo"></button>
    </div>

    <script type="module">
      const reader = document.getElementById('reader');
      const highlightMenu = document.getElementById('highlightMenu');
      let progressTimer = null;
      let savedHighlights = [];
      let promessaPdfJs = null;
      let urlWorkerPdfJs = null;

      // A ponte com React Native é propositalmente pequena: o WebView só avisa
      // estado/progresso/erro, enquanto o app nativo controla tela e preferências.
      function post(type, payload = {}) {
        window.ReactNativeWebView?.postMessage(JSON.stringify({ type, ...payload }));
      }

      function setStatus(text) {
        reader.innerHTML = '<div class="status">' + escapeHtml(text) + '</div>';
      }

      function escapeHtml(value) {
        return String(value)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');
      }

      // Converte base64 para bytes porque o pdf.js trabalha melhor com Uint8Array
      // do que com strings grandes vindas diretamente do React Native.
      function base64ToBytes(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i += 1) {
          bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
      }

      // Transforma os assets empacotados em módulos locais que o WebView pode
      // executar. URLs Blob evitam acesso à rede e funcionam também no worker.
      function configurarPdfJsLocal(recursos) {
        if (promessaPdfJs) return;

        const modulo = new Blob([base64ToBytes(recursos.moduloBase64)], { type: 'text/javascript' });
        const worker = new Blob([base64ToBytes(recursos.workerBase64)], { type: 'text/javascript' });
        const urlModuloPdfJs = URL.createObjectURL(modulo);
        urlWorkerPdfJs = URL.createObjectURL(worker);
        promessaPdfJs = import(urlModuloPdfJs);
      }

      function applyPrefs(prefs) {
        document.documentElement.style.setProperty('--bg', prefs.bg);
        document.documentElement.style.setProperty('--fg', prefs.fg);
        document.documentElement.style.setProperty('--fs', prefs.fontSize + 'px');
        document.documentElement.style.setProperty('--reader-top', ((prefs.topInset ?? 24) + 62) + 'px');
        document.documentElement.style.setProperty('--reader-bottom', ((prefs.bottomInset ?? 24) + 128) + 'px');
        requestAnimationFrame(() => {
          restorePosition(prefs.position ?? currentPosition());
          emitReadingProgress();
        });
      }

      function currentPosition() {
        const maxScroll = Math.max(0, reader.scrollHeight - reader.clientHeight);
        if (maxScroll === 0) return 0;
        return Math.min(1, Math.max(0, reader.scrollTop / maxScroll));
      }

      function restorePosition(position) {
        const maxScroll = Math.max(0, reader.scrollHeight - reader.clientHeight);
        reader.scrollTop = maxScroll * Math.min(1, Math.max(0, position || 0));
      }

      // O contador representa quantas alturas de tela o texto reflowável ocupa,
      // sem depender das páginas originais do PDF ou do tamanho de fonte escolhido.
      function currentScreenPages() {
        const pageHeight = reader.clientHeight;
        if (pageHeight === 0) return { pageIndex: 1, pageTotal: 1 };
        const pageTotal = Math.max(1, Math.ceil(reader.scrollHeight / pageHeight));
        const scrollRange = Math.max(0, reader.scrollHeight - pageHeight);
        const pageIndex = scrollRange === 0
          ? 1
          : Math.min(pageTotal, Math.round((reader.scrollTop / scrollRange) * (pageTotal - 1)) + 1);
        return { pageIndex, pageTotal };
      }

      // O progresso é derivado do scroll vertical real do WebView. Mantemos a
      // emissão com throttle para salvar leitura frequentemente sem gravar no
      // AsyncStorage a cada pixel de gesto.
      function emitReadingProgress(forcarSalvamento = false) {
        const position = currentPosition();
        const { pageIndex, pageTotal } = currentScreenPages();
        post('readingProgress', {
          position,
          progress: Math.round(position * 100),
          pageIndex,
          pageTotal,
          forcarSalvamento,
        });
      }

      function hideHighlightMenu() {
        highlightMenu.style.display = 'none';
        highlightMenu.setAttribute('aria-hidden', 'true');
      }

      function isReaderSelection(selection) {
        if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return false;
        const range = selection.getRangeAt(0);
        return reader.contains(range.commonAncestorContainer);
      }

      function updateHighlightMenu() {
        const selection = window.getSelection();
        if (!isReaderSelection(selection) || !selection.toString().trim()) {
          hideHighlightMenu();
          return;
        }

        const rect = selection.getRangeAt(0).getBoundingClientRect();
        const left = Math.max(16, Math.min(window.innerWidth - 162, rect.left + rect.width / 2 - 81));
        const top = rect.bottom + 58 < window.innerHeight
          ? rect.bottom + 10
          : Math.max(84, rect.top - 54);

        highlightMenu.style.left = left + 'px';
        highlightMenu.style.top = top + 'px';
        highlightMenu.style.display = 'flex';
        highlightMenu.setAttribute('aria-hidden', 'false');
      }

      function readerTextNodes() {
        const nodes = [];
        const walker = document.createTreeWalker(reader, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) nodes.push(walker.currentNode);
        return nodes;
      }

      function occurrenceForSelection(text, range) {
        const before = document.createRange();
        before.selectNodeContents(reader);
        before.setEnd(range.startContainer, range.startOffset);

        const startOffset = before.toString().length;
        const fullText = reader.textContent || '';
        let occurrence = 0;
        let index = fullText.indexOf(text);

        while (index >= 0 && index < startOffset) {
          occurrence += 1;
          index = fullText.indexOf(text, index + Math.max(1, text.length));
        }

        return occurrence;
      }

      function rangeForHighlight(highlight) {
        const nodes = readerTextNodes();
        const fullText = nodes.map((node) => node.nodeValue || '').join('');
        let occurrence = 0;
        let targetIndex = fullText.indexOf(highlight.text);

        while (targetIndex >= 0 && occurrence < highlight.occurrence) {
          occurrence += 1;
          targetIndex = fullText.indexOf(highlight.text, targetIndex + Math.max(1, highlight.text.length));
        }

        if (targetIndex < 0) return null;

        const endIndex = targetIndex + highlight.text.length;
        let cursor = 0;
        let startNode = null;
        let endNode = null;
        let startOffset = 0;
        let endOffset = 0;

        for (const node of nodes) {
          const length = (node.nodeValue || '').length;
          const nextCursor = cursor + length;

          if (!startNode && targetIndex >= cursor && targetIndex <= nextCursor) {
            startNode = node;
            startOffset = targetIndex - cursor;
          }

          if (!endNode && endIndex >= cursor && endIndex <= nextCursor) {
            endNode = node;
            endOffset = endIndex - cursor;
            break;
          }

          cursor = nextCursor;
        }

        if (!startNode || !endNode) return null;

        const range = document.createRange();
        range.setStart(startNode, startOffset);
        range.setEnd(endNode, endOffset);
        return range;
      }

      function wrapRange(range, highlight) {
        const span = document.createElement('span');
        span.className = 'readerHighlight readerHighlight-' + highlight.color;
        span.dataset.highlightId = highlight.id;
        span.appendChild(range.extractContents());
        range.insertNode(span);
      }

      function applySavedHighlights(highlights) {
        savedHighlights = Array.isArray(highlights) ? highlights : [];

        // Os grifos são reaplicados depois do reflow, usando o texto e a
        // ocorrência no livro. É simples e estável para PDFs textuais; seleções
        // muito longas ou repetidas podem cair no trecho equivalente mais próximo.
        for (const highlight of savedHighlights) {
          const range = rangeForHighlight(highlight);
          if (range) wrapRange(range, highlight);
        }
      }

      function addHighlight(color) {
        const selection = window.getSelection();
        if (!isReaderSelection(selection)) return;

        const range = selection.getRangeAt(0);
        const text = selection.toString();
        if (!text.trim()) return;

        const highlight = {
          id: String(Date.now()) + '-' + Math.round(Math.random() * 100000),
          color,
          text,
          occurrence: occurrenceForSelection(text, range),
        };

        wrapRange(range, highlight);
        savedHighlights = [...savedHighlights, highlight];
        selection.removeAllRanges();
        hideHighlightMenu();
        post('highlightsChanged', { highlights: savedHighlights });
      }

      // Agrupa itens por linha usando a posição vertical do PDF. Essa heurística
      // privilegia leitura fluida: ela não tenta reproduzir a página original,
      // apenas recuperar ordem e parágrafos com aparência de ebook.
      function textItemsToParagraphs(items) {
        const lines = [];
        for (const item of items) {
          const text = item.str?.trim();
          if (!text) continue;
          const x = item.transform?.[4] ?? 0;
          const y = item.transform?.[5] ?? 0;
          const existing = lines.find((line) => Math.abs(line.y - y) < 3);
          if (existing) {
            existing.parts.push({ x, text });
          } else {
            lines.push({ y, parts: [{ x, text }] });
          }
        }

        const orderedLines = lines
          .sort((a, b) => b.y - a.y)
          .map((line) => ({
            y: line.y,
            text: line.parts
              .sort((a, b) => a.x - b.x)
              .map((part) => part.text)
              .join(' ')
              .replace(/\\s+/g, ' ')
              .trim(),
          }))
          .filter((line) => line.text.length > 0);

        const paragraphs = [];
        let current = '';
        let previousY = null;

        for (const line of orderedLines) {
          const gap = previousY === null ? 0 : Math.abs(previousY - line.y);
          const startsNewParagraph = gap > 16 || current.endsWith('.') || current.endsWith('?') || current.endsWith('!');

          if (startsNewParagraph && current) {
            paragraphs.push(current);
            current = line.text;
          } else if (current.endsWith('-')) {
            current = current.slice(0, -1) + line.text;
          } else {
            current = current ? current + ' ' + line.text : line.text;
          }

          previousY = line.y;
        }

        if (current) paragraphs.push(current);
        return paragraphs;
      }

      async function startReader(payload) {
        try {
          applyPrefs(payload.prefs);
          setStatus('Extraindo texto do PDF...');

          if (!promessaPdfJs || !urlWorkerPdfJs) {
            throw new Error('Motor PDF local indisponível.');
          }

          const pdfjsLib = await promessaPdfJs;
          pdfjsLib.GlobalWorkerOptions.workerSrc = urlWorkerPdfJs;

          const pdf = await pdfjsLib.getDocument({ data: base64ToBytes(payload.base64) }).promise;
          const pageBlocks = [];
          let totalParagraphs = 0;

          for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
            post('progress', { pageNumber, pageCount: pdf.numPages });
            const page = await pdf.getPage(pageNumber);
            const content = await page.getTextContent();
            const paragraphs = textItemsToParagraphs(content.items);
            totalParagraphs += paragraphs.length;

            if (paragraphs.length > 0) {
              pageBlocks.push(
                '<section class="page">' +
                  paragraphs.map((paragraph) => '<p>' + escapeHtml(paragraph) + '</p>').join('') +
                '</section>'
              );
            }
          }

          if (totalParagraphs === 0) {
            reader.innerHTML = '<div class="empty">Não encontrei texto selecionável neste PDF. Ele pode ser escaneado ou composto apenas por imagens.</div>';
            post('empty');
            return;
          }

          reader.innerHTML = pageBlocks.join('');
          applySavedHighlights(payload.highlights);
          restorePosition(payload.position ?? 0);
          emitReadingProgress();
          post('ready', { pageCount: pdf.numPages });
        } catch (error) {
          reader.innerHTML = '<div class="empty">Não foi possível preparar este PDF para leitura.</div>';
          post('error', { message: error instanceof Error ? error.message : String(error) });
        }
      }

      window.startReader = startReader;
      window.configurarPdfJsLocal = configurarPdfJsLocal;
      window.applyPrefs = applyPrefs;
      window.flushReadingProgress = () => {
        clearTimeout(progressTimer);
        progressTimer = null;
        emitReadingProgress(true);
      };

      highlightMenu.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        const button = event.target.closest('button[data-color]');
        if (button) addHighlight(button.dataset.color);
      });

      document.addEventListener('selectionchange', () => {
        requestAnimationFrame(updateHighlightMenu);
      });

      document.addEventListener('pointerdown', (event) => {
        if (!highlightMenu.contains(event.target)) hideHighlightMenu();
      });

      reader.addEventListener('scroll', () => {
        if (progressTimer) return;
        progressTimer = setTimeout(() => {
          progressTimer = null;
          emitReadingProgress();
        }, 450);
      });
      post('loaded');
    </script>
  </body>
</html>`;
