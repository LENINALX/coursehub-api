import {
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { HttpErrorFilter } from './http-error.filter.js';

describe('HttpErrorFilter', () => {
  let filter: HttpErrorFilter;
  let response: Pick<Response, 'status' | 'json'>;
  let request: Pick<Request, 'path'>;
  let host: ArgumentsHost;

  beforeEach(() => {
    filter = new HttpErrorFilter();
    response = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    request = { path: '/courses/1' };
    host = {
      switchToHttp: () => ({
        getResponse: () => response,
        getRequest: () => request,
      }),
    } as ArgumentsHost;
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns a consistent public shape for HTTP exceptions', () => {
    filter.catch(
      new HttpException('Course not found', HttpStatus.NOT_FOUND),
      host,
    );

    expect(response.status).toHaveBeenCalledWith(404);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 404,
        path: '/courses/1',
        message: 'Course not found',
        timestamp: expect.any(String),
      }),
    );
  });

  it('does not expose internal exception messages or stacks', () => {
    filter.catch(new Error('database password leaked'), host);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        message: 'Internal server error',
      }),
    );
    expect(JSON.stringify(vi.mocked(response.json).mock.calls)).not.toContain(
      'database password leaked',
    );
  });
});
