import { z } from 'zod';
import { insertCapsuleSchema, capsules } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  capsules: {
    create: {
      method: 'POST' as const,
      path: '/api/capsules',
      input: insertCapsuleSchema,
      responses: {
        201: z.custom<typeof capsules.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/capsules/:id',
      responses: {
        200: z.custom<typeof capsules.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type CreateCapsuleInput = z.infer<typeof api.capsules.create.input>;
export type CapsuleResponse = z.infer<typeof api.capsules.create.responses[201]>;
