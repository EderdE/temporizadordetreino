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

 // Variáveis para controle do temporizador
 let repeticoesRestantes;
 let intervalo;
 let estado = 'parado'; // pode ser 'parado', 'rodando', 'pausado'
 let ciclo = 'treino';
 let debounceTimeout; // Variável para o temporizador do ajuste
 let wakeLock = null; // Variável para o Screen Wake Lock
 // Áudios
 const somInicio = new Audio('umsino.mp3');
 const somFimPeriodo = new Audio('doissinos.mp3');

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

 function atualizarDisplay() {
  tempoTreinoDisplay.textContent = 'Tempo de Treino: ' + formatarTempo(parseInt(treinoMinutos.value), parseInt(treinoSegundos.value));
  tempoDescansoDisplay.textContent = 'Descanso/Pausa: ' + formatarTempo(parseInt(descansoMinutos.value), parseInt(descansoSegundos.value));
  repeticoesDisplay.textContent = 'Repetições restantes: ' + repeticoesInput.value;
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
    entrarTelaCheia(); // Entra em tela cheia ao iniciar
    estado = 'rodando';
    repeticoesRestantes = parseInt(repeticoesInput.value);
    ciclo = 'treino';
    treinoTempoRestante = parseInt(treinoMinutos.value) * 60 + parseInt(treinoSegundos.value);
    descansoTempoRestante = parseInt(descansoMinutos.value) * 60 + parseInt(descansoSegundos.value);
    repeticoesDisplay.textContent = 'Repetições restantes: ' + repeticoesRestantes;

    await requestWakeLock(); // Impede a tela de apagar
    somInicio.play(); // Toca o som de início
    // Inicia o loop do temporizador
    intervalo = setInterval(tick, 1000);
  } 
  // Se estiver pausado, apenas continua
  else if (estado === 'pausado') {
    await requestWakeLock(); // Reativa o bloqueio ao continuar
    estado = 'rodando';
  }
 }
 
 function tick() {
    if (estado !== 'rodando') return;

    if (ciclo === 'treino') {
        if (treinoTempoRestante > 0) {
            treinoTempoRestante--;
            let minutos = Math.floor(treinoTempoRestante / 60);
            let segundos = treinoTempoRestante % 60;
            tempoTreinoDisplay.textContent = 'Tempo de Treino: ' + formatarTempo(minutos, segundos);
        } else {
            // Fim do treino, inicia o descanso
            ciclo = 'descanso';
            // Reseta o tempo de descanso para o próximo ciclo
            somFimPeriodo.play(); // Toca o som de fim de período
            descansoTempoRestante = parseInt(descansoMinutos.value) * 60 + parseInt(descansoSegundos.value);
            tempoDescansoDisplay.textContent = 'Descanso/Pausa: ' + formatarTempo(parseInt(descansoMinutos.value), parseInt(descansoSegundos.value));
        }
    } else { // ciclo === 'descanso'
        if (descansoTempoRestante > 0) {
            descansoTempoRestante--;
            let minutos = Math.floor(descansoTempoRestante / 60);
            let segundos = descansoTempoRestante % 60;
            tempoDescansoDisplay.textContent = 'Descanso/Pausa: ' + formatarTempo(minutos, segundos);
        } else {
            // Fim do descanso
            repeticoesRestantes--;
            if (repeticoesRestantes > 0) {
                repeticoesDisplay.textContent = 'Repetições restantes: ' + repeticoesRestantes;
                // Inicia nova repetição
                somFimPeriodo.play(); // Toca o som de fim de período (fim do descanso)
                ciclo = 'treino';
                treinoTempoRestante = parseInt(treinoMinutos.value) * 60 + parseInt(treinoSegundos.value);
                tempoTreinoDisplay.textContent = 'Tempo de Treino: ' + formatarTempo(parseInt(treinoMinutos.value), parseInt(treinoSegundos.value));
            } else {
                // Fim de todas as repetições
                repeticoesDisplay.textContent = 'Repetições restantes: 0';
                somFimPeriodo.play(); // Toca o som no fim do programa
                pararTemporizador();
                // alert('Temporizador Concluído!'); // Removido para não sair da tela cheia
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
  releaseWakeLock(); // Libera o bloqueio ao parar
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
      atualizarDisplay();
    }, 5000); // 5000 milissegundos = 5 segundos
  });
 });

 // Inicializar o display
 atualizarDisplay();
