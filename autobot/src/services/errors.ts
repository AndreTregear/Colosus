export class ServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400,
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

export class NotFoundError extends ServiceError {
  constructor(entity: string, id: number | string) {
    super(`${entity} #${id} not found`, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class InvalidTransitionError extends ServiceError {
  constructor(entity: string, from: string, to: string) {
    super(
      `Cannot transition ${entity} from "${from}" to "${to}"`,
      'INVALID_TRANSITION',
      409,
    );
    this.name = 'InvalidTransitionError';
  }
}

export class OwnershipError extends ServiceError {
  constructor() {
    super('Order not found', 'OWNERSHIP_ERROR', 404);
    this.name = 'OwnershipError';
  }
}

export class InsufficientStockError extends ServiceError {
  constructor(productName: string, available: number) {
    super(
      `Not enough stock for "${productName}" (available: ${available})`,
      'INSUFFICIENT_STOCK',
      409,
    );
    this.name = 'InsufficientStockError';
  }
}
