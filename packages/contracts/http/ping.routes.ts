import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { PingRequest, PingResponse } from './ping.schema.js';

export const registry = new OpenAPIRegistry();

registry.registerPath({
  method: 'post',
  path: '/ping',
  summary: 'Ping demo',
  request: {
    body: {
      content: {
        'application/json': {
          schema: PingRequest,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'OK',
      content: {
        'application/json': {
          schema: PingResponse,
        },
      },
    },
  },
});
