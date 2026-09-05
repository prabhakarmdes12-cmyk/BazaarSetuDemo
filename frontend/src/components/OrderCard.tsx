'use client';

import React from 'react';
import { Order, OrderStatus } from '@/types';
import { Icon, Badge } from './ui';

interface OrderCardProps {
  order: Order;
  onStatusUpdate?: (orderId: string, status: OrderStatus) => void;
  isVendor?: boolean;
}

const statusConfig: Record<OrderStatus, { label: string; variant: 'pending' | 'warning' | 'info' | 'completed' | 'error' }> = {
  pending: { label: 'Pending', variant: 'pending' },
  accepted: { label: 'Accepted', variant: 'info' },
  preparing: { label: 'Preparing', variant: 'warning' },
  ready: { label: 'Ready', variant: 'info' },
  out_for_delivery: { label: 'Out for delivery', variant: 'warning' },
  pickup: { label: 'Pickup ready', variant: 'info' },
  completed: { label: 'Completed', variant: 'completed' },
  rejected: { label: 'Rejected', variant: 'error' },
};

function getTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Abhi abhi';
  if (diffMins < 60) return `${diffMins}m pehle`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h pehle`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d pehle`;
}

export default function OrderCard({ order, onStatusUpdate, isVendor = false }: OrderCardProps) {
  const status = statusConfig[order.status];
  const timeAgo = getTimeAgo(order.createdAt);

  return (
    <div className="bg-surface-container-lowest rounded-xl p-5 hover:shadow-md transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-semibold text-on-surface truncate">
            {isVendor ? order.customerName || 'Customer' : order.shopName || 'Shop'}
          </p>
          <p className="text-xs text-on-surface-variant">{timeAgo}</p>
        </div>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>

      <div className="space-y-1.5 mb-3">
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span className="text-on-surface-variant">{item.productName} × {item.quantity}</span>
            <span className="font-medium text-on-surface">₹{item.price * item.quantity}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-outline-variant/10 pt-3 flex items-center justify-between">
        <span className="font-bold text-on-surface">Total: ₹{order.totalAmount}</span>

        {isVendor && order.status === 'pending' && onStatusUpdate && (
          <div className="flex gap-2">
            <button
              onClick={() => onStatusUpdate(order.id, 'rejected')}
              className="px-3 py-1.5 text-xs font-medium text-error border border-error/20 rounded-lg hover:bg-error-container/20 active:scale-95 transition-all"
            >
              Reject
            </button>
            <button
              onClick={() => onStatusUpdate(order.id, 'accepted')}
              className="px-3 py-1.5 text-xs font-medium text-white bg-secondary rounded-lg hover:opacity-90 active:scale-95 transition-all"
            >
              Accept
            </button>
          </div>
        )}

        {isVendor && order.status === 'accepted' && onStatusUpdate && (
          <button
            onClick={() => onStatusUpdate(order.id, 'preparing')}
            className="px-3 py-1.5 text-xs font-medium text-white bg-primary rounded-lg hover:opacity-90 active:scale-95 transition-all"
          >
            Start Preparing
          </button>
        )}

        {isVendor && order.status === 'preparing' && onStatusUpdate && (
          <button
            onClick={() => onStatusUpdate(order.id, 'ready')}
            className="px-3 py-1.5 text-xs font-medium text-white bg-secondary rounded-lg hover:opacity-90 active:scale-95 transition-all"
          >
            Mark Ready
          </button>
        )}

        {isVendor && order.status === 'ready' && onStatusUpdate && (
          <button
            onClick={() => onStatusUpdate(order.id, 'completed')}
            className="px-3 py-1.5 text-xs font-medium text-white bg-secondary rounded-lg hover:opacity-90 active:scale-95 transition-all"
          >
            Mark Complete
          </button>
        )}
      </div>
    </div>
  );
}
