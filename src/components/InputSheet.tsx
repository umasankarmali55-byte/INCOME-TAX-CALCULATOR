import React from 'react';
import {
  Building2,
  Calculator,
  CalendarClock,
  Home,
  Layers,
  Plus,
  Scale,
  Table2,
  Trash2,
  UserRound,
} from 'lucide-react';
import {
  AnnualComputation,
  GisHbaLabel,
  MonthlyRow,
  PensionScheme,
  TaxRegime,
  TaxState,
  YesNo,
} from '../types/tax';
import {
  fmtRupee,
  getMonthLabel,
  HRA_PERCENT_OPTIONS,
  MONTHS,
} from '../utils/taxEngine';

interface InputSheetProps {
  state: TaxState;
  computed: AnnualComputation;
  onFieldChange: <K extends keyof TaxState>(key: K, value: TaxState[K]) => void;
  onMonthCellChange: (
    rowIndex: number,
    field: keyof Omit<MonthlyRow, 'cpfManual'>,
    rawValue: string
  ) => void;
  onToggleHraNo: (monthIndex: number, checked: boolean) => void;
  onArrearLabelChange: (id: string, label: string) => void;
  onArrearDaChange: (id: string, value: number) => void;
  onArrearGrossChange: (id: string, value: number) => void;
  onArrearCpfChange: (id: string, rawValue: string) => void;
  onAddArrear: () => void;
  onRemoveArrear: (id: string) => void;
}

const inputBase =
  'w-full rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-1.5 text-sm font-medium text-slate-900 transition-all focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/15 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-950/80 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:bg-slate-950 dark:disabled:bg-slate-900 dark:disabled:text-slate-600';

const numInputBase = `${inputBase} font-mono-num`;

const FieldRow: React.FC<{label: string; htmlFor?: string; children: React.ReactNode}> = ({
  label,
  htmlFor,
  children,
}) => (
  <div className="grid grid-cols-1 items-center gap-1.5 py-2 sm:grid-cols-[1fr_1.15fr] sm:gap-3">
    <label
      htmlFor={htmlFor}
      className="text-xs font-semibold text-slate-700 dark:text-slate-300"
    >
      {label}
    </label>
    <div>{children}</div>
  </div>
);

const SLAB_BAR_COLORS = [
  'bg-emerald-500',
  'bg-sky-500',
  'bg-blue-500',
  'bg-indigo-500',
  'bg-violet-500',
  'bg-amber-500',
  'bg-rose-500',
];

