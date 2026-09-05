'use client';

import React from 'react';
import { UdharLedger } from '@/types';
import { Icon } from '@/components/ui';

interface UdharPanelProps {
  ledger: UdharLedger | null;
  isVendor?: boolean;
}

export default function UdharPanel({ ledger, isVendor = false }: UdharPanelProps) {
  if (!ledger || (ledger.balance === 0 && ledger.entries.length === 0)) {
    return (
      <div className="card text-center py-6">
        <Icon name="account_balance_wallet" size="xl" className="text-on-surface-variant mb-2" />
        <p className="text-sm text-on-surface-variant">Koi udhaar nahi hai</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="card flex items-center justify-between">
        <div>
          <p className="text-xs text-on-surface-variant">Total Udhaar</p>
          <p className={`text-2xl font-bold ${ledger.balance > 0 ? 'text-error' : 'text-success'}`}>
            ₹{ledger.balance}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-on-surface-variant">Diya: ₹{ledger.totalDue}</p>
          <p className="text-xs text-on-surface-variant">Wapas: ₹{ledger.totalPaid}</p>
        </div>
      </div>

      {ledger.entries.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-on-surface">Recent</h4>
          {ledger.entries.map((entry) => (
            <div key={entry.id} className="card !p-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-on-surface">
                  {entry.type === 'CREDIT' ? 'Udhaar' : 'Payment'}
                </p>
                {entry.note && <p className="text-xs text-on-surface-variant">{entry.note}</p>}
              </div>
              <div className="text-right">
                <p className={`text-sm font-bold ${entry.type === 'CREDIT' ? 'text-error' : 'text-success'}`}>
                  {entry.type === 'CREDIT' ? '+' : '-'}₹{entry.amount}
                </p>
                <p className="text-[10px] text-on-surface-variant">
                  {new Date(entry.createdAt).toLocaleDateString('en-IN')}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
