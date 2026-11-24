const { z } = require("zod");
const consultaBody = z
  .object({
    id: z.coerce.number().int().positive(),
    Consulta: z.string().trim().min(1),
    id_categoria: z.coerce.number().int().positive().optional(),
    id_urgencia: z.coerce.number().int().positive().optional(),
  })
  .strict();
const consultaUpdateBody = z
  .object({
    Consulta: z.string().trim().min(1).optional(),
    Respuesta: z.string().nullable().optional(),
    estado_respuesta: z
      .enum(["pendiente", "procesando", "respondida", "error"])
      .optional(),
    id_categoria: z.coerce.number().int().positive().optional(),
    id_urgencia: z.coerce.number().int().positive().optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, "Debe indicar al menos un campo.");

const valoracionBody = z
  .object({
    valoracion: z.union([z.literal(0), z.literal(1)]),
  })
  .strict();

const id = z.coerce.number().int().positive();
const listQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  estado_respuesta: z
    .enum(["pendiente", "procesando", "respondida", "error"])
    .optional(),
  id: z.coerce.number().int().positive().optional(),
  id_categoria: z.coerce.number().int().positive().optional(),
  id_urgencia: z.coerce.number().int().positive().optional(),
});

module.exports = {
  consultaBody,
  consultaUpdateBody,
  valoracionBody,
  id,
  listQuery,
};
