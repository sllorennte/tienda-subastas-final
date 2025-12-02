document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  if (!token) return (window.location.href = 'login.html');

  const totalUsuariosEl = document.getElementById('total-usuarios');
  const totalProductosEl = document.getElementById('total-productos');
  const totalPujasEl = document.getElementById('total-pujas');

  try {
    const resUsuarios = await fetch('/api/usuarios', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const usuarios = await resUsuarios.json();
    totalUsuariosEl.textContent = usuarios.length;
  } catch (err) {
    console.error('Error al obtener usuarios:', err);
    totalUsuariosEl.textContent = '—';
  }

  try {
    const resProductos = await fetch('/api/productos', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await resProductos.json();
    // prefer metadata.totalItems if present (paginado), otherwise fallback to array length
    const totalProductos = (data && data.metadata && typeof data.metadata.totalItems === 'number') ? data.metadata.totalItems : (Array.isArray(data) ? data.length : (Array.isArray(data.productos) ? data.productos.length : 0));
    totalProductosEl.textContent = totalProductos;
  } catch (err) {
    console.error('Error al obtener productos:', err);
    totalProductosEl.textContent = '—';
  }

  try {
    const resPujas = await fetch('/api/pujas', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const pujas = await resPujas.json();
    totalPujasEl.textContent = pujas.length;
  } catch (err) {
    console.error('Error al obtener pujas:', err);
    totalPujasEl.textContent = '—';
  }
});
