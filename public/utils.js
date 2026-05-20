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
