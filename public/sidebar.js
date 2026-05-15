// Variables globales
let socket;
let empresaIdActual;
let mensajesNoLeidos = 0;

// =================== SIDEBAR ===================
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
  inicializarSocket();
}

// =================== MODO ===================
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

// =================== SESION ===================
function confirmarCerrarSesion() {
  if (confirm('¿Seguro que deseas cerrar sesión?')) {
    if (socket) socket.disconnect();
    localStorage.clear();
    window.location.href = '/';
  }
}

function cerrarSesion() {
  confirmarCerrarSesion();
}

// =================== SOCKET ===================
function inicializarSocket() {
  const token = localStorage.getItem('token');
  if (!token) return;
  if (socket && socket.connected) return;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    empresaIdActual = payload.id;

    socket = io();

    socket.on('connect', () => {
      console.log('Socket conectado:', socket.id);
      socket.emit('identificar', {
        userId: payload.id,
        empresaId: payload.id,
        nombre: localStorage.getItem('nombre'),
        rol: localStorage.getItem('rol')
      });
    });

    socket.on('nuevoMensaje', (mensaje) => {
      const esMio = mensaje.usuario._id === empresaIdActual || mensaje.usuario.id === empresaIdActual;

      if (!esMio) {
        mensajesNoLeidos++;
        actualizarBadge();
        reproducirSonido();
      }

      const ventana = document.getElementById('chat-ventana');
      agregarMensajeDOM(mensaje);
    });

    socket.on('disconnect', () => {
      console.log('Socket desconectado');
    });

  } catch (e) {
    console.error('Error inicializando socket:', e);
  }
}

// =================== CHAT DOM ===================
function agregarMensajeDOM(m) {
  const contenedor = document.getElementById('chat-mensajes');
  if (!contenedor) return;
  const esYo = m.usuario._id === empresaIdActual || m.usuario.id === empresaIdActual;
  const fecha = new Date(m.fecha).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  contenedor.innerHTML += `
    <div style="margin-bottom: 10px; text-align: ${esYo ? 'right' : 'left'};">
      <span style="font-size: 9px; color: #6b5a8a;">${m.usuario.nombre} · ${fecha}</span>
      <div style="display: inline-block; background: ${esYo ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.05)'}; border: 1px solid ${esYo ? '#7c3aed' : 'var(--borde)'}; padding: 6px 12px; border-radius: 2px; margin-top: 2px; font-size: 12px; max-width: 85%; word-break: break-word;">
        ${m.texto}
      </div>
    </div>
  `;
  contenedor.scrollTop = contenedor.scrollHeight;
}

function actualizarBadge() {
  const badge = document.getElementById('badge-noLeidos');
  if (!badge) return;
  badge.style.display = mensajesNoLeidos > 0 ? 'block' : 'none';
  badge.textContent = mensajesNoLeidos > 9 ? '9+' : mensajesNoLeidos;
}

function reproducirSonido() {
  try {
    const audio = new Audio('/notificacion.mp3');
    audio.volume = 0.3;
    audio.play();
  } catch (e) {}
}