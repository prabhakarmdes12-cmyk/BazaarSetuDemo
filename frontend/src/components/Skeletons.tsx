'use client';

import React from 'react';

function ShimmerBlock({ className }: { className: string }) {
  return <div className={`shimmer rounded-xl ${className}`} />;
}

export function ShopSkeleton() {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-4 animate-fade-in">
      <ShimmerBlock className="w-full h-48 mb-4" />
      <div className="flex justify-between items-start mb-3">
        <ShimmerBlock className="h-5 w-2/5" />
        <ShimmerBlock className="h-5 w-14" />
      </div>
      <ShimmerBlock className="h-3 w-1/3 mb-4" />
      <ShimmerBlock className="h-10 w-full" />
    </div>
  );
}

export function ProductSkeleton() {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-4 animate-fade-in">
      <ShimmerBlock className="w-full aspect-square mb-3" />
      <ShimmerBlock className="h-4 w-2/3 mb-2" />
      <div className="flex justify-between items-center">
        <ShimmerBlock className="h-4 w-1/4" />
        <ShimmerBlock className="h-8 w-16" />
      </div>
    </div>
  );
}

export function OrderSkeleton() {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-5 animate-fade-in">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-start gap-4">
          <ShimmerBlock className="w-16 h-16" />
          <div className="space-y-2">
            <ShimmerBlock className="h-4 w-32" />
            <ShimmerBlock className="h-3 w-24" />
          </div>
        </div>
        <ShimmerBlock className="h-5 w-20" />
      </div>
      <div className="flex items-center justify-between py-4 border-y border-outline-variant/10">
        <ShimmerBlock className="h-8 w-16" />
        <ShimmerBlock className="h-8 w-20" />
      </div>
      <div className="mt-5 flex gap-3">
        <ShimmerBlock className="h-10 flex-1" />
        <ShimmerBlock className="h-10 flex-[1.5]" />
      </div>
    </div>
  );
}

export function ChatSkeleton() {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-4 animate-fade-in">
      <div className="flex gap-3">
        <ShimmerBlock className="w-12 h-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <ShimmerBlock className="h-4 w-1/2" />
          <ShimmerBlock className="h-3 w-3/4" />
        </div>
        <ShimmerBlock className="h-4 w-8" />
      </div>
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
      <div className="bg-surface-container-lowest rounded-xl p-6">
        <ShimmerBlock className="h-8 w-8 mb-4" />
        <ShimmerBlock className="h-3 w-24 mb-2" />
        <ShimmerBlock className="h-10 w-20" />
      </div>
      <div className="bg-surface-container-lowest rounded-xl p-6">
        <ShimmerBlock className="h-8 w-8 mb-4" />
        <ShimmerBlock className="h-3 w-24 mb-2" />
        <ShimmerBlock className="h-10 w-16" />
      </div>
      <div className="bg-surface-container-lowest rounded-xl p-6">
        <ShimmerBlock className="h-8 w-8 mb-4" />
        <ShimmerBlock className="h-3 w-24 mb-2" />
        <ShimmerBlock className="h-10 w-24" />
      </div>
    </div>
  );
}

export function ShopDetailSkeleton() {
  return (
    <div className="animate-fade-in">
      <ShimmerBlock className="w-full h-56 mb-6" />
      <div className="space-y-4">
        <ShimmerBlock className="h-6 w-1/2" />
        <ShimmerBlock className="h-4 w-3/4" />
        <div className="flex gap-2">
          <ShimmerBlock className="h-8 w-20" />
          <ShimmerBlock className="h-8 w-20" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 mt-8">
        <ProductSkeleton />
        <ProductSkeleton />
        <ProductSkeleton />
        <ProductSkeleton />
      </div>
    </div>
  );
}
