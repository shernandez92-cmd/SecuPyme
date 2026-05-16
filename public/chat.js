let mensajesPendientes = [];
let conversationIdActual = null;
function inicializarChat() {
  if (document.getElementById('chat-flotante')) return;

  const chatHTML = `
    <div id="chat-flotante" style="position: fixed; bottom: 24px; right: 24px; z-index: 9999;">
      <div id="chat-ventana" style="display:none; flex-direction: column; width: 360px; height: 520px; background: var(--morado-oscuro); border: 1px solid var(--morado); border-radius: 4px; box-shadow: 0 0 40px rgba(124,58,237,0.2);">
        <div style="padding: 16px; border-bottom: 1px solid var(--borde); display: flex; justify-content: space-between; align-items: center;">
          <div>
            <span style="font-family: 'Share Tech Mono', monospace; font-size: 12px; color: #a855f7; letter-spacing: 2px;">SOPORTE SECUPYME</span>
          </div>
          <div style="display: flex; gap: 8px;">
            <button onclick="borrarChat()" style="background: none; border: none; color: #6b5a8a; cursor: pointer; font-size: 14px;">🗑</button>
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
      <button onclick="toggleChat()" style="width: 52px; height: 52px; background: #7c3aed; border: none; border-radius: 50%; color: white; font-size: 22px; cursor: pointer; box-shadow: 0 0 20px rgba(124,58,237,0.4); position: relative;">
        💬
        <span id="badge-noLeidos" style="display:none; position: absolute; top: -4px; right: -4px; background: #ef4444; color: white; border-radius: 50%; width: 18px; height: 18px; font-size: 10px; line-height: 18px; text-align: center;"></span>
      </button>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', chatHTML);
  cargarReportesChat();
  cargarChatMensajes();
}

let chatAbierto = false;

function toggleChat() {
  chatAbierto = !chatAbierto;
  const ventana = document.getElementById('chat-ventana');
  ventana.style.display = chatAbierto ? 'flex' : 'none';
  if (chatAbierto) {
    mensajesNoLeidos = 0;
    actualizarBadge();
    cargarChatMensajes();
    // Renderizar mensajes que llegaron mientras estaba cerrado
    setTimeout(() => {
      if (mensajesPendientes.length > 0) {
        const contenedor = document.getElementById('chat-mensajes');
        if (contenedor) {
          mensajesPendientes.forEach(m => {
            const esYo = m.usuario.rol === localStorage.getItem('rol');
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
          mensajesPendientes = []; // Limpiar después de renderizar
        }
      }
    }, 50);
  }
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
  try {
    const response = await fetch('/api/chat', { headers: { 'authorization': token } });
    const mensajes = await response.json();
    const contenedor = document.getElementById('chat-mensajes');
    if (!contenedor) return;
    contenedor.innerHTML = '';
    contenedor.innerHTML += `
      <div style="margin-bottom: 12px;">
        <div style="display: inline-block; background: rgba(124,58,237,0.15); border: 1px solid #4a1a8a; padding: 8px 14px; border-radius: 2px; font-size: 11px; color: #a855f7; max-width: 95%; line-height: 1.6;">
          👋 Gracias por comunicarte con SecuPyme. En un momento, uno de nuestros expertos se comunicará contigo.
        </div>
      </div>
    `;
    mensajes.forEach(m => {
      const esYo = m.usuario.rol === rol;
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
    });
  } catch (e) {}
}

async function enviarChatMensaje() {
  const texto = document.getElementById('chat-texto').value;
  const reporteRelacionado = document.getElementById('chat-reporte').value;
  if (!texto) return;

  if (typeof socket !== 'undefined' && socket && socket.connected) {
    const token = localStorage.getItem('token');
    const payload = JSON.parse(atob(token.split('.')[1]));
    socket.emit('mensajeChat', {
      userId: payload.id,
      empresaId: payload.id,
      texto,
      reporteRelacionado: reporteRelacionado || null
    });
  } else {
    const token = localStorage.getItem('token');
    await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'authorization': token },
      body: JSON.stringify({ texto, reporteRelacionado: reporteRelacionado || null })
    });
    cargarChatMensajes();
  }

  document.getElementById('chat-texto').value = '';
}