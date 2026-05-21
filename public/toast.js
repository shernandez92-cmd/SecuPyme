function mostrarToast(mensaje, tipo = 'info', duracion = 3000) {
  const colores = {
    success: { bg: 'rgba(16,185,129,0.15)', border: '#10b981', color: '#10b981', icono: '✓' },
    error: { bg: 'rgba(239,68,68,0.15)', border: '#ef4444', color: '#ef4444', icono: '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2L2 10" stroke="#ef4444" stroke-width="1.2" stroke-linecap="round"/></svg>' },
    warning: { bg: 'rgba(245,158,11,0.15)', border: '#f59e0b', color: '#f59e0b', icono: '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1L0.8 10h10.4L6 1z" stroke="#f59e0b" stroke-width="1" stroke-linejoin="round"/><path d="M6 5v2.5" stroke="#f59e0b" stroke-width="1" stroke-linecap="round"/><circle cx="6" cy="9" r="0.6" fill="#f59e0b"/></svg>' },
    info: { bg: 'rgba(168,85,247,0.15)', border: '#a855f7', color: '#a855f7', icono: 'ℹ' }
  };

  const c = colores[tipo] || colores.info;

  let contenedor = document.getElementById('toast-contenedor');
  if (!contenedor) {
    contenedor = document.createElement('div');
    contenedor.id = 'toast-contenedor';
    contenedor.style.cssText = 'position: fixed; top: 24px; right: 24px; z-index: 99999; display: flex; flex-direction: column; gap: 8px;';
    document.body.appendChild(contenedor);
  }

  const toast = document.createElement('div');
  toast.style.cssText = `
    background: ${c.bg};
    border: 1px solid ${c.border};
    border-radius: 4px;
    padding: 14px 20px;
    font-family: 'Share Tech Mono', monospace;
    font-size: 12px;
    color: ${c.color};
    letter-spacing: 1px;
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 280px;
    max-width: 400px;
    box-shadow: 0 0 20px rgba(0,0,0,0.3);
    opacity: 0;
    transform: translateX(20px);
    transition: all 0.3s ease;
  `;
  toast.innerHTML = `<span style="font-size: 16px;">${c.icono}</span><span>${mensaje}</span>`;
  contenedor.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(0)';
  }, 10);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    setTimeout(() => toast.remove(), 300);
  }, duracion);
}