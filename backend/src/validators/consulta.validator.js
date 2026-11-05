const { z } = require('zod');

const consultaBody = z.object({
  id: z.coerce.number().int().positive(),
  Consulta: z.string().trim().min(1),
}).strict();
const consultaUpdateBody = z.object({
  Consulta: z.string().trim().min(1).optional(),
  Respuesta: z.string().nullable().optional(),
  estado_respuesta: z.enum(['pendiente', 'procesando', 'respondida', 'error']).optional(),
}).strict().refine((value) => Object.keys(value).length > 0, 'Debe indicar al menos un campo.');
const id = z.coerce.number().int().positive();
const listQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  estado_respuesta: z.enum(['pendiente', 'procesando', 'respondida', 'error']).optional(),
  id: z.coerce.number().int().positive().optional(),
});

module.exports = { consultaBody, consultaUpdateBody, id, listQuery };
