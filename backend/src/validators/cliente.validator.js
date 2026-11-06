const { z } = require('zod');

const clienteBody = z.object({
  nombre: z.string().trim().min(1).max(100),
  apellido: z.string().trim().max(50).optional(),
  correo: z.string().trim().email().max(100).nullable().optional(),
  email: z.string().trim().email().max(100).nullable().optional(),
  telefono: z.string().trim().max(20).nullable().optional(),
  descripcion: z.string().trim().nullable().optional(),
  imagen: z.string().regex(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/).max(1400000).nullable().optional(),
}).strict().superRefine((value, context) => {
  const parts = value.apellido ? [value.nombre, value.apellido] : value.nombre.trim().split(/\s+/, 2);
  if (parts.some((part) => part.length > 50)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Nombre y apellido admiten hasta 50 caracteres cada uno.', path: ['nombre'] });
  }
  if (value.correo && value.email && value.correo !== value.email) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'correo y email deben tener el mismo valor si se envían ambos.', path: ['correo'] });
  }
}).transform((value) => {
  const parts = value.apellido ? [value.nombre, value.apellido] : value.nombre.trim().split(/\s+/, 2);
  return {
    nombre: parts[0],
    apellido: parts[1] || '',
    email: value.email ?? value.correo ?? null,
    telefono: value.telefono ?? null,
    descripcion: value.descripcion ?? null,
    imagen: value.imagen ?? null,
  };
});
const clienteListQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

module.exports = { clienteBody, clienteListQuery };