export const InputSheet: React.FC<InputSheetProps> = ({
  state,
  computed,
  onFieldChange,
  onMonthCellChange,
  onToggleHraNo,
  onArrearLabelChange,
  onArrearDaChange,
  onArrearGrossChange,
  onArrearCpfChange,
  onAddArrear,
  onRemoveArrear,
}) => {
  const isNPS = state.pen.startsWith('NPS');

  // Salary composition proportions for the colorful visual breakdown bar
  const monthlyDaTotal = computed.months.reduce((sum, m) => sum + m.daAmount, 0);
  const compBase = Math.max(
    1,
    computed.totals.pay + monthlyDaTotal + computed.totals.hra + computed.arrearGrossTotal
  );
  const payPct = Math.round((computed.totals.pay / compBase) * 100);
  const daPctShare = Math.round((monthlyDaTotal / compBase) * 100);
  const hraPctShare = Math.round((computed.totals.hra / compBase) * 100);
  const arrPctShare = Math.max(0, 100 - payPct - daPctShare - hraPctShare);

  const maxSlabSlice = Math.max(
    1,
    ...computed.activeTax.slabs.map((s) => s.taxableSlice)
  );

  return (
    <div className="space-y-6">
      {/* Colorful Salary Composition Strip */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Annual Salary Composition
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-slate-600 dark:text-slate-300">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-xs bg-blue-600" aria-hidden="true" />
              Basic Pay ({payPct}%) · <span className="font-mono-num font-bold text-slate-900 dark:text-white">{fmtRupee(computed.totals.pay)}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-xs bg-teal-500" aria-hidden="true" />
              D.A ({daPctShare}%) · <span className="font-mono-num font-bold text-slate-900 dark:text-white">{fmtRupee(monthlyDaTotal)}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-xs bg-amber-500" aria-hidden="true" />
              H.R.A ({hraPctShare}%) · <span className="font-mono-num font-bold text-slate-900 dark:text-white">{fmtRupee(computed.totals.hra)}</span>
            </span>
            {computed.arrearGrossTotal > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-violet-500" aria-hidden="true" />
                Arrears ({arrPctShare}%) · <span className="font-mono-num font-bold text-slate-900 dark:text-white">{fmtRupee(computed.arrearGrossTotal)}</span>
              </span>
            )}
          </div>
        </div>
        <div className="mt-3 flex h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className="bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-300"
            style={{width: `${(computed.totals.pay / compBase) * 100}%`}}
            title={`Basic Pay: ${fmtRupee(computed.totals.pay)}`}
          />
          <div
            className="bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-300"
            style={{width: `${(monthlyDaTotal / compBase) * 100}%`}}
            title={`Dearness Allowance: ${fmtRupee(monthlyDaTotal)}`}
          />
          <div
            className="bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-300"
            style={{width: `${(computed.totals.hra / compBase) * 100}%`}}
            title={`HRA: ${fmtRupee(computed.totals.hra)}`}
          />
          <div
            className="bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-300"
            style={{width: `${(computed.arrearGrossTotal / compBase) * 100}%`}}
            title={`Arrears Gross: ${fmtRupee(computed.arrearGrossTotal)}`}
          />
        </div>
      </section>

      {/* Top 6 Colorful Configuration Cards */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {/* 1. Employee Particulars */}
        <section className="overflow-hidden rounded-2xl border border-blue-200/80 bg-white shadow-xs dark:border-blue-900/50 dark:bg-slate-900">
          <div className="flex items-center gap-2.5 bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] px-5 py-3.5 text-white">
            <UserRound className="h-4 w-4 text-blue-200" aria-hidden="true" />
            <h2 className="text-sm font-bold tracking-tight">Employee Particulars</h2>
          </div>
          <div className="divide-y divide-slate-100 p-5 pt-2 dark:divide-slate-800/70">
            <FieldRow label="Financial Year" htmlFor="f-fy">
              <input
                id="f-fy"
                type="text"
                value={state.fy}
                onChange={(e) => onFieldChange('fy', e.target.value)}
                className={numInputBase}
              />
            </FieldRow>
            <FieldRow label="Assessment Year" htmlFor="f-ay">
              <input
                id="f-ay"
                type="text"
                value={state.ay}
                onChange={(e) => onFieldChange('ay', e.target.value)}
                className={numInputBase}
              />
            </FieldRow>
            <FieldRow label="Employee Name" htmlFor="f-name">
              <input
                id="f-name"
                type="text"
                value={state.name}
                onChange={(e) => onFieldChange('name', e.target.value)}
                className={inputBase}
              />
            </FieldRow>
            <FieldRow label="Designation" htmlFor="f-desig">
              <input
                id="f-desig"
                type="text"
                value={state.desig}
                onChange={(e) => onFieldChange('desig', e.target.value)}
                className={inputBase}
              />
            </FieldRow>
            <FieldRow label="PAN Number" htmlFor="f-pan">
              <input
                id="f-pan"
                type="text"
                value={state.pan}
                onChange={(e) => onFieldChange('pan', e.target.value.toUpperCase())}
                className={`${numInputBase} uppercase`}
              />
            </FieldRow>
            <FieldRow label="Pension Scheme" htmlFor="f-pen">
              <select
                id="f-pen"
                value={state.pen}
                onChange={(e) => onFieldChange('pen', e.target.value as PensionScheme)}
                className={inputBase}
              >
                <option value="OPS (Old Pension Scheme - GPF)">
                  OPS (Old Pension Scheme - GPF)
                </option>
                <option value="NPS (PRAN)">NPS (PRAN)</option>
              </select>
            </FieldRow>
            <FieldRow label="PRAN / GPF Number" htmlFor="f-gpfno">
              <input
                id="f-gpfno"
                type="text"
                value={state.gpfno}
                onChange={(e) => onFieldChange('gpfno', e.target.value)}
                className={numInputBase}
              />
            </FieldRow>
            <FieldRow label="School / Office Address" htmlFor="f-addr">
              <input
                id="f-addr"
                type="text"
                value={state.addr}
                onChange={(e) => onFieldChange('addr', e.target.value)}
                className={inputBase}
              />
            </FieldRow>
          </div>
        </section>

        {/* 2. GPF (OPS) & Housing Details */}
        <section className="overflow-hidden rounded-2xl border border-teal-200/80 bg-white shadow-xs dark:border-teal-900/50 dark:bg-slate-900">
          <div className="flex items-center gap-2.5 bg-gradient-to-r from-[#0F766E] to-[#0D9488] px-5 py-3.5 text-white">
            <Home className="h-4 w-4 text-teal-200" aria-hidden="true" />
            <h2 className="text-sm font-bold tracking-tight">GPF (OPS) &amp; Housing Details</h2>
          </div>
          <div className="divide-y divide-slate-100 p-5 pt-2 dark:divide-slate-800/70">
            <FieldRow label="Monthly GPF Subscription" htmlFor="f-gpf">
              <input
                id="f-gpf"
                type="number"
                disabled={isNPS}
                value={state.gpf}
                onChange={(e) => onFieldChange('gpf', Number(e.target.value) || 0)}
                className={numInputBase}
              />
            </FieldRow>
            <FieldRow label="GPF Increased From Month" htmlFor="f-incM">
              <select
                id="f-incM"
                disabled={isNPS}
                value={state.incM}
                onChange={(e) => onFieldChange('incM', Number(e.target.value))}
                className={inputBase}
              >
                {MONTHS.map((m, idx) => (
                  <option key={m} value={idx}>
                    {m}
                  </option>
                ))}
              </select>
            </FieldRow>
            <FieldRow label="GPF Increment Amount" htmlFor="f-inc">
              <input
                id="f-inc"
                type="number"
                disabled={isNPS}
                value={state.inc}
                onChange={(e) => onFieldChange('inc', Number(e.target.value) || 0)}
                className={numInputBase}
              />
            </FieldRow>
            <FieldRow label="Did You Pay House Rent?" htmlFor="f-rent">
              <select
                id="f-rent"
                value={state.rent}
                onChange={(e) => onFieldChange('rent', e.target.value as YesNo)}
                className={inputBase}
              >
                <option value="NO">No</option>
                <option value="YES">Yes</option>
              </select>
            </FieldRow>
            <FieldRow label="Actual Rent Paid (Annual)" htmlFor="f-rentAmt">
              <input
                id="f-rentAmt"
                type="number"
                value={state.rentAmt}
                onChange={(e) => onFieldChange('rentAmt', Number(e.target.value) || 0)}
                className={numInputBase}
              />
            </FieldRow>
            <FieldRow label="HRA Received All 12 Months?" htmlFor="f-hraYes">
              <select
                id="f-hraYes"
                value={state.hraYes}
                onChange={(e) => onFieldChange('hraYes', e.target.value as YesNo)}
                className={inputBase}
              >
                <option value="YES">Yes</option>
                <option value="NO">No</option>
              </select>
            </FieldRow>
            <FieldRow label="HRA Rate (%)" htmlFor="f-hraPct">
              <select
                id="f-hraPct"
                value={state.hraPct}
                onChange={(e) => onFieldChange('hraPct', Number(e.target.value))}
                className={numInputBase}
              >
                {HRA_PERCENT_OPTIONS.map((pct) => (
                  <option key={pct} value={pct}>
                    {pct}%
                  </option>
                ))}
              </select>
            </FieldRow>
            <FieldRow label="Monthly Tax Instalment (Mar–Jan)" htmlFor="f-itInst">
              <input
                id="f-itInst"
                type="number"
                value={state.itInst}
                onChange={(e) => onFieldChange('itInst', Number(e.target.value) || 0)}
                className={numInputBase}
              />
            </FieldRow>
            <FieldRow label="Arrear Received This Year?" htmlFor="f-arrYes">
              <select
                id="f-arrYes"
                value={state.arrYes}
                onChange={(e) => onFieldChange('arrYes', e.target.value as YesNo)}
                className={inputBase}
              >
                <option value="YES">Yes</option>
                <option value="NO">No</option>
              </select>
            </FieldRow>
            <FieldRow label="Gross Amount of Arrears">
              <div className="font-mono-num rounded-lg bg-teal-50 px-3 py-1.5 text-right text-sm font-bold text-teal-800 dark:bg-teal-950/60 dark:text-teal-200">
                {fmtRupee(computed.arrearGrossTotal)}
              </div>
            </FieldRow>
          </div>
        </section>

        {/* 3. Tax Regime & Deductions */}
        <section className="flex flex-col overflow-hidden rounded-2xl border border-indigo-200/80 bg-white shadow-xs dark:border-indigo-900/50 dark:bg-slate-900">
          <div className="flex items-center gap-2.5 bg-gradient-to-r from-[#4338CA] to-[#7C3AED] px-5 py-3.5 text-white">
            <Scale className="h-4 w-4 text-indigo-200" aria-hidden="true" />
            <h2 className="text-sm font-bold tracking-tight">Tax Regime &amp; Deductions</h2>
          </div>
          <div className="flex flex-1 flex-col justify-between p-5 pt-2">
            <div className="divide-y divide-slate-100 dark:divide-slate-800/70">
              <FieldRow label="Active Tax Regime" htmlFor="f-reg">
                <select
                  id="f-reg"
                  value={state.reg}
                  onChange={(e) => onFieldChange('reg', e.target.value as TaxRegime)}
                  className={inputBase}
                >
                  <option value="new">New Regime (Default)</option>
                  <option value="old">Old Regime</option>
                </select>
              </FieldRow>
              <FieldRow label="Standard Deduction u/s 16(ia)" htmlFor="f-std">
                <select
                  id="f-std"
                  value={state.std}
                  onChange={(e) => onFieldChange('std', Number(e.target.value))}
                  className={numInputBase}
                >
                  <option value={75000}>₹75,000 (New Regime FY26)</option>
                  <option value={50000}>₹50,000 (Old Regime)</option>
                </select>
              </FieldRow>
              <FieldRow label="Tax Slabs Basis">
                <div className="py-1 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                  Union Budget 2025 (FY26 Slabs)
                </div>
              </FieldRow>
              <FieldRow label="Relief u/s 89(1) (Form 10E)" htmlFor="f-relief">
                <input
                  id="f-relief"
                  type="number"
                  value={state.relief}
                  onChange={(e) => onFieldChange('relief', Number(e.target.value) || 0)}
                  className={numInputBase}
                />
              </FieldRow>
              <FieldRow label="Employer NPS u/s 80CCD(2)" htmlFor="f-nps">
                <input
                  id="f-nps"
                  type="number"
                  value={state.nps}
                  onChange={(e) => onFieldChange('nps', Number(e.target.value) || 0)}
                  className={numInputBase}
                />
              </FieldRow>
            </div>

            {/* Colorful Side-by-Side Regime Comparison */}
            <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
              <div className="text-xs font-bold text-slate-600 dark:text-slate-300">
                Regime Comparison
              </div>
              <div className="mt-2.5 grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => onFieldChange('reg', 'new')}
                  className={`rounded-xl border p-3 text-left transition-all cursor-pointer ${
                    state.reg === 'new'
                      ? 'border-indigo-500 bg-indigo-50/90 ring-1 ring-indigo-500/30 dark:border-indigo-400 dark:bg-indigo-950/60'
                      : 'border-slate-200 bg-slate-50/60 hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-800/40'
                  }`}
                >
                  <div className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">
                    New Regime
                  </div>
                  <div className="font-mono-num mt-1 text-base font-extrabold text-slate-900 dark:text-white">
                    {computed.newTax.totalTax > 0 ? fmtRupee(computed.newTax.totalTax) : 'NIL'}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => onFieldChange('reg', 'old')}
                  className={`rounded-xl border p-3 text-left transition-all cursor-pointer ${
                    state.reg === 'old'
                      ? 'border-violet-500 bg-violet-50/90 ring-1 ring-violet-500/30 dark:border-violet-400 dark:bg-violet-950/60'
                      : 'border-slate-200 bg-slate-50/60 hover:border-violet-300 dark:border-slate-800 dark:bg-slate-800/40'
                  }`}
                >
                  <div className="text-[11px] font-semibold text-violet-700 dark:text-violet-300">
                    Old Regime
                  </div>
                  <div className="font-mono-num mt-1 text-base font-extrabold text-slate-900 dark:text-white">
                    {computed.oldTax.totalTax > 0 ? fmtRupee(computed.oldTax.totalTax) : 'NIL'}
                  </div>
                </button>
              </div>
              <div className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                {computed.regimeSavings === 0
                  ? 'Both regimes produce the exact same tax payable.'
                  : `${computed.recommendedRegime === 'new' ? 'New' : 'Old'} Regime saves ${fmtRupee(computed.regimeSavings)}`}
              </div>
            </div>
          </div>
        </section>

        {/* 4. HRA Adjustment */}
        <section className="overflow-hidden rounded-2xl border border-amber-200/90 bg-white shadow-xs dark:border-amber-900/50 dark:bg-slate-900">
          <div className="flex items-center gap-2.5 bg-gradient-to-r from-[#B45309] to-[#EA580C] px-5 py-3.5 text-white">
            <CalendarClock className="h-4 w-4 text-amber-200" aria-hidden="true" />
            <h2 className="text-sm font-bold tracking-tight">HRA Adjustment (Withheld Months)</h2>
          </div>
          <div className="p-5">
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Select months where HRA was withheld or unpaid:
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {MONTHS.map((_, idx) => {
                const label = getMonthLabel(idx, state.fy);
                const checked = state.hraNo[idx];
                return (
                  <label
                    key={label}
                    className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-semibold transition-all ${
                      checked
                        ? 'border-amber-500 bg-amber-50 text-amber-900 dark:border-amber-500 dark:bg-amber-950/60 dark:text-amber-200'
                        : 'border-slate-200 bg-slate-50/70 text-slate-700 hover:border-amber-300 hover:bg-amber-50/40 dark:border-slate-700/80 dark:bg-slate-800/40 dark:text-slate-200'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => onToggleHraNo(idx, e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-amber-400 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="font-mono-num">{label}</span>
                  </label>
                );
              })}
            </div>

            <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
              <FieldRow label="Withheld HRA Paid Together In" htmlFor="f-hraC">
                <select
                  id="f-hraC"
                  value={state.hraC}
                  onChange={(e) => onFieldChange('hraC', Number(e.target.value))}
                  className={inputBase}
                >
                  <option value={-1}>Not paid in this year</option>
                  {MONTHS.map((_, idx) => (
                    <option key={idx} value={idx}>
                      {getMonthLabel(idx, state.fy)}
                    </option>
                  ))}
                </select>
              </FieldRow>
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Unpaid months show ₹0 HRA and lump the withheld sum into your selected payout month. Individual HRA cells remain editable.
            </p>
          </div>
        </section>

        {/* 5. Slab Breakdown Applied */}
        <section className="flex flex-col overflow-hidden rounded-2xl border border-sky-200/90 bg-white shadow-xs dark:border-sky-900/50 dark:bg-slate-900">
          <div className="flex items-center justify-between bg-gradient-to-r from-[#0369A1] to-[#0284C7] px-5 py-3.5 text-white">
            <div className="flex items-center gap-2.5">
              <Calculator className="h-4 w-4 text-sky-200" aria-hidden="true" />
              <h2 className="text-sm font-bold tracking-tight">Slab Breakdown Applied</h2>
            </div>
            <span className="text-xs font-semibold text-sky-100">
              {state.reg === 'new' ? 'New Regime' : 'Old Regime'}
            </span>
          </div>
          <div className="flex flex-1 flex-col justify-between p-5">
            <div className="space-y-2.5">
              {computed.activeTax.slabs.map((slab, idx) => {
                const widthPct =
                  slab.taxableSlice > 0
                    ? Math.max(6, Math.round((slab.taxableSlice / maxSlabSlice) * 100))
                    : 0;
                const barColor = SLAB_BAR_COLORS[idx % SLAB_BAR_COLORS.length];
                return (
                  <div key={slab.from} className="space-y-1">
                    <div className="flex items-baseline justify-between gap-2 text-xs">
                      <span className="font-mono-num font-semibold text-slate-700 dark:text-slate-200">
                        {slab.to > 1e11
                          ? `Above ${fmtRupee(slab.from)}`
                          : `${fmtRupee(slab.from + 1)} – ${fmtRupee(slab.to)}`}
                        <span className="ml-1.5 text-slate-500 dark:text-slate-400">
                          @ {slab.rate}%
                        </span>
                      </span>
                      <span className="font-mono-num font-bold text-slate-900 dark:text-white">
                        {fmtRupee(slab.taxAmount)}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                        style={{width: `${widthPct}%`}}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 space-y-1.5 border-t border-slate-200 pt-3.5 text-xs dark:border-slate-800">
              <div className="flex justify-between font-semibold text-slate-700 dark:text-slate-300">
                <span>Total Tax before Rebate</span>
                <span className="font-mono-num">
                  {fmtRupee(computed.activeTax.taxBeforeRebate)}
                </span>
              </div>
              <div className="flex justify-between font-semibold text-emerald-700 dark:text-emerald-400">
                <span>Less: Rebate u/s 87A</span>
                <span className="font-mono-num">-{fmtRupee(computed.activeTax.rebate)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Add: 4% Health &amp; Education Cess</span>
                <span className="font-mono-num">{fmtRupee(computed.activeTax.cess)}</span>
              </div>
              <div className="flex justify-between rounded-lg bg-sky-50 px-3 py-2 text-sm font-extrabold text-sky-950 dark:bg-sky-950/60 dark:text-sky-100">
                <span>Total Tax Payable</span>
                <span className="font-mono-num">
                  {computed.activeTax.totalTax > 0
                    ? fmtRupee(computed.activeTax.totalTax)
                    : 'NIL'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Additional Incomes & House Property */}
        <section className="overflow-hidden rounded-2xl border border-rose-200/80 bg-white shadow-xs dark:border-rose-900/50 dark:bg-slate-900">
          <div className="flex items-center gap-2.5 bg-gradient-to-r from-[#9D174D] to-[#E11D48] px-5 py-3.5 text-white">
            <Building2 className="h-4 w-4 text-rose-200" aria-hidden="true" />
            <h2 className="text-sm font-bold tracking-tight">
              Additional Incomes &amp; House Property
            </h2>
          </div>
          <div className="divide-y divide-slate-100 p-5 pt-2 dark:divide-slate-800/70">
            <FieldRow label="Medical Reimbursement" htmlFor="f-med">
              <input
                id="f-med"
                type="number"
                value={state.med}
                onChange={(e) => onFieldChange('med', Number(e.target.value) || 0)}
                className={numInputBase}
              />
            </FieldRow>
            <FieldRow label="Voluntary Retirement / VRS" htmlFor="f-vrs">
              <input
                id="f-vrs"
                type="number"
                value={state.vrs}
                onChange={(e) => onFieldChange('vrs', Number(e.target.value) || 0)}
                className={numInputBase}
              />
            </FieldRow>
            <FieldRow label="Perquisite Valuation" htmlFor="f-perq">
              <input
                id="f-perq"
                type="number"
                value={state.perq}
                onChange={(e) => onFieldChange('perq', Number(e.target.value) || 0)}
                className={numInputBase}
              />
            </FieldRow>
            <FieldRow label="HP: Rent / Municipal Valuation" htmlFor="f-hpR">
              <input
                id="f-hpR"
                type="number"
                value={state.hpR}
                onChange={(e) => onFieldChange('hpR', Number(e.target.value) || 0)}
                className={numInputBase}
              />
            </FieldRow>
            <FieldRow label="HP: Municipal / NAC Tax Paid" htmlFor="f-hpM">
              <input
                id="f-hpM"
                type="number"
                value={state.hpM}
                onChange={(e) => onFieldChange('hpM', Number(e.target.value) || 0)}
                className={numInputBase}
              />
            </FieldRow>
            <FieldRow label="HP: Housing Loan Interest" htmlFor="f-hpI">
              <input
                id="f-hpI"
                type="number"
                value={state.hpI}
                onChange={(e) => onFieldChange('hpI', Number(e.target.value) || 0)}
                className={numInputBase}
              />
            </FieldRow>
            <FieldRow label="Income from Other Sources" htmlFor="f-oth">
              <input
                id="f-oth"
                type="number"
                value={state.oth}
                onChange={(e) => onFieldChange('oth', Number(e.target.value) || 0)}
                className={numInputBase}
              />
            </FieldRow>
          </div>
        </section>
      </div>

      {/* Monthly Salary & Arrears Breakdown Table */}
      <section className="overflow-hidden rounded-2xl border border-indigo-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-[#0F1E4A] via-[#1D3B8B] to-[#0F766E] px-5 py-4 text-white">
          <div className="flex items-center gap-3">
            <Table2 className="h-5 w-5 text-amber-300 shrink-0" aria-hidden="true" />
            <div>
              <h2 className="text-sm font-bold tracking-tight">
                Monthly Salary Breakdown ({state.fy})
              </h2>
              <p className="mt-0.5 text-xs text-blue-100/90">
                Edit any month&apos;s pay or deductions. February Income Tax auto-balances remaining liability.
              </p>
            </div>
          </div>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/20 select-none">
            <input
              type="checkbox"
              checked={state.cascade}
              onChange={(e) => onFieldChange('cascade', e.target.checked)}
              className="h-4 w-4 rounded border-white/50 text-amber-400 focus:ring-amber-300"
            />
            <span>Auto-change remaining months</span>
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] border-collapse text-xs">
            <thead>
              <tr className="border-b border-indigo-200/80 bg-indigo-50/90 text-indigo-950 dark:border-slate-800 dark:bg-slate-800/90 dark:text-slate-100">
                <th className="sticky left-0 z-10 bg-indigo-50 px-3 py-3 text-left font-bold dark:bg-slate-800">
                  Month
                </th>
                <th className="px-2 py-3 text-center font-bold">Basic Salary</th>
                <th className="px-2 py-3 text-center font-bold">LIC</th>
                <th className="px-2 py-3 text-center font-bold">
                  <select
                    aria-label="Choose GIS or HBA column label"
                    value={state.gl}
                    onChange={(e) => onFieldChange('gl', e.target.value as GisHbaLabel)}
                    className="rounded-md border border-indigo-300 bg-white px-2 py-0.5 text-xs font-bold text-indigo-950 focus:border-blue-600 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                  >
                    <option value="GIS">GIS</option>
                    <option value="HBA">HBA</option>
                  </select>
                </th>
                <th className="px-2 py-3 text-center font-bold text-teal-800 dark:text-teal-300">
                  DA %
                </th>
                <th className="px-2 py-3 text-right font-bold text-teal-800 dark:text-teal-300">
                  D.A (₹)
                </th>
                <th className="px-2 py-3 text-center font-bold text-amber-800 dark:text-amber-300">
                  H.R.A (₹)
                </th>
                <th className="bg-blue-100/70 px-2.5 py-3 text-right font-extrabold text-blue-950 dark:bg-blue-950/60 dark:text-blue-200">
                  Gross Total
                </th>
                <th className="px-2 py-3 text-center font-bold text-violet-900 dark:text-violet-300">
                  C.P.F / GPF
                </th>
                <th className="px-2 py-3 text-center font-bold">P.T</th>
                <th className="px-2 py-3 text-center font-bold text-rose-800 dark:text-rose-300">
                  I.T (Tax)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 font-mono-num dark:divide-slate-800">
              {computed.months.map((m, idx) => {
                const rawRow = state.rows[idx];
                const isFeb = idx === 11;
                return (
                  <tr
                    key={m.label}
                    className="odd:bg-white even:bg-slate-50/70 hover:bg-blue-50/60 dark:odd:bg-slate-900 dark:even:bg-slate-900/50 dark:hover:bg-slate-800/60"
                  >
                    <td className="sticky left-0 z-10 bg-inherit px-3 py-2 font-bold text-indigo-950 dark:text-indigo-200">
                      {m.label}
                    </td>
                    <td className="px-1.5 py-1.5">
                      <input
                        type="number"
                        aria-label={`${m.label} Basic Salary`}
                        value={rawRow.basic}
                        onChange={(e) => onMonthCellChange(idx, 'basic', e.target.value)}
                        className="w-full min-w-[76px] rounded-md border border-slate-200 bg-white px-2 py-1 text-right text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                      />
                    </td>
                    <td className="px-1.5 py-1.5">
                      <input
                        type="number"
                        aria-label={`${m.label} LIC`}
                        value={rawRow.lic}
                        onChange={(e) => onMonthCellChange(idx, 'lic', e.target.value)}
                        className="w-full min-w-[64px] rounded-md border border-slate-200 bg-white px-2 py-1 text-right text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                      />
                    </td>
                    <td className="px-1.5 py-1.5">
                      <input
                        type="number"
                        aria-label={`${m.label} ${state.gl}`}
                        value={rawRow.gis}
                        onChange={(e) => onMonthCellChange(idx, 'gis', e.target.value)}
                        className="w-full min-w-[64px] rounded-md border border-slate-200 bg-white px-2 py-1 text-right text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                      />
                    </td>
                    <td className="px-1.5 py-1.5">
                      <input
                        type="number"
                        aria-label={`${m.label} DA Percentage`}
                        value={rawRow.daPct}
                        onChange={(e) => onMonthCellChange(idx, 'daPct', e.target.value)}
                        className="w-full min-w-[54px] rounded-md border border-teal-200 bg-teal-50/40 px-2 py-1 text-right text-xs font-semibold text-teal-950 focus:border-teal-600 focus:bg-white focus:outline-none dark:border-teal-800/70 dark:bg-teal-950/30 dark:text-teal-100"
                      />
                    </td>
                    <td className="px-2 py-1.5 text-right font-semibold text-teal-800 dark:text-teal-300">
                      {fmtRupee(m.daAmount)}
                    </td>
                    <td className="px-1.5 py-1.5">
                      <input
                        type="number"
                        aria-label={`${m.label} HRA`}
                        value={rawRow.hra}
                        onChange={(e) => onMonthCellChange(idx, 'hra', e.target.value)}
                        className="w-full min-w-[68px] rounded-md border border-amber-200 bg-amber-50/40 px-2 py-1 text-right text-xs font-semibold text-amber-950 focus:border-amber-600 focus:bg-white focus:outline-none dark:border-amber-800/70 dark:bg-amber-950/30 dark:text-amber-100"
                      />
                    </td>
                    <td className="bg-blue-50/60 px-2.5 py-1.5 text-right font-extrabold text-blue-900 dark:bg-blue-950/35 dark:text-blue-200">
                      {fmtRupee(m.grossTotal)}
                    </td>
                    <td className="px-1.5 py-1.5">
                      <input
                        type="number"
                        aria-label={`${m.label} CPF or GPF`}
                        value={m.cpf}
                        onChange={(e) => onMonthCellChange(idx, 'cpf', e.target.value)}
                        className="w-full min-w-[74px] rounded-md border border-violet-200 bg-violet-50/30 px-2 py-1 text-right text-xs font-semibold text-slate-900 focus:border-violet-600 focus:bg-white focus:outline-none dark:border-violet-800/60 dark:bg-violet-950/25 dark:text-slate-100"
                      />
                    </td>
                    <td className="px-1.5 py-1.5">
                      <input
                        type="number"
                        aria-label={`${m.label} Professional Tax`}
                        value={rawRow.pt}
                        onChange={(e) => onMonthCellChange(idx, 'pt', e.target.value)}
                        className="w-full min-w-[58px] rounded-md border border-slate-200 bg-white px-2 py-1 text-right text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                      />
                    </td>
                    <td className="px-1.5 py-1.5">
                      <input
                        type="number"
                        aria-label={`${m.label} Income Tax`}
                        value={isFeb ? m.it : rawRow.it}
                        disabled={isFeb}
                        title={
                          isFeb
                            ? 'Auto-calculated balance tax after Mar–Jan instalments'
                            : 'Monthly Income Tax instalment'
                        }
                        onChange={(e) => onMonthCellChange(idx, 'it', e.target.value)}
                        className="w-full min-w-[72px] rounded-md border border-rose-200 bg-rose-50/30 px-2 py-1 text-right text-xs font-semibold text-rose-900 focus:border-rose-600 focus:bg-white focus:outline-none disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-500 dark:border-rose-900/60 dark:bg-rose-950/25 dark:text-rose-200 dark:disabled:border-slate-700 dark:disabled:bg-slate-800 dark:disabled:text-slate-400"
                      />
                    </td>
                  </tr>
                );
              })}

              {/* Arrear Rows */}
              {computed.arrears.map((arr) => {
                const rawArr = state.arrears.find((a) => a.id === arr.id);
                return (
                  <tr
                    key={arr.id}
                    className="bg-gradient-to-r from-amber-50/90 via-orange-50/60 to-amber-50/80 dark:from-amber-950/35 dark:via-orange-950/25 dark:to-amber-950/35"
                  >
                    <td
                      colSpan={2}
                      className="sticky left-0 z-10 bg-amber-50 px-2 py-1.5 dark:bg-amber-950/50"
                    >
                      <input
                        type="text"
                        aria-label="Arrear description"
                        value={arr.label}
                        onChange={(e) => onArrearLabelChange(arr.id, e.target.value)}
                        className="w-full min-w-[160px] rounded-md border border-amber-300 bg-white px-2 py-1 font-sans text-xs font-semibold italic text-amber-950 focus:border-amber-600 focus:outline-none dark:border-amber-800 dark:bg-slate-950 dark:text-amber-100"
                      />
                    </td>
                    <td
                      colSpan={3}
                      className="px-2 py-1.5 text-center font-sans text-[11px] font-medium text-amber-900/80 dark:text-amber-300/80"
                    >
                      Enter DA or Gross (90% ↔ 100%)
                    </td>
                    <td className="px-1.5 py-1.5">
                      <input
                        type="number"
                        aria-label={`${arr.label} DA amount`}
                        placeholder="DA amt"
                        title="Enter DA arrear amount — Gross auto-calculates (× 100/90)"
                        value={arr.daAmount}
                        onChange={(e) =>
                          onArrearDaChange(arr.id, Number(e.target.value) || 0)
                        }
                        className="w-full min-w-[74px] rounded-md border border-amber-300 bg-white px-2 py-1 text-right text-xs font-bold text-amber-950 focus:border-amber-600 focus:outline-none dark:border-amber-800 dark:bg-slate-950 dark:text-amber-100"
                      />
                    </td>
                    <td />
                    <td className="px-1.5 py-1.5">
                      <input
                        type="number"
                        aria-label={`${arr.label} Gross amount`}
                        placeholder="Gross amt"
                        title="Enter Gross arrear amount — DA auto-calculates (× 90/100)"
                        value={arr.grossAmount}
                        onChange={(e) =>
                          onArrearGrossChange(arr.id, Number(e.target.value) || 0)
                        }
                        className="w-full min-w-[78px] rounded-md border border-amber-400 bg-white px-2 py-1 text-right text-xs font-extrabold text-amber-900 focus:border-amber-600 focus:outline-none dark:border-amber-700 dark:bg-slate-950 dark:text-amber-200"
                      />
                    </td>
                    <td className="px-1.5 py-1.5">
                      <input
                        type="number"
                        aria-label={`${arr.label} CPF or GPF`}
                        value={
                          rawArr?.cpfOverride !== null && rawArr?.cpfOverride !== undefined
                            ? rawArr.cpfOverride
                            : arr.cpf
                        }
                        onChange={(e) => onArrearCpfChange(arr.id, e.target.value)}
                        className="w-full min-w-[74px] rounded-md border border-amber-300 bg-white px-2 py-1 text-right text-xs font-semibold text-slate-900 focus:border-amber-600 focus:outline-none dark:border-amber-800 dark:bg-slate-950 dark:text-slate-100"
                      />
                    </td>
                    <td colSpan={2} className="px-2 py-1.5 text-right">
                      <button
                        type="button"
                        onClick={() => onRemoveArrear(arr.id)}
                        title="Remove arrear row"
                        className="inline-flex items-center gap-1 rounded-md bg-rose-600 px-2.5 py-1 font-sans text-xs font-semibold text-white transition-colors hover:bg-rose-700 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Remove</span>
                      </button>
                    </td>
                  </tr>
                );
              })}

              {/* Add Arrear Row */}
              <tr className="bg-amber-50/40 dark:bg-amber-950/15">
                <td colSpan={11} className="px-3 py-2.5 font-sans">
                  <button
                    type="button"
                    onClick={onAddArrear}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-all hover:from-emerald-500 hover:to-teal-500 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Add arrear row (DA arrear / pay arrear)</span>
                  </button>
                </td>
              </tr>

              {/* Annual Total Footer */}
              <tr className="bg-gradient-to-r from-[#0F1E4A] via-[#17337A] to-[#0E4B68] text-white">
                <td className="sticky left-0 z-10 bg-[#0F1E4A] px-3 py-3.5 font-sans text-xs font-extrabold tracking-wide">
                  ANNUAL TOTAL
                </td>
                <td className="px-2 py-3.5 text-right font-bold">{fmtRupee(computed.totals.pay)}</td>
                <td className="px-2 py-3.5 text-right font-bold">
                  {computed.totals.lic > 0 ? fmtRupee(computed.totals.lic) : '—'}
                </td>
                <td className="px-2 py-3.5 text-right font-bold">
                  {computed.totals.gis > 0 ? fmtRupee(computed.totals.gis) : '—'}
                </td>
                <td className="px-2 py-3.5 text-center text-blue-200">—</td>
                <td className="px-2 py-3.5 text-right font-bold text-teal-200">
                  {fmtRupee(computed.totals.da)}
                </td>
                <td className="px-2 py-3.5 text-right font-bold text-amber-200">
                  {fmtRupee(computed.totals.hra)}
                </td>
                <td className="bg-white/10 px-2.5 py-3.5 text-right text-sm font-extrabold text-amber-300">
                  {fmtRupee(computed.totals.tot)}
                </td>
                <td className="px-2 py-3.5 text-right font-bold text-violet-200">
                  {fmtRupee(computed.totals.cpf)}
                </td>
                <td className="px-2 py-3.5 text-right font-bold">{fmtRupee(computed.totals.pt)}</td>
                <td className="px-2 py-3.5 text-right font-extrabold text-amber-300">
                  {fmtRupee(computed.totals.itPaid)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
