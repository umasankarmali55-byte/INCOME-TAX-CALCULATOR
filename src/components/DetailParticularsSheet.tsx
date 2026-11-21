import React from 'react';
import {
  AnnualTotals,
  ComputedArrearRow,
  ComputedMonthRow,
  GisHbaLabel,
  NextYearOverrides,
} from '../types/tax';
import {fmtINR, MONTHS} from '../utils/taxEngine';

interface DetailParticularsSheetProps {
  title: string;
  subtitle?: string;
  fyDisplay: string;
  pan: string;
  gisLabel: GisHbaLabel;
  months: ComputedMonthRow[];
  arrears?: ComputedArrearRow[];
  totals: AnnualTotals;
  med: number;
  vrs: number;
  hpR: number;
  hpM: number;
  hpI: number;
  hpStdDed: number;
  hpNet: number;
  oth: number;
  nps: number;
  isNextYear?: boolean;
  nextOverrides?: NextYearOverrides;
  onNextOverrideChange?: <K extends keyof NextYearOverrides>(
    key: K,
    value: NextYearOverrides[K]
  ) => void;
}

const DottedLine: React.FC<{label: React.ReactNode; value: number; negative?: boolean}> = ({
  label,
  value,
  negative = false,
}) => (
  <div className="ln">
    <span className="l">{label}</span>
    <span className="d" />
    {negative && <span>(-)</span>}
    <span className="v">{fmtINR(value)} /-</span>
  </div>
);

