import type { Response } from 'express';

export function handleEntityResponse<T>(res: Response, entity: T | undefined, statusCode: number = 200): void {
  if (!entity) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  if (statusCode !== 200) {
    res.status(statusCode);
  }
  res.json(entity);
}

export function handleDeleteResponse(res: Response, success: boolean): void {
  if (!success) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json({ ok: true });
}

export function handleCreatedResponse<T>(res: Response, entity: T): void {
  res.status(201).json(entity);
}

export type AsyncRequestHandler = (req: unknown, res: Response) => Promise<void>;

export function wrapAsync(fn: AsyncRequestHandler) {
  return (req: unknown, res: Response, next: (err?: unknown) => void) => {
    fn(req, res).catch(next);
  };
}
