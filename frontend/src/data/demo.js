export const clientesIniciales = [
  { id: 1, nombre: 'Ana García', correo: 'ana@ejemplo.com', telefono: '987 654 321' },
  { id: 2, nombre: 'Carlos Pérez', correo: 'carlos@ejemplo.com', telefono: '123 456 789' },
  { id: 3, nombre: 'Lucía Torres', correo: 'lucia@ejemplo.com', telefono: '555 123 456' }
];

export const conversacionesIniciales = [
  {id: 1, titulo: 'Consulta sobre IA', mensajes: [
    { id: 1, role: 'user', text: '¿Cómo puedo automatizar la gestión de mis clientes?' },
    { id: 2, role: 'bot', text: 'Puedes automatizarlo desde esta plataforma: registras tus clientes, gestionas sus consultas con el chat bot y personalizas la atención con tu avatar. ¿Te muestro cómo hacerlo? 😊' }
  ]},
  {id: 2, titulo: 'Ideas de negocio', mensajes: [{id: 3, role:'bot', text:'¡Hola! Cuéntame tu idea y te ayudo a organizarla.'}]},
  {id: 3, titulo: 'Automatización', mensajes: [{id: 4, role:'bot', text:'¿Qué proceso te gustaría automatizar primero?'}]}
];

export const avataresIniciales = [
  {id:1, nombre:'SofíaIA', rol:'Asesora virtual', estilo:'Profesional', genero:'Femenino', descripcion:'Asesora virtual en atención al cliente, negocios y productividad.', imagen:'/assets/avatar-sofia.png'},
  {id:2, nombre:'Asesor Comercial', rol:'Ventas y clientes', estilo:'Profesional', genero:'Masculino', descripcion:'Asesor comercial de productos y servicios.', imagen:'/assets/avatar-asesor.png'},
  {id:3, nombre:'SoporteIA', rol:'Atención y ayuda', estilo:'Moderno', genero:'Femenino', descripcion:'Asistente de soporte para resolver dudas.', imagen:'/assets/avatar-soporte.png'}
];
