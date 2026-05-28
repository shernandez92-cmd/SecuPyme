// =================== FEEDBACK GLOBAL ===================
function abrirFeedbackModal() {
  if (document.getElementById('feedback-modal')) return;

  const overlay = document.createElement('div');
  overlay.id = 'feedback-modal';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;padding:24px;backdrop-filter:blur(4px);';

  overlay.innerHTML = `
    <div style="background:var(--morado-oscuro, #0d0618);border:1px solid rgba(124,58,237,0.4);border-radius:4px;padding:40px;width:100%;max-width:480px;box-shadow:0 0 60px rgba(124,58,237,0.15);">
      <div style="border-bottom:1px solid rgba(124,58,237,0.2);padding-bottom:16px;margin-bottom:28px;display:flex;justify-content:space-between;align-items:center;">
        <span style="font-family:'Share Tech Mono',monospace;font-size:10px;color:#a855f7;letter-spacing:4px;">REPORTAR PROBLEMA</span>
        <button onclick="document.getElementById('feedback-modal').remove()" style="background:none;border:none;color:#6b5a8a;cursor:pointer;padding:4px;">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="#9d86c8" stroke-width="1.2" stroke-linecap="round"/></svg>
        </button>
      </div>
      <div style="margin-bottom:16px;">
        <label style="font-family:'Share Tech Mono',monospace;font-size:10px;color:#6b5a8a;letter-spacing:2px;display:block;margin-bottom:8px;">EMAIL DE CONTACTO</label>
        <input id="feedback-email" type="email" placeholder="correo@empresa.com" style="width:100%;background:var(--morado-oscuro,#0d0618);border:1px solid rgba(124,58,237,0.2);color:var(--texto,#e2d9f3);font-family:'Share Tech Mono',monospace;font-size:12px;padding:10px 12px;border-radius:2px;box-sizing:border-box;">
      </div>
      <div style="margin-bottom:24px;">
        <label style="font-family:'Share Tech Mono',monospace;font-size:10px;color:#6b5a8a;letter-spacing:2px;display:block;margin-bottom:8px;">DESCRIBE EL PROBLEMA *</label>
        <textarea id="feedback-mensaje" placeholder="Cuéntanos qué ocurrió..." rows="5" style="width:100%;background:var(--morado-oscuro,#0d0618);border:1px solid rgba(124,58,237,0.2);color:var(--texto,#e2d9f3);font-family:'Share Tech Mono',monospace;font-size:12px;padding:10px 12px;border-radius:2px;resize:vertical;box-sizing:border-box;"></textarea>
      </div>
      <div style="display:flex;gap:12px;">
        <button onclick="document.getElementById('feedback-modal').remove()" style="flex:1;padding:12px;background:transparent;border:1px solid rgba(124,58,237,0.3);color:#6b5a8a;font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:2px;cursor:pointer;border-radius:2px;">CANCELAR</button>
        <button onclick="enviarFeedback()" style="flex:2;padding:12px;background:#7c3aed;border:none;color:white;font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:2px;cursor:pointer;border-radius:2px;">ENVIAR REPORTE</button>
      </div>
      <p id="feedback-status" style="margin-top:12px;font-family:'Share Tech Mono',monospace;font-size:11px;text-align:center;color:#6b5a8a;display:none;"></p>
    </div>
  `;

  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
  document.body.appendChild(overlay);
  setTimeout(() => document.getElementById('feedback-email')?.focus(), 100);
}

window.enviarFeedback = async function() {
  const email = document.getElementById('feedback-email')?.value.trim();
  const mensaje = document.getElementById('feedback-mensaje')?.value.trim();
  const status = document.getElementById('feedback-status');

  if (!mensaje || mensaje.length < 5) {
    status.style.display = 'block';
    status.style.color = '#ef4444';
    status.textContent = 'El mensaje es muy corto.';
    return;
  }

  const btns = document.querySelectorAll('#feedback-modal button');
  const sendBtn = btns[btns.length - 1];
  if (sendBtn) { sendBtn.textContent = 'ENVIANDO...'; sendBtn.disabled = true; }

  try {
    const res = await fetch('/api/public/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, mensaje, pagina: window.location.pathname })
    });
    const data = await res.json();
    status.style.display = 'block';
    if (res.ok) {
      status.style.color = '#4ade80';
      status.textContent = data.mensaje;
      setTimeout(() => document.getElementById('feedback-modal')?.remove(), 2000);
    } else {
      status.style.color = '#ef4444';
      status.textContent = data.mensaje || 'Error al enviar.';
      if (sendBtn) { sendBtn.textContent = 'ENVIAR REPORTE'; sendBtn.disabled = false; }
    }
  } catch (e) {
    status.style.display = 'block';
    status.style.color = '#ef4444';
    status.textContent = 'Error de conexión.';
    if (sendBtn) { sendBtn.textContent = 'ENVIAR REPORTE'; sendBtn.disabled = false; }
  }
};

// Botón flotante solo en páginas sin sidebar
(function() {
  function crearBotonFlotante() {
    if (document.getElementById('sidebar-container')) return;
    if (document.getElementById('feedback-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'feedback-btn';
    btn.title = 'Reportar problema';
    btn.style.cssText = 'position:fixed;bottom:28px;left:80px;z-index:99990;background:rgba(124,58,237,0.2);border:1px solid rgba(124,58,237,0.4);border-radius:50%;width:44px;height:44px;cursor:pointer;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(8px);transition:background 0.2s;box-shadow:0 2px 12px rgba(0,0,0,0.3);';
    btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7.5" stroke="#9d86c8" stroke-width="1.2"/><path d="M9 5.5v5" stroke="#9d86c8" stroke-width="1.2" stroke-linecap="round"/><circle cx="9" cy="13" r="0.8" fill="#9d86c8"/></svg>';
    btn.onmouseover = () => btn.style.background = 'rgba(124,58,237,0.4)';
    btn.onmouseout = () => btn.style.background = 'rgba(124,58,237,0.2)';
    btn.onclick = abrirFeedbackModal;
    document.body.appendChild(btn);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', crearBotonFlotante);
  } else {
    crearBotonFlotante();
  }
})();
