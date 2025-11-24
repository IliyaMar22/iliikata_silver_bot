import React from 'react';
import { FaStream, FaBullseye, FaArrowUp, FaInfoCircle } from 'react-icons/fa';

interface ClaudeSummaryData {
  headline: string;
  body: string;
  status: string;
}

interface SpotSource {
  source: string;
  price: number;
  currency: string;
}

interface IntradaySnapshot {
  current: number;
  change_pct: number;
  timestamp: string;
}

interface SpotPrices {
  average?: number;
  spread_pct?: number;
  sources?: SpotSource[];
  intraday?: IntradaySnapshot;
}

interface Props {
  summary: ClaudeSummaryData | null;
  spotPrices: SpotPrices | null;
}

const formatCurrency = (value?: number) => {
  if (value === undefined || value === null || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const ClaudeSummary: React.FC<Props> = ({ summary, spotPrices }) => {
  if (!summary && !spotPrices) return null;

  const bodyParagraphs = (summary?.body ?? '')
    .split('\n')
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);

  return (
    <section className="mb-8">
      <div className="bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_60%)] pointer-events-none" />
        
        <div className="relative p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 sm:gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-xs font-semibold tracking-wide flex items-center gap-2">
                  <FaStream className="text-sm" />
                  Claude Intelligence
                </div>
                {summary?.status !== 'ok' && (
                  <div className="text-xs text-amber-300 flex items-center gap-1">
                    <FaInfoCircle />
                    {summary?.headline ?? 'AI summary unavailable'}
                  </div>
                )}
              </div>

              <h2 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                {summary?.headline || 'Silver market overview'}
              </h2>

              <div className="mt-4 space-y-2 text-gray-100 leading-relaxed text-base">
                {bodyParagraphs.length === 0 ? (
                  <p className="text-gray-400 italic">Waiting for market summary…</p>
                ) : (
                  bodyParagraphs.slice(0, 3).map((paragraph, idx) => (
                    <p key={idx} className={idx === 0 ? 'font-semibold' : ''}>{paragraph}</p>
                  ))
                )}
              </div>
            </div>

            <div className="w-full lg:w-80 bg-black/40 border border-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-inner">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-300 uppercase tracking-wide mb-4">
                <FaBullseye />
                Spot Audit
              </div>

              <div className="bg-gradient-to-r from-emerald-600/60 to-teal-600/60 rounded-2xl p-4 text-white mb-4">
                <div className="text-xs uppercase tracking-wide text-emerald-100 opacity-80">Blended Spot</div>
                <div className="text-3xl font-black">{formatCurrency(spotPrices?.average)}</div>
                <div className="text-xs text-emerald-100 opacity-80 mt-1">
                  Spread: {spotPrices?.spread_pct ? `${spotPrices.spread_pct.toFixed(2)}%` : '—'}
                </div>
              </div>

              {spotPrices?.intraday && 
               typeof spotPrices.intraday.change_pct === 'number' && 
               !Number.isNaN(spotPrices.intraday.change_pct) ? (
                <div className="flex items-center justify-between text-sm text-slate-200 mb-4">
                  <div className="flex items-center gap-2">
                    <FaArrowUp className={`${spotPrices.intraday.change_pct >= 0 ? 'text-emerald-300' : 'text-rose-300'} ${spotPrices.intraday.change_pct < 0 ? 'rotate-180' : ''}`} />
                    <span>{spotPrices.intraday.change_pct.toFixed(2)}%</span>
                  </div>
                  <div className="text-xs text-slate-400">
                    {spotPrices.intraday.timestamp ? new Date(spotPrices.intraday.timestamp).toLocaleTimeString() : '—'}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-500 mb-4">Waiting for intraday change…</div>
              )}

              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {spotPrices?.sources && spotPrices.sources.length > 0 ? (
                  spotPrices.sources.map((source) => (
                    <div
                      key={source.source}
                      className="flex items-center justify-between text-sm text-slate-200 bg-white/5 px-3 py-2 rounded-xl border border-white/5"
                    >
                      <span className="font-semibold capitalize">{source.source}</span>
                      <span>{formatCurrency(source.price)}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-400">Waiting for live sources…</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ClaudeSummary;

