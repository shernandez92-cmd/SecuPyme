// Variables globales
let socket;
let empresaIdActual;
let mensajesNoLeidos = 0;

// =================== SIDEBAR ===================
function cargarSidebar(paginaActiva) {
  // Hamburguesa móvil
  if (!document.getElementById('hamburguesa-overlay')) {
    const overlay = document.createElement('div');
    overlay.id = 'hamburguesa-overlay';
    overlay.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:998;';
    overlay.onclick = () => cerrarHamburguesa();
    document.body.appendChild(overlay);
  }
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
      <div class="sidebar-logo" style="position: relative;">
        <img src="/Logo.png" style="width: 130px; margin-bottom: 6px; display: block;">
        <p style="font-family: 'Share Tech Mono', monospace; font-size: 9px; color: #6b5a8a; letter-spacing: 2px;">CIBERSEGURIDAD SIMPLIFICADA</p>
        <button onclick="Notificaciones.abrirPanel()" style="position: absolute; top: 0; right: 0; background: none; border: none; cursor: pointer; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;" title="Notificaciones">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="display:inline-block;vertical-align:middle"><path d="M8 2C5.8 2 4 3.8 4 6v3L2.5 11h11L12 9V6c0-2.2-1.8-4-4-4z" stroke="#9d86c8" stroke-width="1.1" stroke-linejoin="round"/><path d="M6.5 11v.5a1.5 1.5 0 003 0V11" stroke="#9d86c8" stroke-width="1.1"/></svg>
          <span id="notif-badge-total" style="display: none; position: absolute; top: 2px; right: 2px; background: #ef4444; color: white; font-family: 'Share Tech Mono', monospace; font-size: 8px; font-weight: bold; min-width: 16px; height: 16px; border-radius: 8px; padding: 0 3px; align-items: center; justify-content: center;">0</span>
        </button>
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
        <button onclick="typeof abrirModal2FA === 'function' && abrirModal2FA()" style="margin-top:10px;width:100%;padding:8px;background:transparent;border:1px solid #7c3aed66;color:#7c3aed;font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:2px;cursor:pointer;border-radius:3px;transition:border-color 0.2s;" onmouseover="this.style.borderColor='#7c3aed'" onmouseout="this.style.borderColor='#7c3aed66'">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="display:inline-block;vertical-align:middle"><rect x="4" y="7.5" width="8" height="6" rx="1" stroke="#7c3aed" stroke-width="1.1"/><path d="M5.5 7.5V5a2.5 2.5 0 015 0v2.5" stroke="#7c3aed" stroke-width="1.1" stroke-linecap="round"/><circle cx="8" cy="10.5" r="1" fill="#7c3aed"/></svg> CONFIGURAR 2FA
        </button>
      </div>
      <div style="padding: 12px 24px; border-top: 1px solid var(--borde); display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 10px; color: var(--texto-suave); font-family: 'Share Tech Mono', monospace;">MODO</span>
        <button onclick="toggleModo()" style="background: var(--morado-claro); border: none; border-radius: 12px; width: 40px; height: 20px; cursor: pointer; position: relative;">
          <span id="toggleIndicador" style="position: absolute; top: 2px; left: ${localStorage.getItem('modo') === 'light' ? '22px' : '2px'}; width: 16px; height: 16px; background: white; border-radius: 50%; transition: left 0.3s;"></span>
        </button>
        <span id="toggleIcono" style="font-size: 14px;">${localStorage.getItem('modo') === 'light' ? `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" style="display:inline-block;vertical-align:middle"><circle cx="7" cy="7" r="2.5" stroke="#eab308" stroke-width="1.1"/><path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M2.5 2.5l1 1M10.5 10.5l1 1M2.5 11.5l1-1M10.5 3.5l1-1" stroke="#eab308" stroke-width="1" stroke-linecap="round"/></svg>` : `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" style="display:inline-block;vertical-align:middle"><path d="M11.5 9A5 5 0 015 2.5a5 5 0 100 9 5 5 0 006.5-2.5z" stroke="#9d86c8" stroke-width="1.1" stroke-linejoin="round"/></svg>`}</span>
        <span id="toggleLabel" style="font-size: 10px; color: var(--texto-suave); font-family: 'Share Tech Mono', monospace;">${localStorage.getItem('modo') === 'light' ? 'LIGHT' : 'DARK'}</span>
      </div>
    </nav>
  `;

  document.getElementById('sidebar-container').innerHTML = sidebar;

  // Inyectar botón hamburguesa si no existe
  if (!document.getElementById('btn-hamburguesa')) {
    const btn = document.createElement('button');
    btn.id = 'btn-hamburguesa';
    btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" style="display:inline-block;vertical-align:middle"><path d="M3 5h12M3 9h12M3 13h12" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>`;
    btn.style.cssText = 'display:none;position:fixed;top:12px;left:12px;z-index:1000;background:var(--morado-oscuro);border:1px solid var(--morado-claro);color:var(--acento);font-size:20px;width:40px;height:40px;cursor:pointer;border-radius:2px;';
    btn.onclick = () => toggleHamburguesa();
    document.body.appendChild(btn);
  }

  // Header móvil fijo con logo + hamburguesa
  function checkMobile() {
    const btn = document.getElementById('btn-hamburguesa');
    const sidebar = document.querySelector('.sidebar');
    const main = document.querySelector('.main-content');
    if (!btn || !sidebar || !main) return;

    if (window.innerWidth <= 768) {
      // Crear header móvil si no existe
      if (!document.getElementById('mobile-header')) {
        const header = document.createElement('div');
        header.id = 'mobile-header';
        header.style.cssText = 'position:fixed;top:0;left:0;right:0;height:52px;background:var(--morado-oscuro);border-bottom:1px solid rgba(124,58,237,0.3);display:flex;align-items:center;justify-content:space-between;padding:0 16px;z-index:1000;';
        header.innerHTML = '<img src="/Logo.png" style="height:32px;"><button id="btn-hamburguesa-header" onclick="toggleHamburguesa()" style="background:none;border:1px solid rgba(124,58,237,0.4);color:var(--acento);font-size:18px;width:36px;height:36px;cursor:pointer;border-radius:2px;display:flex;align-items:center;justify-content:center;"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" style="display:inline-block;vertical-align:middle"><path d="M3 5h12M3 9h12M3 13h12" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg></button>';
        document.body.appendChild(header);
      }
      btn.style.display = 'none';
      sidebar.style.transform = 'translateX(-100%)';
      sidebar.style.position = 'fixed';
      sidebar.style.top = '52px';
      sidebar.style.left = '0';
      sidebar.style.height = 'calc(100vh - 52px)';
      sidebar.style.width = '260px';
      sidebar.style.zIndex = '999';
      sidebar.style.transition = 'transform 0.25s ease';
      sidebar.style.overflowY = 'auto';
      main.style.marginLeft = '0';
      main.style.paddingTop = '64px';
    } else {
      const mh = document.getElementById('mobile-header');
      if (mh) mh.remove();
      btn.style.display = 'none';
      sidebar.style.transform = '';
      sidebar.style.position = 'fixed';
      sidebar.style.top = '0';
      sidebar.style.height = '100vh';
      sidebar.style.width = '240px';
      main.style.marginLeft = '240px';
      main.style.paddingTop = '';
    }
  }

  checkMobile();
  window.addEventListener('resize', checkMobile);
  inicializarModo();
  inicializarChat();
  inicializarSocket();
  inicializarAsistenteIA();
  if (typeof Notificaciones !== 'undefined') Notificaciones.init();
}

