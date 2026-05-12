let socket;
let mensajesNoLeidos = 0;
let chatAbierto = false;
let empresaIdActual;

function cargarSidebar(paginaActiva) {
  const rol = localStorage.getItem('rol');
  const nombre = localStorage.getItem('nombre');
  const token = localStorage.getItem('token');

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
        <button onclick="toggleModo()" id="btnModo" style="background: var(--morado-claro); border: none; border-radius: 12px; width: 40px; height: 20px; cursor: pointer; position: relative; transition: all 0.3s;">
          <span id="indicadorModo" style="position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; background: white; border-radius: 50%; transition: all 0.3s;"></span>
        </button>
        <span id="textoModo" style="font-size: 10px; color: var(--texto-suave); font-family: 'Share Tech Mono', monospace;">DARK</span>
      </div>
    </nav>

    <div id="chat-flotante" style="position: fixed; bottom: 24px; right: 24px; z-index: 1000;">
      <div id="chat-ventana" style="display:none; width: 360px; height: 520px; background: var(--morado-oscuro); border: 1px solid #4a1a8a; border-radius: 4px; flex-direction: column; box-shadow: 0 0 40px rgba(124,58,237,0.2);">
        <div style="padding: 16px; border-bottom: 1px solid var(--borde); display: flex; justify-content: space-between; align-items: center;">
          <div>
            <span style="font-family: 'Share Tech Mono', monospace; font-size: 12px; color: #a855f7; letter-spacing: 2px;">SOPORTE SECUPYME</span>
            <p id="onlineIndicador" style="font-size: 10px; color: #10b981; margin-top: 2px;">● En línea</p>
          </div>
          <div style="display: flex; gap: 8px; align-items: center;">
            <button onclick="borrarChat()" style="background: none; border: none; color: #6b5a8a; cursor: pointer; font-size: 14px;" title="Borrar historial">🗑</button>
            <button onclick="toggleChat()" style="background: none; border: none; color: #6b5a8a; cursor: pointer; font-size: 16px;">✕</button>
          </div>
        </div>
        <div id="chat-mensajes" style="flex: 1; overflow-y: auto; padding: 16px;"></div>
        <div style="padding: 12px; border-top: 1px solid var(--borde);">
          <select id="chat-reporte" style="width: 100%; margin-bottom: 8px; font-size: 11px;">
            <option value="">Sin reporte relacionado</option>
          </select>
          <div style="display: flex; gap: 8px;">
            <input type="text" id="chat-texto" placeholder="Escribe un mensaje..." style="flex: 1; font-size: 12px;" onkeypress="if(event.key==='Enter') enviarChatMensaje()">
            <button onclick="enviarChatMensaje()" style="background: #7c3aed; border: none; color: white; padding: 8px 14px; cursor: pointer; font-family: 'Share Tech Mono', monospace; font-size: 11px; border-radius: 2px;">→</button>
          </div>
        </div>
      </div>
      <button onclick="toggleChat()" id="chat-btn" style="width: 52px; height: 52px; background: #7c3aed; border: none; border-radius: 50%; color: white; font-size: 22px; cursor: pointer; box-shadow: 0 0 20px rgba(124,58,237,0.4); position: relative;">
        💬
        <span id="badge-noLeidos" style="display:none; position: absolute; top: -4px; right: -4px; background: #ef4444; color: white; border-radius: 50%; width: 18px; height: 18px; font-size: 10px; font-family: 'Share Tech Mono', monospace; line-height: 18px; text-align: center;"></span>
      </button>
    </div>
  `;

  document.getElementById('sidebar-container').innerHTML = sidebar;

  inicializarModo();
  inicializarSocket();
  cargarReportesChat();
  cargarChatMensajes();
}

function inicializarSocket() {
  const token = localStorage.getItem('token');
  const rol = localStorage.getItem('rol');

  socket = io();

  const payload = JSON.parse(atob(token.split('.')[1]));
  empresaIdActual = payload.id;

  socket.emit('identificar', {
    userId: payload.id,
    empresaId: payload.id,
    rol: rol,
    nombre: localStorage.getItem('nombre')
  });

  socket.on('nuevoMensaje', (mensaje) => {
    const esMio = mensaje.usuario._id === empresaIdActual || mensaje.usuario.id === empresaIdActual;

    if (!chatAbierto && !esMio) {
      mensajesNoLeidos++;
      actualizarBadge();
      reproducirSonido();
    }

    if (chatAbierto) {
      agregarMensajeAlChat(mensaje);
    }
  });

  socket.on('usuariosOnline', (total) => {
    const indicador = document.getElementById('onlineIndicador');
    if (indicador) indicador.textContent = `● ${total} en línea`;
  });
}

function reproducirSonido() {
  try {
    const audio = new Audio('/notificacion.mp3');
    audio.volume = 0.3;
    audio.play();
  } catch (e) {}
}

function actualizarBadge() {
  const badge = document.getElementById('badge-noLeidos');
  if (!badge) return;
  if (mensajesNoLeidos > 0) {
    badge.style.display = 'block';
    badge.textContent = mensajesNoLeidos > 9 ? '9+' : mensajesNoLeidos;
  } else {
    badge.style.display = 'none';
  }
}

function agregarMensajeAlChat(m) {
  const contenedor = document.getElementById('chat-mensajes');
  if (!contenedor) return;
  const rol = localStorage.getItem('rol');
  const esYo = m.usuario.rol === rol;
  const fecha = new Date(m.fecha).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  contenedor.innerHTML += `
    <div style="margin-bottom: 10px; text-align: ${esYo ? 'right' : 'left'};">
      <span style="font-size: 9px; color: #6b5a8a;">${m.usuario.nombre} · ${fecha}</span>
      ${m.reporteRelacionado ? `<div style="font-size: 9px; color: #a855f7; margin-bottom: 2px;">📎 ${m.reporteRelacionado.empresa}</div>` : ''}
      <div style="display: inline-block; background: ${esYo ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.05)'}; border: 1px solid ${esYo ? '#7c3aed' : '#1a0a2e'}; padding: 6px 12px; border-radius: 2px; margin-top: 2px; font-size: 12px; max-width: 85%; word-break: break-word;">
        ${m.texto}
      </div>
    </div>
  `;
  contenedor.scrollTop = contenedor.scrollHeight;
}

function toggleChat() {
  chatAbierto = !chatAbierto;
  const ventana = document.getElementById('chat-ventana');
  ventana.style.display = chatAbierto ? 'flex' : 'none';
  if (chatAbierto) {
    mensajesNoLeidos = 0;
    actualizarBadge();
    cargarChatMensajes();
  }
}

async function borrarChat() {
  if (!confirm('¿Borrar el historial de este chat?')) return;
  const token = localStorage.getItem('token');
  await fetch('/api/chat/borrar', {
    method: 'DELETE',
    headers: { 'authorization': token }
  });
  cargarChatMensajes();
}

async function cargarReportesChat() {
  const token = localStorage.getItem('token');
  try {
    const response = await fetch('/api/chat/reportes', { headers: { 'authorization': token } });
    const reportes = await response.json();
    const select = document.getElementById('chat-reporte');
    if (!select) return;
    reportes.forEach(r => {
      select.innerHTML += `<option value="${r._id}">${r.empresa} — ${r.tipoVulnerabilidad}</option>`;
    });
  } catch (e) {}
}

async function cargarChatMensajes() {
  const token = localStorage.getItem('token');
  const rol = localStorage.getItem('rol');
  try {
    const response = await fetch('/api/chat', { headers: { 'authorization': token } });
    const mensajes = await response.json();
    const contenedor = document.getElementById('chat-mensajes');
    if (!contenedor) return;
    contenedor.innerHTML = '';

    contenedor.innerHTML += `
      <div style="margin-bottom: 12px; text-align: left;">
        <div style="display: inline-block; background: rgba(124,58,237,0.15); border: 1px solid #4a1a8a; padding: 8px 14px; border-radius: 2px; font-size: 11px; color: #a855f7; max-width: 95%; line-height: 1.6;">
          👋 Gracias por comunicarte con SecuPyme. En un momento, uno de nuestros expertos se comunicará contigo.
        </div>
      </div>
    `;

    mensajes.forEach(m => agregarMensajeAlChat(m));
  } catch (e) {}
}

async function enviarChatMensaje() {
  const texto = document.getElementById('chat-texto').value;
  const reporteRelacionado = document.getElementById('chat-reporte').value;
  if (!texto || !socket) return;

  const token = localStorage.getItem('token');
  const payload = JSON.parse(atob(token.split('.')[1]));

  socket.emit('mensajeChat', {
    userId: payload.id,
    empresaId: payload.id,
    texto,
    reporteRelacionado: reporteRelacionado || null
  });

  document.getElementById('chat-texto').value = '';
}

function inicializarModo() {
  const modoGuardado = localStorage.getItem('modo') || 'dark';
  aplicarModo(modoGuardado);
}

function toggleModo() {
  const modoActual = localStorage.getItem('modo') || 'dark';
  const nuevoModo = modoActual === 'dark' ? 'light' : 'dark';
  localStorage.setItem('modo', nuevoModo);
  aplicarModo(nuevoModo);
}

function aplicarModo(modo) {
  const root = document.documentElement;
  const indicador = document.getElementById('indicadorModo');
  const texto = document.getElementById('textoModo');

  if (modo === 'light') {
    root.style.setProperty('--negro', '#f8f7ff');
    root.style.setProperty('--morado-oscuro', '#f0ebff');
    root.style.setProperty('--morado', '#7c3aed');
    root.style.setProperty('--morado-claro', '#7c3aed');
    root.style.setProperty('--acento', '#6d28d9');
    root.style.setProperty('--acento-brillante', '#7c3aed');
    root.style.setProperty('--texto', '#1a0a2e');
    root.style.setProperty('--texto-suave', '#6b5a8a');
    root.style.setProperty('--borde', '#e8e0f5');
    if (indicador) {
      indicador.style.left = '22px';
      indicador.style.background = '#7c3aed';
    }
    if (texto) texto.textContent = 'LIGHT';
  } else {
    root.style.setProperty('--negro', '#050508');
    root.style.setProperty('--morado-oscuro', '#0d0618');
    root.style.setProperty('--morado', '#4a1a8a');
    root.style.setProperty('--morado-claro', '#7c3aed');
    root.style.setProperty('--acento', '#a855f7');
    root.style.setProperty('--acento-brillante', '#d946ef');
    root.style.setProperty('--texto', '#e2d9f3');
    root.style.setProperty('--texto-suave', '#6b5a8a');
    root.style.setProperty('--borde', '#1a0a2e');
    if (indicador) {
      indicador.style.left = '2px';
      indicador.style.background = 'white';
    }
    if (texto) texto.textContent = 'DARK';
  }
}

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
