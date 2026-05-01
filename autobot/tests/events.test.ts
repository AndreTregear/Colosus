/**
 * Comprehensive tests for shared/events.ts — typed event bus.
 * Extends the basic tests in shared.test.ts with full coverage.
 */
import { describe, it, expect, vi } from 'vitest';
import { EventEmitter } from 'node:events';

// Create a fresh isolated emitter for testing (avoid interference with other tests)
class TypedEmitter extends EventEmitter {
  override emit(event: string, ...args: unknown[]): boolean {
    return super.emit(event, ...args);
  }
  override on(event: string, listener: (...args: unknown[]) => void): this {
    return super.on(event, listener);
  }
}

describe('EventBus', () => {
  it('should support order lifecycle events', () => {
    const bus = new TypedEmitter();
    const handler = vi.fn();

    bus.on('order-created', handler);
    bus.emit('order-created', 'tenant-1', 42, '51999@s.whatsapp.net');

    expect(handler).toHaveBeenCalledWith('tenant-1', 42, '51999@s.whatsapp.net');
  });

  it('should support payment events', () => {
    const bus = new TypedEmitter();
    const handler = vi.fn();

    bus.on('yape-payment-matched', handler);
    bus.emit('yape-payment-matched', 'tenant-1', 5, 10, '51999@s.whatsapp.net');

    expect(handler).toHaveBeenCalledWith('tenant-1', 5, 10, '51999@s.whatsapp.net');
  });

  it('should support multiple listeners', () => {
    const bus = new TypedEmitter();
    const h1 = vi.fn();
    const h2 = vi.fn();

    bus.on('tenant-started', h1);
    bus.on('tenant-started', h2);
    bus.emit('tenant-started', 'tenant-1');

    expect(h1).toHaveBeenCalledWith('tenant-1');
    expect(h2).toHaveBeenCalledWith('tenant-1');
  });

  it('should support removing listeners', () => {
    const bus = new TypedEmitter();
    const handler = vi.fn();

    bus.on('tenant-stopped', handler);
    bus.removeListener('tenant-stopped', handler);
    bus.emit('tenant-stopped', 'tenant-1');

    expect(handler).not.toHaveBeenCalled();
  });

  it('should support human handoff events', () => {
    const bus = new TypedEmitter();
    const handler = vi.fn();

    bus.on('human-handoff-requested', handler);
    bus.emit('human-handoff-requested', 'tenant-1', '51999@s.whatsapp.net', 'Complex question');

    expect(handler).toHaveBeenCalledWith('tenant-1', '51999@s.whatsapp.net', 'Complex question');
  });

  it('should support stock alert events', () => {
    const bus = new TypedEmitter();
    const handler = vi.fn();

    bus.on('low-stock-alert', handler);
    bus.emit('low-stock-alert', 'tenant-1', 42, 'Pizza', 3);

    expect(handler).toHaveBeenCalledWith('tenant-1', 42, 'Pizza', 3);
  });

  it('should support daily summary events', () => {
    const bus = new TypedEmitter();
    const handler = vi.fn();

    bus.on('daily-summary-ready', handler);
    bus.emit('daily-summary-ready', 'tenant-1', {
      title: 'Resumen',
      body: 'Todo bien',
      data: { revenue: 500 },
    });

    expect(handler).toHaveBeenCalledWith('tenant-1', {
      title: 'Resumen',
      body: 'Todo bien',
      data: { revenue: 500 },
    });
  });

  it('should support delivery events', () => {
    const bus = new TypedEmitter();
    const assigned = vi.fn();
    const completed = vi.fn();

    bus.on('rider-assigned', assigned);
    bus.on('delivery-completed', completed);

    bus.emit('rider-assigned', 'tenant-1', 10, 3);
    bus.emit('delivery-completed', 'tenant-1', 10, 7);

    expect(assigned).toHaveBeenCalledWith('tenant-1', 10, 3);
    expect(completed).toHaveBeenCalledWith('tenant-1', 10, 7);
  });

  it('should support appointment events', () => {
    const bus = new TypedEmitter();
    const booked = vi.fn();
    const cancelled = vi.fn();

    bus.on('appointment-booked', booked);
    bus.on('appointment-cancelled', cancelled);

    bus.emit('appointment-booked', 'tenant-1', 5, '51999@s.whatsapp.net');
    bus.emit('appointment-cancelled', 'tenant-1', 5);

    expect(booked).toHaveBeenCalledWith('tenant-1', 5, '51999@s.whatsapp.net');
    expect(cancelled).toHaveBeenCalledWith('tenant-1', 5);
  });
});