function toggleHamburguesa() {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.getElementById('hamburguesa-overlay');
  const btnHeader = document.getElementById('btn-hamburguesa-header');
  if (!sidebar) return;
  const abierto = sidebar.style.transform === 'translateX(0px)' || sidebar.style.transform === 'translateX(0)';
  if (abierto) {
    sidebar.style.transform = 'translateX(-100%)';
    if (overlay) overlay.style.display = 'none';
    if (btnHeader) btnHeader.innerHTML = `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" style="display:inline-block;vertical-align:middle"><path d="M3 5h12M3 9h12M3 13h12" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>`;
  } else {
    sidebar.style.transform = 'translateX(0)';
    if (overlay) overlay.style.display = 'block';
    if (btnHeader) btnHeader.innerHTML = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" style="display:inline-block;vertical-align:middle"><path d="M2 2l10 10M12 2L2 12" stroke="#9d86c8" stroke-width="1.2" stroke-linecap="round"/></svg>`;
  }
}

function cerrarHamburguesa() {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.getElementById('hamburguesa-overlay');
  const btnHeader = document.getElementById('btn-hamburguesa-header');
  if (sidebar) sidebar.style.transform = 'translateX(-100%)';
  if (overlay) overlay.style.display = 'none';
  if (btnHeader) btnHeader.innerHTML = `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" style="display:inline-block;vertical-align:middle"><path d="M3 5h12M3 9h12M3 13h12" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>`;
}

