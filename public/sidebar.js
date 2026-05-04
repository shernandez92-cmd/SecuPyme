function cargarSidebar(paginaActiva) {
  const rol = localStorage.getItem('rol');
  const nombre = localStorage.getItem('nombre');

  const menuAdmin = rol === 'admin' ? `
    <li class="${paginaActiva === 'admin' ? 'active' : ''}">
      <a href="/admin.html">PANEL ADMIN</a>
    </li>` : '';

  const sidebar = `
    <nav class="sidebar">
      <div class="sidebar-logo">
        <h1>SECUPYME</h1>
        <p>PROTECCIÓN DIGITAL</p>
      </div>
      <ul class="sidebar-menu">
        <li class="${paginaActiva === 'dashboard' ? 'active' : ''}">
          <a href="/dashboard.html">DASHBOARD</a>
        </li>
        <li class="${paginaActiva === 'reportes' ? 'active' : ''}">
          <a href="/reportes.html">REPORTES</a>
        </li>
        <li class="${paginaActiva === 'historial' ? 'active' : ''}">
          <a href="/historial.html">HISTORIAL</a>
        </li>
        <li class="${paginaActiva === 'autoevaluacion' ? 'active' : ''}">
          <a href="/autoevaluacion.html">AUTOEVALUACIÓN</a>
        </li>
        ${menuAdmin}
        <li>
          <a href="#" onclick="cerrarSesion()">CERRAR SESIÓN</a>
        </li>
      </ul>
      <div class="sidebar-user">
        <p id="nombreUsuario">${nombre}</p>
        <span id="rolUsuario">${rol ? rol.toUpperCase() : ''}</span>
      </div>
    </nav>
  `;

  document.getElementById('sidebar-container').innerHTML = sidebar;
}

function cerrarSesion() {
  localStorage.clear();
  window.location.href = '/';
}
