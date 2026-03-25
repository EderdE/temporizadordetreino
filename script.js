 // Função para entrar em modo tela cheia
 function entrarTelaCheia() {
  const elem = document.documentElement;
  if (elem.requestFullscreen) {
    elem.requestFullscreen();
  } else if (elem.mozRequestFullScreen) { // Firefox
    elem.mozRequestFullScreen();
  } else if (elem.webkitRequestFullscreen) { // Chrome, Safari and Opera
    elem.webkitRequestFullscreen();
  } else if (elem.msRequestFullscreen) { // IE/Edge
    elem.msRequestFullscreen();
  }
 }

 // Função para sair do modo tela cheia ao pressionar ESC
 document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape') {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else if (document.webkitFullscreenElement) { // Safari
      document.webkitExitFullscreen();
    } else if (document.mozFullScreenElement) { // Firefox
      document.mozCancelFullScreen();
    } else if (document.msFullscreenElement) { // IE/Edge
      document.msExitFullscreen();
    }
  }
 });

 // Variáveis para os tempos
 let treinoMinutos = document.getElementById('treino-minutos');
 let treinoSegundos = document.getElementById('treino-segundos');
 let descansoMinutos = document.getElementById('descanso-minutos');
 let descansoSegundos = document.getElementById('descanso-segundos');

 // Variáveis para os tempos exibidos
 let tempoTreinoDisplay = document.getElementById('tempo-treino');
 let tempoDescansoDisplay = document.getElementById('tempo-descanso');
 let repeticoesDisplay = document.getElementById('tempo-repeticoes');

 // Variável para o número de repetições
 let repeticoesInput = document.getElementById('repeticoes');
 let repeticoes = parseInt(repeticoesInput.value);

 // Labels para alteração de texto (Modos)
 const lblTreino = document.getElementById('lbl-treino');
 const lblDescanso = document.getElementById('lbl-descanso');
 const lblRepeticoes = document.getElementById('lbl-repeticoes');

 // Elementos de Configuração e Propaganda
 const configSection = document.getElementById('configuracoes');
 const propagandaSection = document.getElementById('propaganda');
 const propagandaImg = propagandaSection.querySelector('img'); // Referência para a imagem

 // Lista de imagens para a propaganda (Adicione seus arquivos aqui)
 const imagensPropaganda = [
  'propa/ED.png',
  'propa/PropagandaED.png',
  'propa/LogoRS.jpeg',
  'propa/logoalex.bmp',
  'propa/LogoDDTA.jpg',
  'propa/Mensagens.png',
  
  // Exemplo de como adicionar mais imagens:
  // 'propa/SuaSegundaImagem.jpg',
  // 'propa/SuaTerceiraImagem.jpg'
 ];
 let indicePropaganda = 0;
 let intervaloPropaganda;

 // Variáveis para controle do temporizador
 let treinoTempoRestante;
 let descansoTempoRestante;
 let repeticoesRestantes;
 let intervalo;
 let estado = 'parado'; // pode ser 'parado', 'rodando', 'pausado'
 let ciclo = 'treino'; // O ciclo inicial sempre será 'treino'
 let modoAtual = 'fight'; // 'hit' ou 'fight' - Alterado para iniciar em 'fight'
 let tempoTotalTreinoInicial;
 const modeFight = document.getElementById('mode-fight');
 const modeHit = document.getElementById('mode-hit');
 const metaThemeColor = document.getElementById('theme-color-meta');
 let debounceTimeout; // Variável para o temporizador do ajuste
 let wakeLock = null; // Variável para o Screen Wake Lock
 
 // Áudios
 // Sons Globais
 const somInicioGlobal = new Audio('som/vai.mp4'); // Som único de início do processo
 const somFimGlobal = new Audio('som/doissinos.mp3'); // Som do fim do processo
 
 // Sons para o Fight Mode
 const somInicioTreinoFight = new Audio('som/sinoboxe.mp3');
 const somFimTreinoFight = new Audio('som/doissinos.mp3');
 const somInicioDescansoFight = new Audio('som/whoosh.mp3');
 const somFimDescansoFight = new Audio('som/pop.mp3');
 const somAlertaFight = new Audio('som/3batidasmadeira.mp4');

 // Sons para o Hit Mode
 const somInicioTreinoHit = new Audio('som/comecar.mp4');
 const somFimTreinoHit = new Audio('som/1sinobike.mp4');
 const somInicioDescansoHit = new Audio('som/respira2x.mp4');
 const somFimDescansoHit = new Audio('som/whoosh.mp3');
 const somAlertaHit = new Audio('som/regressiva10.mp4'); 

 // Botões
 const startButton = document.getElementById('start');
 const pauseButton = document.getElementById('pause');
 const stopButton = document.getElementById('stop');

 // Funções auxiliares
 function formatarTempo(minutos, segundos) {
  const min = minutos < 10 ? '0' + minutos : minutos;
  const seg = segundos < 10 ? '0' + segundos : segundos;
  return min + ':' + seg;
 }

 // Função para reproduzir áudio de forma segura
 // Garante que o áudio comece do início e lida com possíveis erros de reprodução.
 // Não controla diretamente o áudio de outros aplicativos, mas melhora a robustez do nosso áudio.
 function playSafe(audioElement, volume = 0.75) {
  if (!audioElement) {
    console.warn('Attempted to play a null or undefined audio element.');
    return Promise.reject(new Error('Audio element is null or undefined.'));
  }
  audioElement.volume = volume; // Define o volume (pode ser ajustado se os sons estiverem muito altos)
  audioElement.currentTime = 0; // Garante que o som sempre comece do início
  return audioElement.play().catch(error => {
    // Este bloco catch lida com rejeições de Promise de audioElement.play()
    // Causas comuns: o navegador exige um gesto do usuário, políticas de autoplay, etc.
    console.error(`Error playing audio ${audioElement.src}:`, error);
    // Opcionalmente, você pode adicionar lógica de fallback aqui, como um feedback visual.
  });
 }

 // Função para alternar modos
 function setModo(modo) {
  modoAtual = modo;
  if (modo === 'fight') {
    modeFight.classList.add('active');
    modeHit.classList.remove('active');
    
    lblTreino.textContent = 'Round Time:';
    lblDescanso.textContent = 'Intervalo:';
    lblRepeticoes.textContent = 'Nº de Rounds:';

    document.body.classList.remove('hit-mode');
    document.body.classList.add('fight-mode');
    metaThemeColor.setAttribute('content', '#8b0000'); // Vermelho escuro
  } else {
    modeHit.classList.add('active');
    modeFight.classList.remove('active');
    
    lblTreino.textContent = 'Tempo de Treino:';
    lblDescanso.textContent = 'Descanso/Pausa:';
    lblRepeticoes.textContent = 'Nº de Repetições:';

    document.body.classList.remove('fight-mode');
    document.body.classList.add('hit-mode');
    metaThemeColor.setAttribute('content', '#003366'); // Azul escuro
  }
  atualizarDisplay();
 }

 modeFight.addEventListener('click', () => setModo('fight'));
 modeHit.addEventListener('click', () => setModo('hit'));

 function atualizarDisplay() {
  const textoTreino = modoAtual === 'fight' ? 'Round Time: ' : 'Tempo de Treino: ';
  const textoDescanso = modoAtual === 'fight' ? 'Intervalo: ' : 'Descanso/Pausa: ';
  const textoRepeticoes = modoAtual === 'fight' ? 'Rounds restantes: ' : 'Repetições restantes: ';

  tempoTreinoDisplay.textContent = textoTreino + formatarTempo(parseInt(treinoMinutos.value), parseInt(treinoSegundos.value));
  tempoDescansoDisplay.textContent = textoDescanso + formatarTempo(parseInt(descansoMinutos.value), parseInt(descansoSegundos.value));
  repeticoesDisplay.textContent = textoRepeticoes + repeticoesInput.value;
 }

 // Função para solicitar o bloqueio de tela
 const requestWakeLock = async () => {
  try {
    if ('wakeLock' in navigator) {
      wakeLock = await navigator.wakeLock.request('screen');
      console.log('Screen Wake Lock ativado.');
    }
  } catch (err) {
    console.error(`${err.name}, ${err.message}`);
  }
 };
 
 // Função para liberar o bloqueio de tela
 const releaseWakeLock = async () => {
  if (wakeLock !== null) {
    await wakeLock.release();
    wakeLock = null;
    console.log('Screen Wake Lock liberado.');
  }
 };

 async function iniciarTemporizador() {
  // Se estiver parado, inicia um novo ciclo do zero
  if (estado === 'parado') {
    // Troca Configuração por Propaganda com animação
    configSection.style.display = 'none';
    propagandaSection.style.display = 'flex'; // Alterado para flex para centralizar imagens
    propagandaSection.classList.remove('animar-saida');
    propagandaSection.classList.add('animar-entrada');

    // Inicia a rotação das propagandas
    indicePropaganda = 0;
    propagandaImg.src = imagensPropaganda[indicePropaganda]; // Garante o início na primeira
    propagandaImg.classList.remove('img-fade-out', 'img-slide-in'); // Limpa classes anteriores

    intervaloPropaganda = setInterval(() => {
      // 1. Efeito de saída (perde cor e some)
      propagandaImg.classList.add('img-fade-out');

      setTimeout(() => {
        if (estado !== 'rodando') return; // Previne execução se parou
        // 2. Troca a imagem
        indicePropaganda++;
        if (indicePropaganda >= imagensPropaganda.length) {
          indicePropaganda = 0;
        }
        propagandaImg.src = imagensPropaganda[indicePropaganda];

        // 3. Remove saída e adiciona entrada (desliza de cima)
        propagandaImg.classList.remove('img-fade-out');
        propagandaImg.classList.add('img-slide-in');

        // 4. Limpa classe de entrada após animação
        setTimeout(() => {
          propagandaImg.classList.remove('img-slide-in');
        }, 500);
      }, 500); // Espera 500ms do fade out
    }, 10000); // Troca a cada 10 segundos (10000ms)

    entrarTelaCheia(); // Entra em tela cheia ao iniciar
    estado = 'rodando';
    repeticoesRestantes = parseInt(repeticoesInput.value);
    ciclo = 'treino';
    treinoTempoRestante = parseInt(treinoMinutos.value) * 60 + parseInt(treinoSegundos.value);
    descansoTempoRestante = parseInt(descansoMinutos.value) * 60 + parseInt(descansoSegundos.value);
    tempoTotalTreinoInicial = treinoTempoRestante;

    await requestWakeLock(); // Impede a tela de apagar
    playSafe(somInicioGlobal); // Toca o som único de início de forma segura
    somInicioGlobal.onended = async function() { // Adicionado async aqui para permitir await dentro
      if (estado === 'rodando') {
        // Usamos playSafe aqui para garantir que os sons de início de treino/round sejam robustos
        if (modoAtual === 'fight') await playSafe(somInicioTreinoFight); else await playSafe(somInicioTreinoHit);
        intervalo = setInterval(tick, 1000);
        tick(); // Chama o tick imediatamente para atualizar a UI sem delay de 1s
      }
    };
  } 
  // Se estiver pausado, apenas continua
  else if (estado === 'pausado') {
    await requestWakeLock(); // Reativa o bloqueio ao continuar
    estado = 'rodando';
  }
 }
 
 function tick() {
  if (estado !== 'rodando') return;

  const textoTreino = modoAtual === 'fight' ? 'Round Time: ' : 'Tempo de Treino: ';
  const textoDescanso = modoAtual === 'fight' ? 'Intervalo: ' : 'Descanso/Pausa: ';
  const textoRepeticoes = modoAtual === 'fight' ? 'Rounds restantes: ' : 'Repetições restantes: ';

  repeticoesDisplay.textContent = textoRepeticoes + repeticoesRestantes;

  if (ciclo === 'treino') {
    if (treinoTempoRestante > 0) {
      let minutos = Math.floor(treinoTempoRestante / 60);
      let segundos = treinoTempoRestante % 60;
      tempoTreinoDisplay.textContent = textoTreino + formatarTempo(minutos, segundos);
      
      // Condição para o som de alerta
      if (treinoTempoRestante === 11 && tempoTotalTreinoInicial > 15) {
        // Usando playSafe para os alertas
        if (modoAtual === 'fight') {
          playSafe(somAlertaFight);
        } else { // modoAtual === 'hit'
          playSafe(somAlertaHit);
        }
      }
      treinoTempoRestante--;
    } else {
      if (modoAtual === 'fight') {
        playSafe(somFimTreinoFight);
      } else {
        playSafe(somFimTreinoHit);
      }

      if (repeticoesRestantes === 1) {
        repeticoesRestantes--;
        repeticoesDisplay.textContent = textoRepeticoes + repeticoesRestantes;
        
        // Toca o som final global
        playSafe(somFimGlobal);

        pararTemporizador();
      } else {
        if (modoAtual !== 'fight') playSafe(somInicioDescansoHit);
        ciclo = 'descanso';
        // Reseta o display do tempo de treino para o próximo ciclo
        tempoTreinoDisplay.textContent = textoTreino + formatarTempo(parseInt(treinoMinutos.value), parseInt(treinoSegundos.value));
      }
    }
  } else { // ciclo === 'descanso'
    if (descansoTempoRestante > 0) {
      let minutos = Math.floor(descansoTempoRestante / 60);
      let segundos = descansoTempoRestante % 60;
      tempoDescansoDisplay.textContent = textoDescanso + formatarTempo(minutos, segundos);
      descansoTempoRestante--;
    } else {
      // Usamos playSafe para o som de fim de descanso
      if (modoAtual !== 'fight') playSafe(somFimDescansoHit);
      repeticoesRestantes--;
      if (repeticoesRestantes > 0) {
        // Usamos playSafe para o som de início do próximo treino/round
        if (modoAtual === 'fight') {
          playSafe(somInicioTreinoFight);
        } else {
          playSafe(somInicioTreinoHit);
        }
        ciclo = 'treino';
        treinoTempoRestante = parseInt(treinoMinutos.value) * 60 + parseInt(treinoSegundos.value);
        descansoTempoRestante = parseInt(descansoMinutos.value) * 60 + parseInt(descansoSegundos.value);
        // Reseta o display do tempo de descanso para o próximo ciclo
        tempoDescansoDisplay.textContent = textoDescanso + formatarTempo(parseInt(descansoMinutos.value), parseInt(descansoSegundos.value));
      } else {
        // Caso de segurança para fim do processo (embora geralmente acabe no treino)
        // Corrigido: somFimGlobal1 para somFimGlobal e usando playSafe
        playSafe(somFimGlobal);
        pararTemporizador();
      }
    }
  }
 }

 function pausarTemporizador() {
  if (estado === 'rodando') {
    estado = 'pausado';
    releaseWakeLock(); // Permite que a tela apague ao pausar
  }
 }

 function pararTemporizador() {
  estado = 'parado';
  clearInterval(intervalo);
  clearInterval(intervaloPropaganda); // Para a rotação das propagandas
  propagandaImg.classList.remove('img-fade-out', 'img-slide-in'); // Limpa efeitos de imagem
  releaseWakeLock(); // Libera o bloqueio ao parar

  // Animação de saída da propaganda
  propagandaSection.classList.remove('animar-entrada');
  propagandaSection.classList.add('animar-saida');

  // Aguarda a animação terminar (500ms) para trocar os containers
  setTimeout(() => {
    if (estado === 'parado') { // Verifica se ainda está parado para evitar conflito se reiniciar rápido
      propagandaSection.style.display = 'none';
      configSection.style.display = 'block';
    }
  }, 500);

  atualizarDisplay();
 }

 // Event listeners para os botões
 startButton.addEventListener('click', iniciarTemporizador);
 pauseButton.addEventListener('click', pausarTemporizador);
 stopButton.addEventListener('click', pararTemporizador);

 // Event listeners para os campos de tempo com debounce
 const inputsTempo = [treinoMinutos, treinoSegundos, descansoMinutos, descansoSegundos, repeticoesInput];
 inputsTempo.forEach(input => {
  input.addEventListener('input', () => {
    // Limpa o temporizador anterior se o usuário continuar digitando
    clearTimeout(debounceTimeout);
    // Define um novo temporizador para atualizar o display após 2 segundos
    debounceTimeout = setTimeout(() => {
      if (estado === 'parado') atualizarDisplay();
    }, 500); // 500 milissegundos = 0.5 segundos
  });
 });

 // Inicializar o display
 atualizarDisplay();
