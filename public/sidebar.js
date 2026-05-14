function cargarSidebar(paginaActiva) {
  const rol = localStorage.getItem('rol');
  const nombre = localStorage.getItem('nombre');

  const menuAdmin = rol === 'admin' ? `
    <li class="${paginaActiva === 'admin' ? 'active' : ''}">
      <a href="/admin.html">PANEL ADMIN</a>
    </li>
    <li class="${paginaActiva === 'siem' ? 'active' : ''}">
      <a href="/siem.html">SIEM</a>
    </li>` : '';

  const sidebar = `
    <nav class="sidebar">
      <div class="sidebar-logo">
        <img src="/Logo.png" style="width: 130px; margin-bottom: 6px; display: block;">
        <p style="font-family: 'Share Tech Mono', monospace; font-size: 9px; color: #6b5a8a; letter-spacing: 2px;">CIBERSEGURIDAD SIMPLIFICADA</p>
      </div>
      <ul class="sidebar-menu">
        <li class="${paginaActiva === 'dashboard' ? 'active' : ''}"><a href="/dashboard.html">DASHBOARD</a></li>
        <li class="${paginaActiva === 'reportes' ? 'active' : ''}"><a href="/reportes.html">REPORTES</a></li>
        <li class="${paginaActiva === 'historial' ? 'active' : ''}"><a href="/historial.html">HISTORIAL</a></li>
        <li class="${paginaActiva === 'autoevaluacion' ? 'active' : ''}"><a href="/autoevaluacion.html">AUTOEVALUACIÓN</a></li>
        <li class="${paginaActiva === 'membresias' ? 'active' : ''}"><a href="/membresias.html">MEMBRESÍAS</a></li>
        ${menuAdmin}
        <li><a href="#" onclick="confirmarCerrarSesion()">CERRAR SESIÓN</a></li>
      </ul>
      <div class="sidebar-user">
        <p>${nombre}</p>
        <span>${rol ? rol.toUpperCase() : ''}</span>
      </div>
      <div style="padding: 12px 24px; border-top: 1px solid var(--borde); display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 10px; color: var(--texto-suave); font-family: 'Share Tech Mono', monospace;">MODO</span>
        <button onclick="toggleModo()" style="background: var(--morado-claro); border: none; border-radius: 12px; width: 40px; height: 20px; cursor: pointer; position: relative;">
          <span id="toggleIndicador" style="position: absolute; top: 2px; left: ${localStorage.getItem('modo') === 'light' ? '22px' : '2px'}; width: 16px; height: 16px; background: white; border-radius: 50%; transition: left 0.3s;"></span>
        </button>
        <span style="font-size: 10px; color: var(--texto-suave); font-family: 'Share Tech Mono', monospace;">${localStorage.getItem('modo') === 'light' ? 'LIGHT' : 'DARK'}</span>
      </div>
    </nav>
  `;

  document.getElementById('sidebar-container').innerHTML = sidebar;
  inicializarModo();
  inicializarChat();
document.addEventListener('DOMContentLoaded', () => {
  inicializarSocket();
});
}

function inicializarModo() {
  const modo = localStorage.getItem('modo') || 'dark';
  if (modo === 'light') document.body.classList.add('light');
}

function toggleModo() {
  const esLight = document.body.classList.contains('light');
  const indicador = document.getElementById('toggleIndicador');
  if (esLight) {
    document.body.classList.remove('light');
    localStorage.setItem('modo', 'dark');
    if (indicador) indicador.style.left = '2px';
  } else {
    document.body.classList.add('light');
    localStorage.setItem('modo', 'light');
    if (indicador) indicador.style.left = '22px';
  }
}

function confirmarCerrarSesion() {
  if (confirm('¿Seguro que deseas cerrar sesión?')) {
    localStorage.clear();
    window.location.href = '/';
  }
}

function cerrarSesion() {
  confirmarCerrarSesion();
}