// =================== THEME TOGGLE GLOBAL ===================
(function() {
  const modo = localStorage.getItem('modo');
  if (modo === 'light') document.body.classList.add('light');
  else if (modo === 'dark') document.body.classList.add('dark');

  function crearToggle() {
    if (document.getElementById('theme-toggle-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'theme-toggle-btn';
    btn.style.cssText = 'position:fixed;bottom:28px;left:28px;z-index:99990;background:rgba(124,58,237,0.2);border:1px solid rgba(124,58,237,0.4);border-radius:50%;width:44px;height:44px;cursor:pointer;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(8px);transition:background 0.2s;box-shadow:0 2px 12px rgba(0,0,0,0.3);';
    btn.title = 'Cambiar modo';

    function getIcono() {
      return document.body.classList.contains('light')
        ? '<svg width="18" height="18" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="2.5" stroke="#eab308" stroke-width="1.1"/><path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M2.5 2.5l1 1M10.5 10.5l1 1M2.5 11.5l1-1M10.5 3.5l1-1" stroke="#eab308" stroke-width="1" stroke-linecap="round"/></svg>'
        : '<svg width="18" height="18" viewBox="0 0 14 14" fill="none"><path d="M11.5 9A5 5 0 015 2.5a5 5 0 100 9 5 5 0 006.5-2.5z" stroke="#9d86c8" stroke-width="1.1" stroke-linejoin="round"/></svg>';
    }

    btn.innerHTML = getIcono();

    btn.onclick = function() {
      const esLight = document.body.classList.contains('light');
      if (esLight) {
        document.body.classList.remove('light');
        document.body.classList.add('dark');
        localStorage.setItem('modo', 'dark');
      } else {
        document.body.classList.add('light');
        document.body.classList.remove('dark');
        localStorage.setItem('modo', 'light');
      }
      btn.innerHTML = getIcono();
    };

    btn.onmouseover = () => btn.style.background = 'rgba(124,58,237,0.4)';
    btn.onmouseout = () => btn.style.background = 'rgba(124,58,237,0.2)';

    document.body.appendChild(btn);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', crearToggle);
  } else {
    crearToggle();
  }
})();
