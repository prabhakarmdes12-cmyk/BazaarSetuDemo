'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';

interface ReportType {
  icon: string;
  label: string;
  description: string;
  href?: string;
}

const REPORT_TYPES: ReportType[] = [
  { icon: 'today', label: 'Daily Sales Report', description: 'Aaj ki sales ka detailed breakdown' },
  { icon: 'date_range', label: 'Weekly Summary', description: 'Is hafte ka performance overview' },
  { icon: 'calendar_month', label: 'Monthly Analytics', description: 'Mahine ka comprehensive analysis' },
  { icon: 'event_note', label: 'Annual Report', description: 'Saal ka complete financial report', href: '/vendor/reports/yearly' },
];

export default function ReportsPage() {
  const router = useRouter();
  const { token, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !token) { window.location.assign('/login'); }
  }, [token, authLoading]);

  return (
    <div className="bg-surface min-h-screen">
      {/* Top Bar */}
      <header className="fixed top-0 w-full z-50 bg-surface-container-lowest/80 backdrop-blur-xl shadow-top-bar">
        <div className="flex items-center px-6 h-16 w-full max-w-5xl mx-auto">
          <button onClick={() => router.push('/vendor')} className="active:scale-95 transition-transform p-2 rounded-full hover:bg-surface-container-high mr-4">
            <Icon name="arrow_back" className="text-primary" />
          </button>
          <h1 className="font-headline font-bold text-lg tracking-tight text-on-surface">Business Reports</h1>
        </div>
      </header>

      <main className="pt-24 pb-32 px-6 max-w-5xl mx-auto">
        {/* Header */}
        <section className="mb-12">
          <span className="bg-primary-fixed text-on-primary-fixed px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 inline-block">Reports Center</span>
          <h2 className="text-4xl font-headline font-extrabold text-on-surface tracking-tight">
            Download Your <span className="text-primary">Reports</span>
          </h2>
          <p className="text-on-surface-variant mt-2">Generate and download reports for your business records.</p>
        </section>

        {/* Report Types Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {REPORT_TYPES.map((report) => (
            <button
              key={report.label}
              onClick={() => report.href ? router.push(report.href) : undefined}
              className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm hover:shadow-md transition-all text-left group active:scale-[0.98]"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 bg-primary-container/20 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <Icon name={report.icon} size="lg" />
                </div>
                <Icon name="chevron_right" className="text-on-surface-variant group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="font-headline font-bold text-lg text-on-surface mb-1">{report.label}</h3>
              <p className="text-sm text-on-surface-variant">{report.description}</p>
              <div className="mt-4 flex gap-2">
                <span className="px-3 py-1 bg-surface-container-highest rounded-lg text-[10px] font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1">
                  <Icon name="picture_as_pdf" size="sm" /> PDF
                </span>
                <span className="px-3 py-1 bg-surface-container-highest rounded-lg text-[10px] font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1">
                  <Icon name="table_chart" size="sm" /> CSV
                </span>
              </div>
            </button>
          ))}
        </section>

        {/* Generated Reports */}
        <section>
          <h3 className="font-headline font-bold text-xl mb-6">Pehle Generate Kiye Reports</h3>
          <div className="space-y-3">
            {[
              { name: 'Monthly Report - Oct 2024', date: '1 Nov 2024', type: 'PDF' },
              { name: 'Weekly Report - W43', date: '28 Oct 2024', type: 'CSV' },
              { name: 'Monthly Report - Sep 2024', date: '1 Oct 2024', type: 'PDF' },
            ].map((report, i) => (
              <div key={i} className="bg-surface-container-lowest p-4 rounded-xl flex items-center justify-between hover:bg-surface-container transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${report.type === 'PDF' ? 'bg-error/10 text-error' : 'bg-secondary/10 text-secondary'}`}>
                    <Icon name={report.type === 'PDF' ? 'picture_as_pdf' : 'table_chart'} />
                  </div>
                  <div>
                    <p className="font-headline font-bold text-on-surface text-sm">{report.name}</p>
                    <p className="text-xs text-on-surface-variant">{report.date}</p>
                  </div>
                </div>
                <button className="text-primary font-bold text-xs flex items-center gap-1 active:scale-95 transition-transform">
                  <Icon name="download" size="sm" />
                  Download
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
