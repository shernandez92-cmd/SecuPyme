// utils.js — Funciones utilitarias compartidas para SecuPyme

function formatFecha(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('es-CO', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
}

function formatFechaHora(date) {
  if (!date) return '—';
  return new Date(date).toLocaleString('es-CO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false
  });
}

function formatHora(date) {
  if (!date) return '—';
  return new Date(date).toLocaleTimeString('es-CO', {
    hour: '2-digit', minute: '2-digit', hour12: false
  });
}

/**
 * Wrapper de fetch con manejo global de errores
 * - 401: limpia sesión y redirige al login
 * - 403: muestra toast de sin permisos
 * - Sin red: muestra toast de sin conexión
 */
async function apiFetch(url, options = {}) {
  try {
    const res = await fetch(url, options);

    if (res.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      window.location.href = '/';
      return null;
    }

    if (res.status === 403) {
      if (typeof showToast === 'function') showToast('No tienes permisos para esta acción', 'error');
      return null;
    }

    return res;
  } catch (e) {
    if (typeof showToast === 'function') showToast('Sin conexión. Verifica tu red.', 'error');
    return null;
  }
}
