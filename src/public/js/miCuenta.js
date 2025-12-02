document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login.html';
    return;
  }

  // Cerrar sesión
  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      localStorage.removeItem('token');
      window.location.href = '/login.html';
    });
  }

  // (no header avatar logout handler in reverted state)

  // Navegación entre secciones
  const menuBtns = document.querySelectorAll('[data-section]');
  const secciones = document.querySelectorAll('#pujas-activas, #pujas-creadas, #configuracion');

  menuBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      menuBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const target = btn.dataset.section;
      secciones.forEach(sec => {
        sec.classList.toggle('d-none', sec.id !== target);
      });
    });
  });

  // Cargar datos del usuario
  async function cargarDatosUsuario() {
    try {
      const url = (typeof apiUrl === 'function') ? apiUrl('/api/usuarios/me') : '/api/usuarios/me';
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
      const usuario = await res.json();
      document.getElementById('username-config').value = usuario.username || '';
      document.getElementById('email-config').value = usuario.email || '';
      const perfilUser = document.getElementById('perfil-username');
      const perfilEmail = document.getElementById('perfil-email');
      if (perfilUser) perfilUser.textContent = usuario.username || 'Usuario';
      if (perfilEmail) perfilEmail.textContent = usuario.email || '';
      // optional fields
      const bio = document.getElementById('bio-config');
      if (bio && usuario.bio) bio.value = usuario.bio;
      // notification buttons
      const notifBtns = document.querySelectorAll('.notif-btn');
      if (notifBtns && usuario.notificaciones) {
        notifBtns.forEach(b => b.classList.toggle('active', b.dataset.value === usuario.notificaciones));
      }
    } catch (err) {
      console.error('No se pudo cargar los datos del usuario.');
    }
  }

  // Guardar cambios de configuración
  const formConfig = document.getElementById('form-configuracion');
  formConfig.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = formConfig.username.value.trim();
    const email = formConfig.email.value.trim();
    const password = formConfig.password.value;
    const bioVal = document.getElementById('bio-config') ? document.getElementById('bio-config').value.trim() : undefined;

    if (!username || !email) return;

    const payload = { username, email };
    if (password) payload.password = password;
    if (typeof bioVal !== 'undefined') payload.bio = bioVal;

    try {
      const url = (typeof apiUrl === 'function') ? apiUrl('/api/usuarios/me') : '/api/usuarios/me';
      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        formConfig.password.value = '';
        mostrarNotificacion('Datos actualizados correctamente');
      } else {
        const errData = await res.json();
        console.error('Error al actualizar:', errData.error || 'Error desconocido');
        mostrarNotificacion(errData.error || 'No se pudo actualizar', 'danger');
      }
    } catch (err) {
      console.error('Error al actualizar datos.', err);
      mostrarNotificacion('Error de red al actualizar', 'danger');
    }
  });

  // Init notification buttons behavior
  document.querySelectorAll('.notif-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.notif-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Iniciar carga
  cargarDatosUsuario();
});