// =================== MODO ===================
function inicializarModo() {
  const modo = localStorage.getItem('modo') || 'system';
  if (modo === 'light') {
    document.body.classList.add('light');
    document.body.classList.remove('dark');
  } else if (modo === 'dark') {
    document.body.classList.add('dark');
    document.body.classList.remove('light');
  }
  // si es 'system', no agrega ninguna clase — prefers-color-scheme decide
}

function toggleModo() {
  const esLight = document.body.classList.contains('light');
  const indicador = document.getElementById('toggleIndicador');
  const icono = document.getElementById('toggleIcono');
  const label = document.getElementById('toggleLabel');
  if (esLight) {
    document.body.classList.remove('light');
    document.body.classList.add('dark');
    localStorage.setItem('modo', 'dark');
    if (indicador) indicador.style.left = '2px';
    if (icono) icono.innerHTML = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" style="display:inline-block;vertical-align:middle"><path d="M11.5 9A5 5 0 015 2.5a5 5 0 100 9 5 5 0 006.5-2.5z" stroke="#9d86c8" stroke-width="1.1" stroke-linejoin="round"/></svg>';
    if (label) label.textContent = 'DARK';
  } else {
    document.body.classList.add('light');
    document.body.classList.remove('dark');
    localStorage.setItem('modo', 'light');
    if (indicador) indicador.style.left = '22px';
    if (icono) icono.innerHTML = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" style="display:inline-block;vertical-align:middle"><circle cx="7" cy="7" r="2.5" stroke="#eab308" stroke-width="1.1"/><path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M2.5 2.5l1 1M10.5 10.5l1 1M2.5 11.5l1-1M10.5 3.5l1-1" stroke="#eab308" stroke-width="1" stroke-linecap="round"/></svg>';
    if (label) label.textContent = 'LIGHT';
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

    socket = io({
      auth: { token },
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('Socket conectado:', socket.id);
    });

    socket.on('connect_error', (err) => {
      console.warn('Socket auth error:', err.message);
    });

    socket.on('nuevoMensaje', (mensaje) => {
      if (!mensaje || !mensaje.usuario) return;
      const esMio = mensaje.usuario._id === empresaIdActual || mensaje.usuario.id === empresaIdActual;

      if (!esMio) {
        mensajesNoLeidos++;
        actualizarBadge();
        reproducirSonido();
      }

      const ventana = document.getElementById('chat-ventana');
      if (typeof recibirMensajeSocket === "function") { recibirMensajeSocket(mensaje); } else { agregarMensajeDOM(mensaje); }
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
  if (!contenedor) {
    // Chat está cerrado: guardar en memoria (evitar duplicados con _id)
    if (!mensajesPendientes.find(msg => msg._id === m._id)) {
      mensajesPendientes.push(m);
    }
    return;
  }
  const esYo = m.usuario._id === empresaIdActual || m.usuario.id === empresaIdActual;
  const fecha = formatHora(m.fecha);
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
    const audio = new Audio("/notificacion.mp3");
    audio.volume = 0.3;
    const promise = audio.play();
    if (promise !== undefined) {
      promise.catch(() => {
        document.addEventListener("click", () => {
          audio.play().catch(() => {});
        }, { once: true });
      });
    }
  } catch (e) {}
}

// =================== ASISTENTE IA ===================
function inicializarAsistenteIA() {
  if (document.getElementById('ia-flotante')) return;

  const iaHTML = `
    <div id="ia-flotante" style="position: fixed; bottom: 90px; right: 24px; z-index: 9998;">
      <div id="ia-ventana" style="display:none; flex-direction: column; width: 360px; height: 480px; background: var(--morado-oscuro); border: 1px solid #7c3aed; border-radius: 4px; box-shadow: 0 0 40px rgba(124,58,237,0.3);">
        <div style="padding: 14px 16px; border-bottom: 1px solid var(--borde); display: flex; justify-content: space-between; align-items: center;">
          <div>
            <span style="font-family: 'Share Tech Mono', monospace; font-size: 12px; color: #a855f7; letter-spacing: 2px; display:flex; align-items:center; gap:6px;"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="display:inline-block;vertical-align:middle"><rect x="3" y="6" width="10" height="7" rx="1" stroke="#9d86c8" stroke-width="1.1"/><rect x="5" y="9" width="2" height="2" rx="0.3" fill="#9d86c8"/><rect x="9" y="9" width="2" height="2" rx="0.3" fill="#9d86c8"/><path d="M8 4V6M6 4h4" stroke="#9d86c8" stroke-width="1.1" stroke-linecap="round"/><path d="M1 9h2M13 9h2" stroke="#9d86c8" stroke-width="1.1" stroke-linecap="round"/></svg> ASISTENTE IA</span>
            <p style="font-size: 10px; color: #6b5a8a; margin-top: 2px;">Powered by LLaMA 3.3</p>
          </div>
          <button onclick="toggleIA()" style="background: none; border: none; color: #6b5a8a; cursor: pointer; padding:4px;"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" style="display:inline-block;vertical-align:middle"><path d="M2 2l10 10M12 2L2 12" stroke="#9d86c8" stroke-width="1.2" stroke-linecap="round"/></svg></button>
        </div>
        <div id="ia-mensajes" style="flex: 1; overflow-y: auto; padding: 16px;">
          <div style="margin-bottom: 12px;">
            <div style="display: inline-block; background: rgba(124,58,237,0.15); border: 1px solid #4a1a8a; padding: 8px 14px; border-radius: 2px; font-size: 11px; color: #a855f7; max-width: 95%; line-height: 1.6;">
              👋 Hola, soy tu asistente de ciberseguridad. Puedo explicarte eventos de seguridad, analizar riesgos y responder tus preguntas. ¿En qué te ayudo?
            </div>
          </div>
        </div>
        <div style="padding: 12px; border-top: 1px solid var(--borde);">
          <div style="display: flex; gap: 8px;">
            <input type="text" id="ia-texto" placeholder="Pregunta sobre ciberseguridad..." style="flex: 1; font-size: 12px;" onkeypress="if(event.key==='Enter') enviarPreguntaIA()">
            <button onclick="enviarPreguntaIA()" style="background: #7c3aed; border: none; color: white; padding: 8px 14px; cursor: pointer; font-family: 'Share Tech Mono', monospace; font-size: 11px; border-radius: 2px;">→</button>
          </div>
        </div>
      </div>
      <button onclick="toggleIA()" style="width: 46px; height: 46px; background: linear-gradient(135deg, #7c3aed, #a855f7); border: none; border-radius: 50%; color: white; cursor: pointer; box-shadow: 0 0 20px rgba(168,85,247,0.4); display:flex; align-items:center; justify-content:center;"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" style="display:inline-block;vertical-align:middle"><rect x="4" y="7" width="10" height="8" rx="1" stroke="white" stroke-width="1.2"/><rect x="6" y="10" width="2" height="2" rx="0.3" fill="white"/><rect x="10" y="10" width="2" height="2" rx="0.3" fill="white"/><path d="M9 4v3M7 4h4" stroke="white" stroke-width="1.2" stroke-linecap="round"/><path d="M2 11h2M14 11h2" stroke="white" stroke-width="1.2" stroke-linecap="round"/></svg></button>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', iaHTML);
}

let iaAbierto = false;

function toggleIA() {
  iaAbierto = !iaAbierto;
  const ventana = document.getElementById('ia-ventana');
  ventana.style.display = iaAbierto ? 'flex' : 'none';
}

async function enviarPreguntaIA() {
  const input = document.getElementById('ia-texto');
  const pregunta = input.value.trim();
  if (!pregunta) return;

  const contenedor = document.getElementById('ia-mensajes');
  const token = localStorage.getItem('token');

  contenedor.innerHTML += `
    <div style="margin-bottom: 10px; text-align: right;">
      <div style="display: inline-block; background: rgba(124,58,237,0.2); border: 1px solid #7c3aed; padding: 6px 12px; border-radius: 2px; font-size: 12px; max-width: 85%;">
        ${pregunta}
      </div>
    </div>
  `;

  contenedor.innerHTML += `<div id="ia-typing" style="color: #6b5a8a; font-size: 11px; font-family: 'Share Tech Mono', monospace; padding: 4px 0;">Analizando...</div>`;
  contenedor.scrollTop = contenedor.scrollHeight;
  input.value = '';

  try {
    const response = await apiFetch('/api/ia/asistente', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'authorization': token },
      body: JSON.stringify({ pregunta, contexto: `Usuario rol: ${localStorage.getItem('rol')}` })
    });

    const data = await response.json();
    document.getElementById('ia-typing')?.remove();

    contenedor.innerHTML += `
      <div style="margin-bottom: 10px; text-align: left;">
        <div style="display: inline-block; background: rgba(255,255,255,0.05); border: 1px solid var(--borde); padding: 8px 12px; border-radius: 2px; font-size: 12px; max-width: 90%; line-height: 1.6; color: var(--texto);">
          ${data.respuesta || data.mensaje}
        </div>
      </div>
    `;
    contenedor.scrollTop = contenedor.scrollHeight;
  } catch (e) {
    document.getElementById('ia-typing')?.remove();
    contenedor.innerHTML += `<div style="color: #ef4444; font-size: 11px;">Error conectando con IA</div>`;
  }
}
