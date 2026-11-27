const { z } = require("zod");

const pedidoBody = z
  .object({
    lineas: z
      .array(
        z
          .object({
            id_articulo: z.coerce.number().int().positive(),
            cantidad: z.coerce.number().int().min(1).max(10),
          })
          .strict(),
      )
      .min(1)
      .max(10),
  })
  .strict();

const estadoBody = z
  .object({
    estado: z.enum(["pendiente", "preparando", "enviado", "entregado", "cancelado"]),
  })
  .strict();

const id = z.coerce.number().int().positive();

const listQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  id: z.coerce.number().int().positive().optional(),
});

module.exports = { pedidoBody, estadoBody, id, listQuery };
