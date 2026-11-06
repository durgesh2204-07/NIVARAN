import React from 'react';
import {
  CheckCircle2,
  FileDown,
  FileText,
  Printer,
  Scale,
  Volume2,
  X,
} from 'lucide-react';
import jsPDF from 'jspdf';
import { useAppStore } from '../store/useAppStore';
import { buildRationale } from '../utils/scoring';
import { RiskBadge } from './RiskBadge';
import { Language } from '../types';

export const ExplainScoreModal: React.FC = () => {
  const payload = useAppStore((s) => s.explainModalPayload);
  const closeExplainModal = useAppStore((s) => s.closeExplainModal);
  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);
  const user = useAppStore((s) => s.user);
  const currentMethodVersion = useAppStore((s) => s.currentMethodVersion);
  const addToast = useAppStore((s) => s.addToast);

  if (!payload) return null;

  const rationaleText = buildRationale(payload, language, 40);

  const speakExplanation = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && rationaleText) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(rationaleText);
      utterance.lang =
        language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : 'en-IN';
      window.speechSynthesis.speak(utterance);
    }
  };

  const downloadDecisionRecordPdf = () => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const nowStr = new Date().toLocaleString('en-IN');

    doc.setFillColor(11, 31, 51);
    doc.rect(0, 0, 595, 78, 'F');
    doc.setTextColor(11, 143, 128);
    doc.setFontSize(9);
    doc.text('NIVARAN — NATIONAL DISASTER RISK, RED ZONE & RELOCATION MANAGEMENT SYSTEM', 40, 28);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(15);
    doc.text('OFFICIAL SCORE RATIONALE & DECISION RECORD', 40, 50);
    doc.setFontSize(9);
    doc.setTextColor(203, 213, 225);
    doc.text(
      `Generated: ${nowStr} · Method: ${currentMethodVersion} · Officer: ${user?.name ?? 'Authorized Official'}`,
      40,
      66
    );

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(13);
    doc.text(payload.title, 40, 108);
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(payload.subtitle, 40, 124);

    doc.setFillColor(228, 233, 240);
    doc.roundedRect(40, 138, 515, 48, 6, 6, 'F');
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.text(`Composite Weighted Score: ${payload.totalScore.toFixed(3)}`, 54, 160);
    doc.text(
      `Classification: ${(payload.riskLevel ?? 'ASSESSED').toUpperCase()} ${
        payload.rank ? `· Priority Rank #${payload.rank} of 40` : ''
      }`,
      54,
      176
    );

    let y = 212;
    doc.setFontSize(11);
    doc.setTextColor(11, 31, 51);
    doc.text('1. Factor Contribution Breakdown', 40, y);
    y += 16;

    payload.factors.forEach((f) => {
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(40, y, 515, 34, 4, 4, 'F');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(`${f.name} (${f.percentageOfScore}% share)`, 50, y + 14);
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text(
        `Raw: ${f.rawDisplay} | Normalised: ${f.normalizedValue.toFixed(2)} | Weight: ${Math.round(
          f.weight * 100
        )}% | Contribution: +${f.contribution.toFixed(3)}`,
        50,
        y + 27
      );
      y += 40;
    });

    y += 12;
    doc.setFontSize(11);
    doc.setTextColor(11, 31, 51);
    doc.text('2. Plain-Language Score Rationale', 40, y);
    y += 16;
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    const wrappedNarrative = doc.splitTextToSize(rationaleText, 510);
    doc.text(wrappedNarrative, 40, y);
    y += wrappedNarrative.length * 14 + 14;

    doc.setFontSize(11);
    doc.setTextColor(11, 31, 51);
    doc.text('3. Supporting Field & Census Evidence', 40, y);
    y += 16;
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    payload.contextNotes.forEach((note) => {
      const lines = doc.splitTextToSize(`· ${note}`, 505);
      doc.text(lines, 44, y);
      y += lines.length * 13 + 4;
    });

    y = Math.max(y + 30, 690);
    doc.setDrawColor(203, 213, 225);
    doc.line(40, y, 240, y);
    doc.line(340, y, 555, y);
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text('Prepared By: GIS & Risk Analysis Cell', 40, y + 14);
    doc.text('Countersigned By: District Collector / Incident Commander', 340, y + 14);

    doc.save(
      `Nivaran-Decision-Record-${(payload.entityName || payload.villageName).replace(/\s+/g, '-')}.pdf`
    );
    addToast('Decision Record PDF downloaded.', 'success');
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="explain-modal-title"
    >
      <div className="neu-raised w-full max-w-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#0B1F33] text-white px-6 py-4 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#0B8F80]">
              <Scale className="w-4 h-4" strokeWidth={1.75} />
              <span>Score Rationale & Decision Record · Method {currentMethodVersion}</span>
            </div>
            <h2 id="explain-modal-title" className="text-lg font-bold mt-1">
              {payload.title}
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">{payload.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={closeExplainModal}
            className="p-2 rounded text-slate-300 hover:text-white hover:bg-white/10"
            aria-label="Close score rationale modal"
          >
            <X className="w-5 h-5" strokeWidth={1.75} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[78vh] overflow-y-auto space-y-5">
          {/* Score summary + Language switcher */}
          <div className="neu-flat p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div>
                <div className="text-xs text-[var(--text-secondary)]">Composite Score</div>
                <div className="text-3xl font-mono font-bold tabular-nums">
                  {payload.totalScore.toFixed(3)}
                </div>
              </div>
              {payload.riskLevel && <RiskBadge level={payload.riskLevel} size="lg" />}
              {payload.rank && (
                <span className="px-3 py-1 rounded bg-[#0B1F33] text-white text-xs font-mono font-bold">
                  Rank {payload.rank} of 40
                </span>
              )}
            </div>

            <div className="neu-inset p-1 flex items-center gap-1">
              {(['en', 'hi', 'mr'] as Language[]).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLanguage(lang)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold ${
                    language === lang
                      ? 'bg-[#0B8F80] text-white'
                      : 'text-[var(--text-secondary)]'
                  }`}
                >
                  {lang === 'en' ? 'English' : lang === 'hi' ? 'हिन्दी' : 'मराठी'}
                </button>
              ))}
            </div>
          </div>

          {/* 100% Stacked Bar of Factor Contributions */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
              <span>Factor Contribution Stacked Breakdown (100%)</span>
              <span className="font-mono">Total = {payload.totalScore.toFixed(3)}</span>
            </div>
            <div className="h-5 w-full rounded overflow-hidden flex border border-[var(--border)]">
              {payload.factors.map((f) => (
                <div
                  key={f.name}
                  style={{
                    width: `${Math.max(6, f.percentageOfScore)}%`,
                    backgroundColor: f.color,
                  }}
                  className="h-full"
                  title={`${f.name}: ${f.percentageOfScore}%`}
                />
              ))}
            </div>
          </div>

          {/* Structured Factor Table (Raw value, Normalised value, Weight, Contribution) */}
          <div className="neu-flat overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--text-secondary)]">
                  <th className="py-2.5 px-3 font-semibold">Factor</th>
                  <th className="py-2.5 px-3 font-semibold">Raw Value</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Normalised</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Weight</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Contribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {payload.factors.map((f) => (
                  <tr key={f.name}>
                    <td className="py-2.5 px-3 font-semibold flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-sm shrink-0"
                        style={{ backgroundColor: f.color }}
                      />
                      <span>{f.name}</span>
                    </td>
                    <td className="py-2.5 px-3 text-[var(--text-secondary)]">{f.rawDisplay}</td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      {f.normalizedValue.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      {Math.round(f.weight * 100)}%
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold">
                      +{f.contribution.toFixed(3)} ({f.percentageOfScore}%)
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Templated Plain-Language Statement */}
          <div className="neu-flat p-4 space-y-2 border-l-4 border-l-[#0B8F80]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-[#0B8F80]">
                <FileText className="w-4 h-4" strokeWidth={1.75} />
                <span>Templated Score Statement ({language.toUpperCase()})</span>
              </div>
              <button
                type="button"
                onClick={speakExplanation}
                className="neu-btn px-2.5 py-1 text-xs font-semibold flex items-center gap-1"
              >
                <Volume2 className="w-3.5 h-3.5 text-[#0B8F80]" strokeWidth={1.75} />
                <span>Read aloud</span>
              </button>
            </div>
            <p className="text-sm font-medium leading-relaxed">{rationaleText}</p>
          </div>

          {/* Supporting Field & Census Evidence */}
          <div className="space-y-1.5">
            <div className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              Supporting Field & Census Evidence
            </div>
            {payload.contextNotes.map((note, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#0B8F80] shrink-0" strokeWidth={1.75} />
                <span>{note}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={downloadDecisionRecordPdf}
              className="px-3.5 py-2 rounded-[10px] bg-[#0B1F33] text-white text-xs font-semibold flex items-center gap-1.5"
            >
              <FileDown className="w-3.5 h-3.5 text-[#0B8F80]" strokeWidth={1.75} />
              <span>Decision Record (PDF)</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="neu-btn px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Print Decision Record</span>
            </button>
          </div>
          <button
            type="button"
            onClick={closeExplainModal}
            className="px-4 py-2 rounded-[10px] bg-[#0B8F80] text-white text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
