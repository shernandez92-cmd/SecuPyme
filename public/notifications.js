// =================== CENTRO DE NOTIFICACIONES ===================
const Notificaciones = (() => {
  const STORAGE_KEY = 'secupyme_notifs';
  const MAX_NOTIFS = 50;

  const CATEGORIAS = {
    seguridad: { label: 'SEGURIDAD', icono: '🔐', color: '#ef4444' },
    riesgo:    { label: 'RIESGO',    icono: '⚠️',  color: '#f97316' },
    sistema:   { label: 'SISTEMA',   icono: '⚙️',  color: '#6b5a8a' },
    chat:      { label: 'CHAT',      icono: '💬',  color: '#7c3aed' },
  };

  function _leer() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { return []; }
  }

  function _guardar(lista) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista.slice(0, MAX_NOTIFS)));
  }

  function agregar(categoria, titulo, detalle = '') {
    if (!CATEGORIAS[categoria]) return;
    const lista = _leer();
    lista.unshift({ id: Date.now() + Math.random(), categoria, titulo, detalle, fecha: new Date().toISOString(), leida: false });
    _guardar(lista);
    _actualizarBadgeTotal();
    _renderPanel();
  }

  function marcarLeida(id) {
    const lista = _leer().map(n => n.id === id ? { ...n, leida: true } : n);
    _guardar(lista);
    _actualizarBadgeTotal();
    _renderPanel();
  }

  function marcarTodasLeidas() {
    _guardar(_leer().map(n => ({ ...n, leida: true })));
    _actualizarBadgeTotal();
    _renderPanel();
  }

  function limpiar() {
    _guardar([]);
    _actualizarBadgeTotal();
    _renderPanel();
  }

  function noLeidas() {
    return _leer().filter(n => !n.leida).length;
  }

  function _actualizarBadgeTotal() {
    const badge = document.getElementById('notif-badge-total');
    if (!badge) return;
    const count = noLeidas();
    badge.style.display = count > 0 ? 'flex' : 'none';
    badge.textContent = count > 9 ? '9+' : count;
  }

  let _filtroActivo = 'todas';

  function _renderPanel() {
    const lista = document.getElementById('notif-lista');
    if (!lista) return;

    document.querySelectorAll('.notif-filtro-btn').forEach(b => {
      b.style.background = b.dataset.cat === _filtroActivo ? 'rgba(124,58,237,0.4)' : 'rgba(124,58,237,0.1)';
      b.style.color = b.dataset.cat === _filtroActivo ? '#e2d9f3' : '#6b5a8a';
    });

    const todas = _leer();
    const filtradas = _filtroActivo === 'todas' ? todas : todas.filter(n => n.categoria === _filtroActivo);

    if (filtradas.length === 0) {
      lista.innerHTML = `<div style="padding:32px 16px;text-align:center;color:#6b5a8a;font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:1px;">SIN NOTIFICACIONES</div>`;
      return;
    }

    lista.innerHTML = filtradas.map(n => {
      const cat = CATEGORIAS[n.categoria];
      const diff = Math.floor((new Date() - new Date(n.fecha)) / 1000);
      const fecha = diff < 60 ? 'Ahora' : diff < 3600 ? `Hace ${Math.floor(diff/60)} min` : diff < 86400 ? `Hace ${Math.floor(diff/3600)} h` : formatFecha(n.fecha);
      return `
        <div onclick="Notificaciones.marcarLeida(${n.id})" style="padding:12px 16px;border-bottom:1px solid rgba(107,90,138,0.15);cursor:pointer;background:${n.leida ? 'transparent' : 'rgba(124,58,237,0.07)'};">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
            <span style="font-size:13px;">${cat.icono}</span>
            <span style="font-family:'Share Tech Mono',monospace;font-size:9px;color:${cat.color};letter-spacing:1px;">${cat.label}</span>
            ${!n.leida ? '<span style="width:6px;height:6px;background:#7c3aed;border-radius:50%;display:inline-block;margin-left:auto;"></span>' : ''}
          </div>
          <p style="font-size:12px;color:#e2d9f3;margin:0 0 3px 0;">${n.titulo}</p>
          ${n.detalle ? `<p style="font-size:11px;color:#6b5a8a;margin:0;">${n.detalle}</p>` : ''}
          <p style="font-size:10px;color:#4a3a6a;margin:4px 0 0 0;font-family:'Share Tech Mono',monospace;">${fecha}</p>
        </div>`;
    }).join('');
  }

  function abrirPanel() {
    if (!document.getElementById('notif-panel')) {
      const filtrosHTML = ['todas','seguridad','riesgo','sistema','chat'].map(cat =>
        `<button class="notif-filtro-btn" data-cat="${cat}" onclick="Notificaciones._setFiltro('${cat}')" style="background:rgba(124,58,237,0.1);border:1px solid rgba(124,58,237,0.2);color:#6b5a8a;font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:1px;padding:5px 10px;cursor:pointer;border-radius:2px;">${cat === 'todas' ? 'TODAS' : CATEGORIAS[cat].label}</button>`
      ).join('');

      document.body.insertAdjacentHTML('beforeend', `
        <div id="notif-overlay" style="position:fixed;inset:0;z-index:9996;" onclick="Notificaciones.cerrarPanel()"></div>
        <div id="notif-panel" style="position:fixed;top:0;right:0;width:340px;height:100vh;background:#0d0618;border-left:1px solid rgba(124,58,237,0.3);z-index:9997;display:flex;flex-direction:column;box-shadow:-8px 0 40px rgba(0,0,0,0.6);transform:translateX(100%);transition:transform 0.25s ease;">
          <div style="padding:18px 16px 12px;border-bottom:1px solid rgba(124,58,237,0.2);flex-shrink:0;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
              <span style="font-family:'Share Tech Mono',monospace;font-size:12px;color:#a855f7;letter-spacing:2px;">🔔 NOTIFICACIONES</span>
              <div style="display:flex;gap:8px;align-items:center;">
                <button onclick="Notificaciones.marcarTodasLeidas()" style="background:none;border:none;color:#6b5a8a;cursor:pointer;font-size:11px;font-family:'Share Tech Mono',monospace;">✓ TODO</button>
                <button onclick="Notificaciones.limpiar()" style="background:none;border:none;color:#6b5a8a;cursor:pointer;font-size:14px;">🗑</button>
                <button onclick="Notificaciones.cerrarPanel()" style="background:none;border:none;color:#6b5a8a;cursor:pointer;font-size:16px;">✕</button>
              </div>
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;">${filtrosHTML}</div>
          </div>
          <div id="notif-lista" style="flex:1;overflow-y:auto;"></div>
        </div>
      `);
    }
    setTimeout(() => { document.getElementById('notif-panel').style.transform = 'translateX(0)'; }, 10);
    _renderPanel();
  }

  function cerrarPanel() {
    const panel = document.getElementById('notif-panel');
    const overlay = document.getElementById('notif-overlay');
    if (panel) panel.style.transform = 'translateX(100%)';
    if (overlay) overlay.remove();
    setTimeout(() => { if (panel) panel.remove(); }, 260);
  }

  function _setFiltro(cat) {
    _filtroActivo = cat;
    _renderPanel();
  }

  function init() {
    _actualizarBadgeTotal();
  }

  return { agregar, marcarLeida, marcarTodasLeidas, limpiar, noLeidas, abrirPanel, cerrarPanel, init, _setFiltro };
})();
