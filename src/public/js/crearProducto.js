document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login.html';
    return;
  }

  const payload = JSON.parse(atob(token.split('.')[1]));
  const userId = payload.id;

  const form = document.getElementById('form-crear-producto');
  const inputImagenes = document.getElementById('imagenes-files');
  const previewCont = document.getElementById('preview-imagenes');
  const selectCategoria = document.getElementById('categoria');
  let uploadedFiles = [];
  const notify = (msg, type = 'success') => {
    if (window.mostrarNotificacion) return window.mostrarNotificacion(msg, type);
    if (window.alert) return window.alert(msg);
  };

  // Upload selected files when changed
  inputImagenes.addEventListener('change', async () => {
    const files = Array.from(inputImagenes.files || []);
    previewCont.innerHTML = '';
    if (!files.length) return;
    try {
      const fd = new FormData();
      files.slice(0,6).forEach(f => fd.append('files', f));
      const uploadUrl = (typeof apiUrl === 'function') ? apiUrl('/api/uploads') : '/api/uploads';
      const resp = await fetch(uploadUrl, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd
      });
      const data = await resp.json();
      if (!resp.ok) {
        notify(data.error || 'Error subiendo imágenes', 'danger');
        return;
      }
      uploadedFiles = data.archivos || [];
      uploadedFiles.forEach(n => {
        const img = document.createElement('img');
        img.src = `/uploads/${n}`;
        img.alt = n;
        img.style.maxWidth = '80px';
        img.style.height = '80px';
        img.style.objectFit = 'cover';
        img.onerror = () => { img.src = '/uploads/placeholder.png'; };
        previewCont.appendChild(img);
      });
    } catch (err) {
      console.error('Error subiendo archivos', err);
      notify('Error subiendo imágenes', 'danger');
    }
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();

    const titulo = document.getElementById('titulo').value.trim();
    const descripcion = document.getElementById('descripcion').value.trim();
    const precioInicialRaw = document.getElementById('precioInicial').value;
    // si hay archivos subidos, usarlos; si no, dejar array vacío
    const imagenesRaw = uploadedFiles;
    const fechaExpiracionRaw = document.getElementById('fechaExpiracion').value;

    if (!titulo) {
      notify('El campo "Título" es obligatorio.', 'warning');
      return;
    }

    if (!precioInicialRaw) {
      notify('Debes indicar un "Precio inicial".', 'warning');
      return;
    }

    const precioInicial = parseFloat(precioInicialRaw);
    if (isNaN(precioInicial) || precioInicial < 0) {
      notify('El "Precio inicial" debe ser un número positivo.', 'warning');
      return;
    }

    if (!fechaExpiracionRaw) {
      notify('La "Fecha de expiración" es obligatoria.', 'warning');
      return;
    }

    const fechaExpiracion = new Date(fechaExpiracionRaw);
    if (isNaN(fechaExpiracion.getTime()) || fechaExpiracion <= new Date()) {
      notify('La "Fecha de expiración" debe ser una fecha válida y futura.', 'warning');
      return;
    }

    let imagenes = Array.isArray(imagenesRaw) ? imagenesRaw : [];

    const payloadBody = {
      titulo,
      descripcion,
      precioInicial,
      imagenes: imagenes,
      categoria: selectCategoria ? selectCategoria.value : '',
      vendedor: userId,
      fechaExpiracion: fechaExpiracion.toISOString()
    };

    try {
      const res = await fetch('/api/productos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payloadBody)
      });

      const data = await res.json();

      if (!res.ok) {
        notify(data.error || 'Error desconocido al crear el producto.', 'danger');
        return;
      }
      notify('Producto creado con éxito', 'success');
      window.location.href = '/';
    } catch (err) {
      console.error(err);
      notify('Error de red o servidor, inténtalo de nuevo.', 'danger');
    }
  });
});
