import { Logger } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { RequestLoggerMiddleware } from './request-logger.middleware.js';

describe('RequestLoggerMiddleware', () => {
  it('logs request metadata without headers or bodies', () => {
    let finishListener: (() => void) | undefined;
    const response = {
      statusCode: 401,
      on: vi.fn((event: string, listener: () => void) => {
        if (event === 'finish') {
          finishListener = listener;
        }
        return response;
      }),
    } as unknown as Response;
    const request = {
      method: 'POST',
      path: '/auth/login',
      originalUrl: '/auth/login?secret=query-value',
      headers: { authorization: 'Bearer sensitive-token' },
      body: { password: 'sensitive-password' },
    } as unknown as Request;
    const next = vi.fn() as NextFunction;
    const log = vi
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => undefined);

    new RequestLoggerMiddleware().use(request, response, next);
    finishListener?.();

    expect(next).toHaveBeenCalledOnce();
    expect(log).toHaveBeenCalledOnce();
    const loggedMessage = String(log.mock.calls[0]?.[0]);
    expect(loggedMessage).toContain('"method":"POST"');
    expect(loggedMessage).toContain('"path":"/auth/login"');
    expect(loggedMessage).toContain('"status":401');
    expect(loggedMessage).not.toContain('sensitive-token');
    expect(loggedMessage).not.toContain('sensitive-password');
    expect(loggedMessage).not.toContain('query-value');
  });
});
