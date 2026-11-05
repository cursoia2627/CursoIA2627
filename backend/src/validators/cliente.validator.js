const { z } = require('zod');

const clienteBody = z.object({
  nombre: z.string().trim().min(1).max(50),
  apellido: z.string().trim().min(1).max(50),
  email: z.string().trim().email().max(100).nullable().optional(),
  telefono: z.string().trim().max(20).nullable().optional(),
  descripcion: z.string().trim().nullable().optional(),
  // imagen accepts a base64 string; null clears it. Database stores decoded bytes.
  imagen: z.string().regex(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/).max(1400000).nullable().optional(),
}).strict();
const clienteListQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

module.exports = { clienteBody, clienteListQuery };