export const DetailParticularsSheet: React.FC<DetailParticularsSheetProps> = ({
  title,
  subtitle,
  fyDisplay,
  pan,
  gisLabel,
  months,
  arrears = [],
  totals,
  med,
  vrs,
  hpR,
  hpM,
  hpI,
  hpStdDed,
  hpNet,
  oth,
  nps,
  isNextYear = false,
  nextOverrides,
  onNextOverrideChange,
}) => {
  return (
    <div className="paper-sheet">
      {isNextYear && nextOverrides && onNextOverrideChange && (
        <div className="no-print mb-5 overflow-hidden rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50/90 via-white to-teal-50/80 font-sans text-xs text-slate-800 shadow-xs">
          <div className="bg-gradient-to-r from-[#17337A] to-[#0F766E] px-4 py-2.5 text-white">
            <p className="font-bold">
              Next Financial Year Projection ({fyDisplay}) — Baseline seeded from February&apos;s Basic, DA % &amp; deductions
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="flex flex-col gap-1">
              <span className="font-semibold text-indigo-900">Override Basic (₹)</span>
              <input
                type="number"
                value={nextOverrides.basicOverride}
                onChange={(e) => onNextOverrideChange('basicOverride', e.target.value)}
                placeholder="Feb basic"
                className="font-mono-num rounded-lg border border-indigo-200 bg-white px-2.5 py-1.5 text-sm font-semibold text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-semibold text-teal-900">Override DA (%)</span>
              <input
                type="number"
                value={nextOverrides.daOverride}
                onChange={(e) => onNextOverrideChange('daOverride', e.target.value)}
                placeholder="Feb DA %"
                className="font-mono-num rounded-lg border border-teal-200 bg-white px-2.5 py-1.5 text-sm font-semibold text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-semibold text-amber-900">Annual Increment From</span>
              <select
                value={nextOverrides.incrementMonth}
                onChange={(e) =>
                  onNextOverrideChange('incrementMonth', Number(e.target.value))
                }
                className="rounded-lg border border-amber-200 bg-white px-2.5 py-1.5 text-sm font-semibold text-slate-900 focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              >
                {MONTHS.map((m, idx) => (
                  <option key={m} value={idx}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-semibold text-emerald-900">Increment Added to Basic (₹)</span>
              <input
                type="number"
                value={nextOverrides.incrementAmount}
                onChange={(e) => onNextOverrideChange('incrementAmount', e.target.value)}
                placeholder="0"
                className="font-mono-num rounded-lg border border-emerald-200 bg-white px-2.5 py-1.5 text-sm font-semibold text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </label>
          </div>
        </div>
      )}

      <h2>{title}</h2>
      {subtitle && (
        <div
          style={{
            textAlign: 'center',
            fontWeight: 800,
            fontSize: '13.5px',
            letterSpacing: '0.75px',
            marginTop: '4px',
            marginBottom: '6px',
            textDecoration: 'underline',
          }}
        >
          {subtitle}
        </div>
      )}

      <div className="flex items-end justify-between">
        <h4>Pay &amp; Allowance (Salary) :-</h4>
        <small className="meta-inline font-sans text-xs font-semibold text-slate-700">
          FY: {fyDisplay} | PAN: {pan}
        </small>
      </div>

      <div className="overflow-x-auto print:overflow-visible">
        <table className="dp">
          <thead>
            <tr>
              <th>Month</th>
              <th>Pay</th>
              <th>P.P</th>
              <th>D.A</th>
              <th>H.R.A</th>
              <th>O.A</th>
              <th>Total</th>
              <th>C.P.F/GPF</th>
              <th>L.I.C</th>
              <th>{gisLabel}</th>
              <th>I.T</th>
              <th>P.T</th>
            </tr>
            <tr className="cn">
              <th>1</th>
              <th>2</th>
              <th>3</th>
              <th>4</th>
              <th>5</th>
              <th>6</th>
              <th>7</th>
              <th>8</th>
              <th>9</th>
              <th>10</th>
              <th>12</th>
              <th>13</th>
            </tr>
          </thead>
          <tbody>
            {months.map((m) => (
              <tr key={m.label}>
                <td>{m.label}</td>
                <td>{fmtINR(m.basic)}</td>
                <td>0</td>
                <td>{fmtINR(m.daAmount)}</td>
                <td>{fmtINR(m.hra)}</td>
                <td>0</td>
                <td>{fmtINR(m.grossTotal)}</td>
                <td>{fmtINR(m.cpf)}</td>
                <td>{fmtINR(m.lic)}</td>
                <td>{fmtINR(m.gis)}</td>
                <td>{m.it ? fmtINR(m.it) : 0}</td>
                <td>{fmtINR(m.pt)}</td>
              </tr>
            ))}

            {arrears.map((a) => (
              <tr key={a.id}>
                <td colSpan={2} style={{fontSize: '0.85em', whiteSpace: 'nowrap'}}>
                  {a.label}
                </td>
                <td />
                <td>{fmtINR(a.daAmount)}</td>
                <td />
                <td />
                <td>{fmtINR(a.grossAmount)}</td>
                <td>{fmtINR(a.cpf)}</td>
                <td />
                <td />
                <td />
                <td />
              </tr>
            ))}

            <tr className="t">
              <td>TOTAL</td>
              <td>{fmtINR(totals.pay)}</td>
              <td>0</td>
              <td>{fmtINR(totals.da)}</td>
              <td>{fmtINR(totals.hra)}</td>
              <td>0</td>
              <td>{fmtINR(totals.tot)}</td>
              <td>{fmtINR(totals.cpf)}</td>
              <td>{fmtINR(totals.lic)}</td>
              <td>{fmtINR(totals.gis)}</td>
              <td>{fmtINR(totals.itPaid)}</td>
              <td>{fmtINR(totals.pt)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="dpx-block">
        <h4>Perquisites as per Form 12BA</h4>
        <DottedLine label="Medical reimbursement by the employer" value={med} />
        <DottedLine label="Amount received on voluntary retirement / Termination" value={vrs} />

        <h4>Income from House properties</h4>
        <DottedLine
          label="Higher : rent received during the years or municipal valuation"
          value={hpR}
        />
        <DottedLine
          label="Less :- Standard deduction for repairs and maintenance (30%)"
          value={hpStdDed}
        />
        <DottedLine label="Municipal or NAC tax" value={hpM} />
        <DottedLine label="Less: Municipal / NAC tax etc" value={hpM} negative />
        <DottedLine label="Less: Interest paid on House Building loan" value={hpI} negative />
        <DottedLine
          label={<b>NET INCOME FROM HOUSE PROPERTIES</b>}
          value={hpNet}
        />

        <h4>Income earned from other sources (Interest earned etc.)</h4>
        <DottedLine label="" value={oth} />

        <h4>Deduction u/s 80CCD(2)</h4>
        <DottedLine label="(Employer contribution toward NPS)" value={nps} />
      </div>
    </div>
  );
};
