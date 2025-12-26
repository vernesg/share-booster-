import { z } from 'zod';
export * from './schema';
import { adminLoginSchema, validateKeySchema, shareTaskSchema, settings } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
  serverError: z.object({
    message: z.string(),
  }),
};

export const api = {
  auth: {
    login: {
      method: 'POST' as const,
      path: '/api/auth/login',
      input: adminLoginSchema,
      responses: {
        200: z.object({ success: z.boolean(), token: z.string() }),
        401: errorSchemas.unauthorized,
      },
    },
    verify: {
      method: 'GET' as const,
      path: '/api/auth/verify',
      responses: {
        200: z.object({ authenticated: z.boolean() }),
      },
    }
  },
  settings: {
    get: {
      method: 'GET' as const,
      path: '/api/settings/:key',
      responses: {
        200: z.object({ value: z.string() }),
        404: errorSchemas.validation,
      },
    },
    update: {
      method: 'POST' as const,
      path: '/api/settings',
      input: z.object({ key: z.string(), value: z.string() }),
      responses: {
        200: z.custom<typeof settings.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    validateKey: {
      method: 'POST' as const,
      path: '/api/settings/validate-key',
      input: validateKeySchema,
      responses: {
        200: z.object({ valid: z.boolean() }),
      },
    }
  },
  share: {
    start: {
      method: 'POST' as const,
      path: '/api/share/start',
      input: shareTaskSchema,
      responses: {
        // We will pipe the response as a stream of text/event-stream, 
        // but for contract definition we'll define a 200 OK.
        200: z.any(), 
        400: errorSchemas.validation,
        403: errorSchemas.unauthorized,
      },
    },
  },
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
