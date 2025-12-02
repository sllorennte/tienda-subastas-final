const Mensaje = require('../modelos/Mensaje');
const Notificacion = require('../modelos/Notificacion');
const Usuario = require('../modelos/Usuario');

exports.listarMensajes = async (req, res) => {
  try {
    // el usuario autenticado ve todos los mensajes donde sea destinatario
    const userId = req.user.id;
    const msgs = await Mensaje.find({ destinatario: userId })
                              .sort({ fecha: -1 });
    res.json(msgs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al listar mensajes' });
  }
};

exports.responderMensaje = async (req, res) => {
  try {
    const userId = req.user.id;
    const { texto } = req.body;
    const orig = await Mensaje.findById(req.params.id);
    if (!orig) return res.status(404).json({ error: 'Mensaje no encontrado' });

    const resp = new Mensaje({
      remitente: userId,
      destinatario: orig.remitente,
      texto
    });
    await resp.save();
    // Crear notificación para el destinatario (el remitente original)
    try {
      const remitenteInfo = await Usuario.findById(userId).select('username');
      const titulo = `Nuevo mensaje de ${remitenteInfo ? remitenteInfo.username : 'Usuario'}`;
      const noti = new Notificacion({ usuario: orig.remitente, tipo: 'mensaje', titulo, texto, link: '/mensajes.html' });
      await noti.save();
      const io = req.app && req.app.locals && req.app.locals.io;
      if (io) io.to(`user_${orig.remitente}`).emit('notificacion', { id: noti._id, tipo: noti.tipo, titulo: noti.titulo, texto: noti.texto, fecha: noti.fecha, link: noti.link });
    } catch (e) { console.warn('Error creando notificacion mensaje:', e && e.message ? e.message : e); }

    res.status(201).json(resp);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al responder mensaje' });
  }
};

exports.crearMensaje = async (req, res) => {
  try {
    const remitente = req.user.id;
    const { destinatario, texto } = req.body;

    if (!destinatario || !texto) {
      return res.status(400).json({ error: 'Faltan destinatario o texto' });
    }

    const nuevoMensaje = new Mensaje({
      remitente,
      destinatario,
      texto,
      fecha: new Date()
    });

    await nuevoMensaje.save();
    // Crear una notificación para el destinatario
    try {
      const remitenteInfo = await Usuario.findById(remitente).select('username');
      const titulo = `Nuevo mensaje de ${remitenteInfo ? remitenteInfo.username : 'Usuario'}`;
      const snippet = (texto || '').length > 120 ? (texto || '').slice(0, 117) + '...' : texto || '';
      const noti = new Notificacion({ usuario: destinatario, tipo: 'mensaje', titulo, texto: snippet, link: '/mensajes.html' });
      await noti.save();
      const io = req.app && req.app.locals && req.app.locals.io;
      if (io) io.to(`user_${destinatario}`).emit('notificacion', { id: noti._id, tipo: noti.tipo, titulo: noti.titulo, texto: noti.texto, fecha: noti.fecha, link: noti.link });
    } catch (e) { console.warn('Error creando notificacion mensaje:', e && e.message ? e.message : e); }

    res.status(201).json(nuevoMensaje);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al enviar el mensaje' });
  }
};

exports.eliminarMensaje = async (req, res) => {
  try {
    const userId = req.user.id;
    const id = req.params.id;
    const msg = await Mensaje.findById(id);
    if (!msg) return res.status(404).json({ error: 'Mensaje no encontrado' });

    // Only sender or recipient can delete
    const isAllowed = (msg.remitente && msg.remitente.toString() === userId) ||
                      (msg.destinatario && msg.destinatario.toString() === userId);
    if (!isAllowed) return res.status(403).json({ error: 'No autorizado para eliminar este mensaje' });

    await Mensaje.findByIdAndDelete(id);
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar mensaje' });
  }
};
