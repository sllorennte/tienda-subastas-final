import { mostrarNotificacion } from './notificacion.module.js';

document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  if (!token) return location.href = 'login.html';

  const tbody = document.getElementById('productos-body');
  let idProductoAEliminar = null;
  const modal = new bootstrap.Modal(document.getElementById('modalConfirmarEliminar'));
  const btnConfirmar = document.getElementById('btn-confirmar-eliminar');

  try {
    const res = await fetch('/api/productos', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) throw new Error('Error al cargar productos');

    const data = await res.json();
    const productos = data.productos;

    if (!productos || productos.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = '<td colspan="5" class="text-center">No hay productos disponibles.</td>';
      tbody.appendChild(tr);
    } else {
      productos.forEach((p, index) => {
      const fila = document.createElement('tr');
      fila.innerHTML = `
        <td>${p.titulo}</td>
        <td>${p.vendedor?.username || 'Desconocido'}</td>
        <td>${p.precioInicial.toFixed(2)} €</td>
        <td>${p.estado || 'activo'}</td>
        <td>
          <button class="btn btn-sm btn-outline-danger" data-id="${p._id}" data-row-index="${index + 1}">Eliminar</button>
        </td>
      `;
      tbody.appendChild(fila);
      });
    }

    tbody.addEventListener('click', e => {
      if (e.target.tagName === 'BUTTON') {
        idProductoAEliminar = e.target.dataset.id;
        btnConfirmar.dataset.rowId = e.target.closest('tr').rowIndex;
        modal.show();
      }
    });

    btnConfirmar.addEventListener('click', async () => {
      if (!idProductoAEliminar) return;

      try {
        const r = await fetch(`/api/productos/${idProductoAEliminar}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });

        if (r.ok) {
          const fila = tbody.querySelector(`tr:nth-child(${btnConfirmar.dataset.rowId})`);
          if (fila) fila.remove();
          mostrarNotificacion('Producto eliminado correctamente', 'success');
        } else {
          mostrarNotificacion('Error al eliminar el producto', 'danger');
        }
      } catch (err) {
        console.error(err);
        mostrarNotificacion('Error de red al intentar eliminar el producto', 'danger');
      }

      idProductoAEliminar = null;
      modal.hide();
    });
  } catch (err) {
    console.error(err);
    mostrarNotificacion('Error al cargar productos', 'danger');
  }
});
