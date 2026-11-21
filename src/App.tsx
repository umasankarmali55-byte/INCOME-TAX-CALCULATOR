import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {flushSync} from 'react-dom';
import {
  FileDown,
  IndianRupee,
  Moon,
  Palette,
  Printer,
  RotateCcw,
  ShieldCheck,
  Sun,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import {DetailParticularsSheet} from './components/DetailParticularsSheet';
import {InputSheet} from './components/InputSheet';
import {OfflineIndicator} from './components/OfflineIndicator';
import {PWAInstallButton} from './components/PWAInstallButton';
import {TaxComputationSheet} from './components/TaxComputationSheet';
import {
  MonthlyRow,
  NextYearOverrides,
  PrintDesign,
  SheetId,
  TaxState,
} from './types/tax';
import {
  applyGPFToRows,
  computeAnnualTax,
  computeNextYearTax,
  createDefaultTaxState,
  fmtRupee,
  recomputeHRAForRows,
} from './utils/taxEngine';

const STORAGE_KEY = 'govttax_india_state_v1';
const THEME_KEY = 'govttax_india_theme_v1';
const DESIGN_KEY = 'govttax_india_design_v1';

const SHEET_TABS: ReadonlyArray<{id: SheetId; label: string; shortLabel: string}> = [
  {id: 's1', label: 'Input', shortLabel: 'Input'},
  {id: 's2', label: 'Detail Sheet', shortLabel: 'Detail'},
  {id: 's3', label: 'Tax Sheet', shortLabel: 'Tax Calc'},
  {id: 's4', label: 'Next FY Detail', shortLabel: 'Next Detail'},
  {id: 's5', label: 'Next FY Tax', shortLabel: 'Next Tax'},
];

const OLD_DEFAULT_DA = [53, 55, 55, 55, 55, 55, 55, 58, 58, 58, 58, 58];

function loadSavedState(): TaxState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultTaxState();
    const parsed = JSON.parse(raw) as Partial<TaxState>;
    const defaults = createDefaultTaxState();
    if (!Array.isArray(parsed.rows) || parsed.rows.length !== 12) {
      return defaults;
    }
    const isOldSampleDa = parsed.rows.every((r, i) => r.daPct === OLD_DEFAULT_DA[i]);
    const migratedRows = isOldSampleDa
      ? parsed.rows.map((r, i) => ({
          ...r,
          daPct: i < 2 ? 58 : i < 8 ? 60 : 63,
        }))
      : parsed.rows;
    return {
      ...defaults,
      ...parsed,
      rows: migratedRows,
      hraNo:
        Array.isArray(parsed.hraNo) && parsed.hraNo.length === 12
          ? parsed.hraNo
          : defaults.hraNo,
      arrears: Array.isArray(parsed.arrears) ? parsed.arrears : defaults.arrears,
      nextOverrides: {
        ...defaults.nextOverrides,
        ...(parsed.nextOverrides ?? {}),
      },
    };
  } catch {
    return createDefaultTaxState();
  }
}

