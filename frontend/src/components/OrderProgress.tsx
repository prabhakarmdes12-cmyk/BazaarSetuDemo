'use client';

import React from 'react';
import { OrderStatus, ORDER_STEPS } from '@/types';
import { Icon } from '@/components/ui';

interface OrderProgressProps {
  status: OrderStatus;
}

export default function OrderProgress({ status }: OrderProgressProps) {
  if (status === 'rejected') {
    return (
      <div className="flex items-center gap-2 p-3 bg-error-container rounded-xl">
        <Icon name="cancel" className="text-error" />
        <span className="text-sm font-medium text-on-error-container">Order Reject ho gaya</span>
      </div>
    );
  }

  const currentIndex = ORDER_STEPS.findIndex((s) => s.key === status);

  return (
    <div className="flex items-center gap-1 p-3 bg-surface-container-lowest rounded-xl">
      {ORDER_STEPS.map((step, index) => {
        const isActive = index <= currentIndex;
        const isCurrent = index === currentIndex;
        return (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm transition-all ${
                  isCurrent
                    ? 'bg-primary text-white scale-110 shadow-brand-glow'
                    : isActive
                    ? 'bg-secondary-container text-on-secondary-container'
                    : 'bg-surface-container-high text-on-surface-variant'
                }`}
              >
                <Icon name={step.icon} size="sm" filled={isActive} />
              </div>
              <span
                className={`text-[10px] font-medium ${
                  isActive ? 'text-on-surface' : 'text-on-surface-variant'
                }`}
              >
                {step.labelHi}
              </span>
            </div>
            {index < ORDER_STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 rounded-full mx-1 ${
                  index < currentIndex ? 'bg-success' : 'bg-surface-container-high'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
