import React from 'react';
import { ArrowRight, Calculator, Euro, PiggyBank, TrendingUp } from 'lucide-react';

const TOOL_CARDS = [
  {
    key: 'vergleich',
    title: 'Vergleich',
    description: 'Top Angebote nach Zinssatz und Rahmenbedingungen.',
    icon: TrendingUp,
  },
  {
    key: 'rechner',
    title: 'Rechner',
    description: 'Festgeld-Ertrag mit Betrag, Laufzeit und Zinssatz berechnen.',
    icon: Calculator,
  },
  {
    key: 'inflation',
    title: 'Inflationsrechner',
    description: 'Kaufkraftentwicklung Ihres Kapitals über die Zeit.',
    icon: Euro,
  },
  {
    key: 'sparplan',
    title: 'Sparplan-Rechner',
    description: 'Monatliche Einzahlungen und Ertragsprojektion simulieren.',
    icon: PiggyBank,
  },
];

const ToolsHubSection = ({ selectedTool, onSelectTool }) => (
  <section className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
    <div className="flex items-center justify-between gap-2 mb-3">
      <div>
        <h3 className="text-xl font-semibold text-[#0B1E33]">Rechner & Tools</h3>
        <p className="text-sm text-slate-500">Alle Berechnungen direkt im Dashboard.</p>
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
      {TOOL_CARDS.map((tool) => {
        const Icon = tool.icon;
        const isActive = selectedTool === tool.key;
        return (
          <button
            key={tool.key}
            type="button"
            onClick={() => onSelectTool(tool.key)}
            className={`rounded-xl border p-3 text-left transition-colors ${
              isActive
                ? 'border-teal-300 bg-teal-50'
                : 'border-slate-200 bg-white hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#0B1E33] text-white">
                <Icon size={16} />
              </div>
              <ArrowRight size={14} className="text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-[#0B1E33]">{tool.title}</p>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{tool.description}</p>
          </button>
        );
      })}
    </div>
  </section>
);

export default ToolsHubSection;
