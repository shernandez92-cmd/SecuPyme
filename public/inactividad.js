let timerAviso;
let timerCierre;

function resetTimer() {
  clearTimeout(timerAviso);
  clearTimeout(timerCierre);

  timerAviso = setTimeout(() => {
    const continuar = confirm('¿Sigues en línea? Tu sesión se cerrará en 5 minutos por inactividad.');
    if (!continuar) {
      localStorage.clear();
      window.location.href = '/';
    }
  }, 5 * 60 * 1000);

  timerCierre = setTimeout(() => {
    alert('Tu sesión ha expirado por inactividad.');
    localStorage.clear();
    window.location.href = '/';
  }, 10 * 60 * 1000);
}

['mousemove', 'keypress', 'click', 'scroll', 'touchstart'].forEach(event => {
  document.addEventListener(event, resetTimer);
});

resetTimer();
