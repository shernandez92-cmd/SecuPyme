let mensajesPendientes = [];
let conversationIdActual = null;
let empresaSeleccionada = null;

function inicializarChat() {
  if (document.getElementById('chat-flotante')) return;
  const rol = localStorage.getItem('rol');

  const panelConversaciones = rol === 'admin' ? `
    <div id="chat-conversaciones" style="border-bottom: 1px solid var(--borde); max-height: 140px; overflow-y: auto; background: rgba(0,0,0,0.2);">
      <div style="padding: 8px 12px; font-family: 'Share Tech Mono', monospace; font-size: 10px; color: #6b5a8a; letter-spacing: 2px;">CONVERSACIONES</div>
      <div id="lista-conversaciones"></div>
    </div>
  ` : '';

  const chatHTML = `
    <div id="chat-flotante" style="position: fixed; bottom: 24px; right: 24px; z-index: 9999;">
      <div id="chat-ventana" style="display:none; flex-direction: column; width: 360px; height: 560px; background: var(--morado-oscuro); border: 1px solid var(--morado); border-radius: 4px; box-shadow: 0 0 40px rgba(124,58,237,0.2);">
        <div style="padding: 14px 16px; border-bottom: 1px solid var(--borde); display: flex; justify-content: space-between; align-items: center;">
          <div>
            <span style="font-family: 'Share Tech Mono', monospace; font-size: 12px; color: #a855f7; letter-spacing: 2px;">SOPORTE SECUPYME</span>
            <p id="chat-empresa-nombre" style="font-size: 10px; color: #6b5a8a; margin-top: 2px;">${rol === 'admin' ? 'Selecciona una empresa' : 'En línea'}</p>
          </div>
          <div style="display: flex; gap: 8px;">
            <button onclick="borrarChat()" style="background: none; border: none; color: #6b5a8a; cursor: pointer; font-size: 14px;">🗑</button>
            <button onclick="toggleChat()" style="background: none; border: none; color: #6b5a8a; cursor: pointer; font-size: 16px;">✕</button>
          </div>
        </div>
        ${panelConversaciones}
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
      <button onclick="toggleChat()" style="width: 52px; height: 52px; background: #7c3aed; border: none; border-radius: 50%; color: white; font-size: 22px; cursor: pointer; box-shadow: 0 0 20px rgba(124,58,237,0.4); position: relative;">
        💬
        <span id="badge-noLeidos" style="display:none; position: absolute; top: -4px; right: -4px; background: #ef4444; color: white; border-radius: 50%; width: 18px; height: 18px; font-size: 10px; line-height: 18px; text-align: center;"></span>
      </button>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', chatHTML);
  cargarReportesChat();

  if (rol === 'admin') {
    cargarConversacionesAdmin();
  } else {
    cargarChatMensajes();
  }
}

let chatAbierto = false;

function toggleChat() {
  chatAbierto = !chatAbierto;
  const ventana = document.getElementById('chat-ventana');
  ventana.style.display = chatAbierto ? 'flex' : 'none';
  if (chatAbierto) {
    mensajesNoLeidos = 0;
    actualizarBadge();
    const rol = localStorage.getItem('rol');
    if (rol === 'admin') {
      cargarConversacionesAdmin();
    } else {
      cargarChatMensajes();
    }
  }
}

async function cargarConversacionesAdmin() {
  const token = localStorage.getItem('token');
  try {
    const response = await fetch('/api/conversations', { headers: { 'authorization': token } });
    const conversaciones = await response.json();
    const lista = document.getElementById('lista-conversaciones');
    if (!lista) return;
    lista.innerHTML = '';

    if (conversaciones.length === 0) {
      lista.innerHTML = '<p style="padding: 8px 12px; font-size: 11px; color: #6b5a8a; font-family: Share Tech Mono, monospace;">Sin conversaciones aún</p>';
      return;
    }

    conversaciones.forEach(conv => {
      const btn = document.createElement('div');
      btn.style.cssText = 'padding: 8px 12px; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.05); transition: background 0.2s;';
      btn.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;"><span style="font-family: 'Share Tech Mono', monospace; font-size: 11px; color: var(--acento);">${conv.empresaId?.empresa || conv.empresaId?.nombre || 'Empresa'}</span>${conv.noLeidos > 0 ? `<span style="background: #ef4444; color: white; border-radius: 50%; width: 16px; height: 16px; font-size: 9px; line-height: 16px; text-align: center; display: inline-block;">${conv.noLeidos}</span>` : ''}</div>
        <div style="font-size: 10px; color: #6b5a8a; margin-top: 2px;">${conv.ultimoMensaje ? conv.ultimoMensaje.substring(0, 35) + '...' : 'Sin mensajes'}</div>
      `;
      btn.onmouseover = () => btn.style.background = 'rgba(168,85,247,0.1)';
      btn.onmouseout = () => btn.style.background = 'transparent';
      btn.onclick = () => seleccionarConversacion(conv);
      lista.appendChild(btn);
    });
  } catch (e) {
    console.log('Error cargando conversaciones:', e);
  }
}