export default function App() {
  const [state, setState] = useState<TaxState>(() => loadSavedState());
  const [activeSheet, setActiveSheet] = useState<SheetId>('s1');
  const [printTargets, setPrintTargets] = useState<SheetId[] | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem(THEME_KEY) === 'dark';
    } catch {
      return false;
    }
  });
  const [design, setDesign] = useState<PrintDesign>(() => {
    try {
      return localStorage.getItem(DESIGN_KEY) === 'classic' ? 'classic' : 'modern';
    } catch {
      return 'modern';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore storage quota errors
    }
  }, [state]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    try {
      localStorage.setItem(THEME_KEY, darkMode ? 'dark' : 'light');
    } catch {
      // ignore
    }
  }, [darkMode]);

  useEffect(() => {
    try {
      localStorage.setItem(DESIGN_KEY, design);
    } catch {
      // ignore
    }
  }, [design]);

  useEffect(() => {
    const handleAfterPrint = () => {
      setPrintTargets(null);
    };
    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, []);

  const computed = useMemo(() => computeAnnualTax(state), [state]);
  const nextComputed = useMemo(
    () => computeNextYearTax(state, computed),
    [state, computed]
  );

  const handleFieldChange = useCallback(
    <K extends keyof TaxState>(key: K, value: TaxState[K]) => {
      setState((prev) => {
        const next: TaxState = {...prev, [key]: value};

        if (key === 'fy' && typeof value === 'string') {
          const y = parseInt(value, 10);
          if (y > 2000) {
            next.ay = `${y + 1}/${String(y + 2).slice(2)}`;
          }
        }

        if (key === 'reg') {
          next.std = value === 'new' ? 75000 : 50000;
        }

        if (key === 'gpf' || key === 'inc' || key === 'incM') {
          next.rows = applyGPFToRows(next.rows, next.gpf, next.incM, next.inc);
        }

        if (key === 'pen') {
          next.rows = applyGPFToRows(next.rows, next.gpf, next.incM, next.inc);
          next.arrears = next.arrears.map((a) => ({...a, cpfOverride: null}));
        }

        if (key === 'hraPct' || key === 'hraYes' || key === 'hraC') {
          next.rows = recomputeHRAForRows(
            next.rows,
            next.hraPct,
            next.hraYes,
            next.hraNo,
            next.hraC
          );
        }

        if (key === 'itInst' && typeof value === 'number') {
          next.rows = next.rows.map((r, idx) => (idx < 11 ? {...r, it: value} : r));
        }

        return next;
      });
    },
    []
  );

  const handleToggleHraNo = useCallback((monthIndex: number, checked: boolean) => {
    setState((prev) => {
      const nextHraNo = prev.hraNo.map((v, i) => (i === monthIndex ? checked : v));
      const nextRows = recomputeHRAForRows(
        prev.rows,
        prev.hraPct,
        prev.hraYes,
        nextHraNo,
        prev.hraC
      );
      return {...prev, hraNo: nextHraNo, rows: nextRows};
    });
  }, []);

  const handleMonthCellChange = useCallback(
    (rowIndex: number, field: keyof Omit<MonthlyRow, 'cpfManual'>, rawValue: string) => {
      const numVal = Number(rawValue) || 0;
      setState((prev) => {
        const nextRows = prev.rows.map((r) => ({...r}));
        nextRows[rowIndex][field] = numVal;
        if (field === 'cpf') {
          nextRows[rowIndex].cpfManual = rawValue !== '';
        }

        const shouldCascade =
          prev.cascade &&
          (field === 'basic' ||
            field === 'daPct' ||
            field === 'it' ||
            field === 'cpf' ||
            field === 'pt');

        if (shouldCascade) {
          for (let j = rowIndex + 1; j < 12; j++) {
            if (field === 'it' && j === 11) continue;
            nextRows[j][field] = numVal;
            if (field === 'cpf') {
              nextRows[j].cpfManual = nextRows[rowIndex].cpfManual;
            }
          }
        }

        const finalRows =
          field === 'basic'
            ? recomputeHRAForRows(
                nextRows,
                prev.hraPct,
                prev.hraYes,
                prev.hraNo,
                prev.hraC
              )
            : nextRows;

        return {...prev, rows: finalRows};
      });
    },
    []
  );

  const handleArrearLabelChange = useCallback((id: string, label: string) => {
    setState((prev) => ({
      ...prev,
      arrears: prev.arrears.map((a) => (a.id === id ? {...a, label} : a)),
    }));
  }, []);

  const handleArrearDaChange = useCallback((id: string, daAmount: number) => {
    setState((prev) => ({
      ...prev,
      arrears: prev.arrears.map((a) =>
        a.id === id
          ? {
              ...a,
              daAmount,
              cpfOverride: prev.pen.startsWith('NPS') ? null : a.cpfOverride,
            }
          : a
      ),
    }));
  }, []);

  const handleArrearCpfChange = useCallback((id: string, rawValue: string) => {
    setState((prev) => ({
      ...prev,
      arrears: prev.arrears.map((a) =>
        a.id === id
          ? {...a, cpfOverride: rawValue === '' ? null : Number(rawValue) || 0}
          : a
      ),
    }));
  }, []);

  const handleAddArrear = useCallback(() => {
    setState((prev) => ({
      ...prev,
      arrears: [
        ...prev.arrears,
        {
          id: `arr-${Date.now()}-${prev.arrears.length + 1}`,
          label: `Arrear ${prev.arrears.length + 1}`,
          daAmount: 0,
          cpfOverride: null,
        },
      ],
    }));
  }, []);

  const handleRemoveArrear = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      arrears: prev.arrears.filter((a) => a.id !== id),
    }));
  }, []);

  const handleNextOverrideChange = useCallback(
    <K extends keyof NextYearOverrides>(key: K, value: NextYearOverrides[K]) => {
      setState((prev) => ({
        ...prev,
        nextOverrides: {...prev.nextOverrides, [key]: value},
      }));
    },
    []
  );

  const handleResetSample = useCallback(() => {
    setState(createDefaultTaxState());
  }, []);

  const triggerPrint = useCallback((targets: SheetId[]) => {
    flushSync(() => {
      setPrintTargets(targets);
    });
    window.print();
  }, []);

  const renderPrintableSheet = (sheetId: SheetId) => {
    switch (sheetId) {
      case 's2':
        return (
          <DetailParticularsSheet
            title={`DETAIL PARTICULARS OF ${state.name}`}
            fyDisplay={state.fy}
            pan={state.pan}
            gisLabel={state.gl}
            months={computed.months}
            arrears={computed.arrears}
            totals={computed.totals}
            med={state.med}
            vrs={state.vrs}
            hpR={state.hpR}
            hpM={state.hpM}
            hpI={state.hpI}
            hpStdDed={computed.hpStdDed}
            hpNet={computed.hpNet}
            oth={state.oth}
            nps={state.nps}
          />
        );
      case 's3':
        return (
          <TaxComputationSheet
            design={design}
            name={state.name}
            desig={state.desig}
            fy={state.fy}
            ay={state.ay}
            pan={state.pan}
            regime={state.reg}
            salaryTotal={computed.totals.tot}
            vrs={state.vrs}
            perq={state.perq}
            med={state.med}
            hpNet={computed.hpNet}
            oth={state.oth}
            grossIncome={computed.grossIncome}
            stdDeduction={computed.activeStd}
            hraExemption={computed.hraExemption}
            c80={computed.c80}
            pt={computed.totals.pt}
            nps={state.nps}
            taxableIncome={computed.activeTaxable}
            taxResult={computed.activeTax}
            relief={state.relief}
            taxAlreadyPaid={computed.totals.itPreFeb}
            balanceTax={computed.balancePayable}
          />
        );
      case 's4':
        return (
          <DetailParticularsSheet
            title={`DETAIL PARTICULARS OF ${state.name}`}
            subtitle={`ASSESSMENT SHEET FOR ${nextComputed.fyN} YEARS`}
            fyDisplay={nextComputed.fyN}
            pan={state.pan}
            gisLabel={state.gl}
            months={nextComputed.months}
            totals={nextComputed.totals}
            med={state.med}
            vrs={0}
            hpR={state.hpR}
            hpM={state.hpM}
            hpI={state.hpI}
            hpStdDed={nextComputed.hpStdDed}
            hpNet={nextComputed.hpNet}
            oth={state.oth}
            nps={state.nps}
            isNextYear
            nextOverrides={state.nextOverrides}
            onNextOverrideChange={handleNextOverrideChange}
          />
        );
      case 's5':
        return (
          <TaxComputationSheet
            design={design}
            name={state.name}
            desig={state.desig}
            fy={nextComputed.fyN}
            ay={nextComputed.ayN}
            pan={state.pan}
            regime={state.reg}
            assessmentBannerFy={nextComputed.fyN}
            salaryTotal={nextComputed.totals.tot}
            vrs={0}
            perq={state.perq}
            med={state.med}
            hpNet={nextComputed.hpNet}
            oth={state.oth}
            grossIncome={nextComputed.grossIncome}
            stdDeduction={nextComputed.activeStd}
            hraExemption={nextComputed.hraExemption}
            c80={nextComputed.c80}
            pt={nextComputed.totals.pt}
            nps={state.nps}
            taxableIncome={nextComputed.activeTaxable}
            taxResult={nextComputed.activeTax}
            relief={0}
            taxAlreadyPaid={nextComputed.totals.itPreFeb}
            balanceTax={nextComputed.balancePayable}
          />
        );
      default:
        return null;
    }
  };

  const activePrintTargets: SheetId[] =
    printTargets ?? (activeSheet === 's1' ? ['s2', 's3'] : [activeSheet]);

  const hasTaxDue = computed.activeTax.totalTax > 0;

  return (
    <div
      className={`min-h-screen text-slate-900 dark:text-slate-100 ${
        design === 'classic' ? 'design-classic' : ''
      }`}
    >
      {/* Top Bar: 3-Zone Contract with Vibrant Royal Indigo-Teal Gradient */}
      <header className="no-print border-b border-indigo-950/30 bg-gradient-to-r from-[#0F1E4A] via-[#17337A] to-[#0E4B68] text-white shadow-sm">
        <div className="mx-auto flex h-15 max-w-[1440px] items-center justify-between gap-8 px-4 sm:px-6">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveSheet('s1');
            }}
            className="text-base font-extrabold tracking-tight text-white whitespace-nowrap shrink-0"
          >
            GovtTax India
          </a>

          <nav
            aria-label="Tax calculation sheets"
            className="hidden items-center gap-6 md:flex"
          >
            {SHEET_TABS.map((tab) => {
              const isActive = activeSheet === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveSheet(tab.id)}
                  className={`relative py-4 text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'text-amber-300'
                      : 'text-blue-100/85 hover:text-white'
                  }`}
                >
                  {tab.label}
                  {isActive && (
                    <span className="absolute right-0 bottom-0 left-0 h-0.5 rounded-t bg-amber-300" />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() =>
                triggerPrint(
                  activeSheet === 's4' || activeSheet === 's5' ? ['s4', 's5'] : ['s2', 's3']
                )
              }
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-orange-400 px-4 py-2 text-xs font-extrabold text-slate-950 shadow-sm transition-all hover:from-amber-300 hover:to-orange-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <FileDown className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Export PDF</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Sheet Navigation Bar */}
      <nav
        aria-label="Mobile sheet switcher"
        className="no-print border-b border-slate-200 bg-white/95 px-4 py-2 md:hidden dark:border-slate-800 dark:bg-slate-900/95"
      >
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {SHEET_TABS.map((tab) => {
            const isActive = activeSheet === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSheet(tab.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-[#17337A] to-[#0E6474] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                {tab.shortLabel}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main Workspace */}
      <main id="top" className="no-print mx-auto max-w-[1440px] px-4 py-6 sm:px-6">
        {/* Vibrant Employee Hero Summary & 4-Color KPI Strip */}
        <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {/* Colorful Hero Banner */}
          <div className="bg-gradient-to-r from-[#0F3D5E] via-[#0F6E72] to-[#0E836F] px-5 py-4 text-white sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-lg font-extrabold tracking-tight text-white sm:text-xl">
                  Income Tax Calculation Sheet — {state.fy}
                </h1>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs font-medium text-teal-50/95">
                  <span className="font-bold text-amber-200">{state.name}</span>
                  <span aria-hidden="true">·</span>
                  <span>{state.addr}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono-num">AY {state.ay}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono-num">PAN {state.pan}</span>
                </div>
              </div>
              <div className="text-xs font-bold text-amber-200">
                {state.reg === 'new' ? 'New Regime Active' : 'Old Regime Active'}
                {computed.regimeSavings > 0 && (
                  <span className="ml-2 text-teal-100">
                    · {computed.recommendedRegime === 'new' ? 'New' : 'Old'} saves{' '}
                    <span className="font-mono-num text-white">
                      {fmtRupee(computed.regimeSavings)}
                    </span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 4 Color-Coded KPI Tiles */}
          <div className="grid grid-cols-2 gap-3.5 p-4 sm:p-5 lg:grid-cols-4">
            <div className="rounded-xl border border-blue-200/80 border-t-2 border-t-blue-600 bg-blue-50/70 p-3.5 dark:border-blue-900/60 dark:border-t-blue-400 dark:bg-blue-950/35">
              <div className="flex items-center justify-between text-xs font-semibold text-blue-800 dark:text-blue-300">
                <span>Gross Income</span>
                <Wallet className="h-4 w-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
              </div>
              <div className="font-mono-num mt-1.5 text-xl font-extrabold text-blue-950 dark:text-white">
                {fmtRupee(computed.grossIncome)}
              </div>
            </div>

            <div className="rounded-xl border border-indigo-200/80 border-t-2 border-t-indigo-600 bg-indigo-50/70 p-3.5 dark:border-indigo-900/60 dark:border-t-indigo-400 dark:bg-indigo-950/35">
              <div className="flex items-center justify-between text-xs font-semibold text-indigo-800 dark:text-indigo-300">
                <span>Taxable Income</span>
                <TrendingUp className="h-4 w-4 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
              </div>
              <div className="font-mono-num mt-1.5 text-xl font-extrabold text-indigo-950 dark:text-white">
                {fmtRupee(computed.activeTaxable)}
              </div>
            </div>

            <div
              className={`rounded-xl border border-t-2 p-3.5 ${
                hasTaxDue
                  ? 'border-rose-200/80 border-t-rose-600 bg-rose-50/70 dark:border-rose-900/60 dark:border-t-rose-400 dark:bg-rose-950/35'
                  : 'border-emerald-200/80 border-t-emerald-600 bg-emerald-50/70 dark:border-emerald-900/60 dark:border-t-emerald-400 dark:bg-emerald-950/35'
              }`}
            >
              <div
                className={`flex items-center justify-between text-xs font-semibold ${
                  hasTaxDue
                    ? 'text-rose-800 dark:text-rose-300'
                    : 'text-emerald-800 dark:text-emerald-300'
                }`}
              >
                <span>Net Tax Payable</span>
                <ShieldCheck
                  className={`h-4 w-4 ${
                    hasTaxDue
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                  aria-hidden="true"
                />
              </div>
              <div
                className={`font-mono-num mt-1.5 text-xl font-extrabold ${
                  hasTaxDue
                    ? 'text-rose-900 dark:text-rose-200'
                    : 'text-emerald-900 dark:text-emerald-200'
                }`}
              >
                {hasTaxDue ? fmtRupee(computed.activeTax.totalTax) : 'NIL'}
              </div>
            </div>

            <div className="rounded-xl border border-amber-200/90 border-t-2 border-t-amber-500 bg-amber-50/75 p-3.5 dark:border-amber-900/60 dark:border-t-amber-400 dark:bg-amber-950/35">
              <div className="flex items-center justify-between text-xs font-semibold text-amber-900 dark:text-amber-300">
                <span>Balance Due (Feb)</span>
                <IndianRupee className="h-4 w-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
              </div>
              <div className="font-mono-num mt-1.5 text-xl font-extrabold text-amber-950 dark:text-amber-100">
                {computed.balancePayable > 0 ? fmtRupee(computed.balancePayable) : 'NIL'}
              </div>
            </div>
          </div>

          {/* Colorful Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/70 px-4 py-3.5 sm:px-5 dark:border-slate-800 dark:bg-slate-900/70">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => triggerPrint(['s2', 's3'])}
                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-rose-600 to-red-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:from-rose-500 hover:to-red-500 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <FileDown className="h-3.5 w-3.5" aria-hidden="true" />
                <span>2-Page PDF (Sheet 2 + 3)</span>
              </button>

              <button
                type="button"
                onClick={() => triggerPrint(['s4', 's5'])}
                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:from-orange-500 hover:to-amber-500 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <FileDown className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Next-Year PDF (Sheet 4 + 5)</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  triggerPrint(activeSheet === 's1' ? ['s2', 's3'] : [activeSheet])
                }
                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-sky-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:from-blue-500 hover:to-sky-500 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Print Current Sheet</span>
              </button>

              <div className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-2.5 py-1 dark:border-slate-700 dark:bg-slate-800">
                <Palette className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
                <select
                  aria-label="Printable sheet design format"
                  value={design}
                  onChange={(e) => setDesign(e.target.value as PrintDesign)}
                  className="bg-transparent py-1 text-xs font-semibold text-slate-800 focus:outline-none dark:text-slate-100"
                >
                  <option value="modern">Design: Modern</option>
                  <option value="classic">Design: Classic Excel</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <PWAInstallButton />

              <button
                type="button"
                onClick={() => setDarkMode((prev) => !prev)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 shadow-xs transition-colors hover:bg-slate-100 whitespace-nowrap shrink-0 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 cursor-pointer"
              >
                {darkMode ? (
                  <>
                    <Sun className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
                    <span>Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="h-3.5 w-3.5 text-indigo-600" aria-hidden="true" />
                    <span>Dark Mode</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleResetSample}
                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:from-emerald-500 hover:to-teal-500 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Reset Sample</span>
              </button>
            </div>
          </div>
        </div>

        {/* Active Sheet Content */}
        {activeSheet === 's1' && (
          <InputSheet
            state={state}
            computed={computed}
            onFieldChange={handleFieldChange}
            onMonthCellChange={handleMonthCellChange}
            onToggleHraNo={handleToggleHraNo}
            onArrearLabelChange={handleArrearLabelChange}
            onArrearDaChange={handleArrearDaChange}
            onArrearCpfChange={handleArrearCpfChange}
            onAddArrear={handleAddArrear}
            onRemoveArrear={handleRemoveArrear}
          />
        )}

        {activeSheet !== 's1' && (
          <div className="rounded-2xl border border-indigo-200/70 bg-gradient-to-b from-indigo-50/50 to-slate-100/60 p-4 sm:p-6 dark:border-slate-800 dark:from-slate-900 dark:to-slate-950">
            <div className="overflow-x-auto pb-2">{renderPrintableSheet(activeSheet)}</div>
          </div>
        )}
      </main>

      {/* Dedicated A4 Print Container (Visible only during Print / Save as PDF) */}
      <div className="print-only-container hidden">
        {activePrintTargets.map((sheetId, index) => (
          <div
            key={sheetId}
            className={`print-page${index > 0 ? ' page-break' : ''}`}
          >
            {renderPrintableSheet(sheetId)}
          </div>
        ))}
      </div>

      {/* Offline Connectivity Banner */}
      <OfflineIndicator />
    </div>
  );
}