async function seleccionarConversacion(conv) {
  conversationIdActual = conv._id;
  empresaSeleccionada = conv.empresaId?._id || conv.empresaId;
  const nombre = conv.empresaId?.empresa || conv.empresaId?.nombre || 'Empresa';
  const subtitulo = document.getElementById('chat-empresa-nombre');
  if (subtitulo) subtitulo.textContent = nombre;
  await cargarChatMensajes();
}

function actualizarBadge() {
  const badge = document.getElementById('badge-noLeidos');
  if (!badge) return;
  badge.style.display = mensajesNoLeidos > 0 ? 'block' : 'none';
  badge.textContent = mensajesNoLeidos > 9 ? '9+' : mensajesNoLeidos;
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

  if (rol === 'admin' && !empresaSeleccionada) {
    const contenedor = document.getElementById('chat-mensajes');
    if (contenedor) contenedor.innerHTML = '<div style="text-align:center; padding: 32px; color: #6b5a8a; font-family: Share Tech Mono, monospace; font-size: 11px;">Selecciona una empresa para ver la conversación</div>';
    return;
  }

  try {
    const url = rol === 'admin' && empresaSeleccionada
      ? `/api/chat?conId=${empresaSeleccionada}`
      : '/api/chat';

    const response = await fetch(url, { headers: { 'authorization': token } });
    const mensajes = await response.json();
    const contenedor = document.getElementById('chat-mensajes');
    if (!contenedor) return;

    const myId = JSON.parse(atob(token.split('.')[1])).id;
    contenedor.innerHTML = '';

    if (rol !== 'admin') {
      contenedor.innerHTML += `
        <div style="margin-bottom: 12px;">
          <div style="display: inline-block; background: rgba(124,58,237,0.15); border: 1px solid #4a1a8a; padding: 8px 14px; border-radius: 2px; font-size: 11px; color: #a855f7; max-width: 95%; line-height: 1.6;">
            👋 Gracias por comunicarte con SecuPyme. En un momento, uno de nuestros expertos se comunicará contigo.
          </div>
        </div>
      `;
    }

    mensajes.forEach(m => {
      const esYo = m.usuario._id === myId || m.usuario.id === myId;
      const fecha = new Date(m.fecha).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
      contenedor.innerHTML += `
        <div style="margin-bottom: 10px; text-align: ${esYo ? 'right' : 'left'};">
          <span style="font-size: 9px; color: #6b5a8a;">${m.usuario.nombre} · ${fecha}</span>
          <div style="display: inline-block; background: ${esYo ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.05)'}; border: 1px solid ${esYo ? '#7c3aed' : 'var(--borde)'}; padding: 6px 12px; border-radius: 2px; margin-top: 2px; font-size: 12px; max-width: 85%; word-break: break-word;">
            ${m.texto}
          </div>
        </div>
      `;
    });
    contenedor.scrollTop = contenedor.scrollHeight;
  } catch (e) {}
}

async function enviarChatMensaje() {
  const token = localStorage.getItem('token');
  const rol = localStorage.getItem('rol');
  const texto = document.getElementById('chat-texto').value.trim();
  const reporteRelacionado = document.getElementById('chat-reporte').value;
  if (!texto) return;

  if (rol === 'admin' && !empresaSeleccionada) {
    mostrarToast('Selecciona una empresa primero', 'warning');
    return;
  }

  const body = { texto, reporteRelacionado: reporteRelacionado || null };
  if (rol === 'admin' && empresaSeleccionada) {
    body.paraId = empresaSeleccionada;
  }

  await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'authorization': token },
    body: JSON.stringify(body)
  });

  document.getElementById('chat-texto').value = '';
}

function recibirMensajeSocket(mensaje) {
  const token = localStorage.getItem('token');
  if (!token) return;
  const myId = JSON.parse(atob(token.split('.')[1])).id;
  const esYo = mensaje.usuario._id === myId || mensaje.usuario.id === myId;

  if (!esYo) {
    mensajesNoLeidos++;
    actualizarBadge();
    reproducirSonido();
  }

  const contenedor = document.getElementById('chat-mensajes');
  if (contenedor && chatAbierto) {
    const fecha = new Date(mensaje.fecha).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    contenedor.innerHTML += `
      <div style="margin-bottom: 10px; text-align: ${esYo ? 'right' : 'left'};">
        <span style="font-size: 9px; color: #6b5a8a;">${mensaje.usuario.nombre} · ${fecha}</span>
        <div style="display: inline-block; background: ${esYo ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.05)'}; border: 1px solid ${esYo ? '#7c3aed' : 'var(--borde)'}; padding: 6px 12px; border-radius: 2px; margin-top: 2px; font-size: 12px; max-width: 85%; word-break: break-word;">
          ${mensaje.texto}
        </div>
      </div>
    `;
    contenedor.scrollTop = contenedor.scrollHeight;

    const rol = localStorage.getItem('rol');
    if (rol === 'admin') {
      cargarConversacionesAdmin();
    }
  }
}

// Desbloquear audio en primer clic
let audioDesbloqueado = false;
function desbloquearAudio() {
  if (audioDesbloqueado) return;
  const audio = new Audio('/notificacion.mp3');
  audio.volume = 0;
  audio.play().then(() => {
    audio.pause();
    audioDesbloqueado = true;
  }).catch(() => {});
}
document.addEventListener('click', desbloquearAudio, { once: false });
