import {
  AnnualComputation,
  ArrearRow,
  ComputedArrearRow,
  ComputedMonthRow,
  MonthlyRow,
  NextYearComputation,
  RegimeTaxResult,
  SlabLine,
  TaxRegime,
  TaxState,
  YesNo,
} from '../types/tax';

export const MONTHS = [
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
  'Jan',
  'Feb',
] as const;

export const HRA_PERCENT_OPTIONS = [4, 8, 16, 24] as const;

export const NEW_SLABS: ReadonlyArray<readonly [number, number]> = [
  [400000, 0],
  [800000, 5],
  [1200000, 10],
  [1600000, 15],
  [2000000, 20],
  [2400000, 25],
  [1e12, 30],
];

export const OLD_SLABS: ReadonlyArray<readonly [number, number]> = [
  [250000, 0],
  [500000, 5],
  [1000000, 20],
  [1e12, 30],
];

export function fmtINR(n: number): string {
  return Math.round(n).toLocaleString('en-IN');
}

export function fmtRupee(n: number): string {
  return `₹${fmtINR(n)}`;
}

export function getMonthLabel(index: number, fy: string): string {
  const y = parseInt(fy, 10) || 2026;
  const yr = index < 10 ? y : y + 1;
  return `${MONTHS[index]}-${String(yr % 100).padStart(2, '0')}`;
}

export function createSampleRows(): MonthlyRow[] {
  return MONTHS.map((_, i) => ({
    basic: i < 8 ? 28200 : 29000,
    lic: 0,
    gis: 0,
    daPct: i < 2 ? 58 : i < 8 ? 60 : 63,
    hra: i < 8 ? 1128 : 1160,
    cpf: i < 2 ? 10000 : 12000,
    cpfManual: false,
    pt: i === 11 ? 300 : 200,
    it: 0,
  }));
}

export function createSampleArrears(): ArrearRow[] {
  return [
    {id: 'arr-1', label: '1st 2% DA Arrear', daAmount: 2256, cpfOverride: null},
    {id: 'arr-2', label: '2nd 3% DA Arrear', daAmount: 2538, cpfOverride: null},
    {id: 'arr-3', label: 'If any other arrear', daAmount: 0, cpfOverride: null},
  ];
}

export function createDefaultTaxState(): TaxState {
  return {
    fy: '2026/27',
    ay: '2027/28',
    name: 'UMA SANKAR MALI',
    desig: 'ASSISTANT TEACHER,LEVEL-V(A)',
    pan: 'ABCDE1234F',
    pen: 'OPS (Old Pension Scheme - GPF)',
    gpfno: 'GPF-123456',
    addr: 'GOVT.UGHS MALDA',

    gpf: 10000,
    incM: 2, // MAY
    inc: 2000,
    rent: 'NO',
    rentAmt: 0,
    hraYes: 'YES',
    hraPct: 4,
    itInst: 0,
    arrYes: 'YES',

    reg: 'new',
    std: 75000,
    relief: 0,
    nps: 0,

    med: 0,
    vrs: 0,
    perq: 0,
    hpR: 0,
    hpM: 0,
    hpI: 0,
    oth: 0,

    gl: 'GIS',
    cascade: true,

    hraNo: Array(12).fill(false),
    hraC: -1,

    rows: createSampleRows(),
    arrears: createSampleArrears(),
    nextOverrides: {
      basicOverride: '',
      daOverride: '',
      incrementMonth: 4, // Jul
      incrementAmount: '',
    },
  };
}

export function recomputeHRAForRows(
  rows: MonthlyRow[],
  hraPct: number,
  hraYes: YesNo,
  hraNo: boolean[],
  hraC: number
): MonthlyRow[] {
  const none = hraYes === 'NO';
  let held = 0;
  const next = rows.map((r, i) => {
    const base = Math.round((r.basic * hraPct) / 100);
    if (none || hraNo[i]) {
      held += base;
      return {...r, hra: 0};
    }
    return {...r, hra: base};
  });
  if (!none && hraC >= 0 && hraC < 12 && !hraNo[hraC]) {
    next[hraC] = {...next[hraC], hra: next[hraC].hra + held};
  }
  return next;
}

export function applyGPFToRows(
  rows: MonthlyRow[],
  gpf: number,
  incM: number,
  inc: number
): MonthlyRow[] {
  return rows.map((r, i) => ({
    ...r,
    cpf: i >= incM ? gpf + inc : gpf,
    cpfManual: false,
  }));
}

export function computeArrearGross(
  daAmount: number,
  grossOverride?: number | null
): number {
  if (grossOverride !== null && grossOverride !== undefined) {
    return grossOverride;
  }
  return Math.round((daAmount * 100) / 90);
}

export function computeArrearDaFromGross(grossAmount: number): number {
  return Math.round((grossAmount * 90) / 100);
}

export function computeArrearCpf(arrear: ArrearRow, isNPS: boolean): number {
  if (isNPS) {
    return arrear.cpfOverride !== null
      ? arrear.cpfOverride
      : Math.round(computeArrearGross(arrear.daAmount, arrear.grossOverride) * 0.1);
  }
  return arrear.cpfOverride ?? 0;
}

export function calculateSlabs(
  income: number,
  slabs: ReadonlyArray<readonly [number, number]>
): {taxBeforeRebate: number; slabs: SlabLine[]} {
  let total = 0;
  let prev = 0;
  const lines: SlabLine[] = [];

  for (const [limit, rate] of slabs) {
    const taxableSlice = Math.max(0, Math.min(income, limit) - prev);
    const taxAmount = (taxableSlice * rate) / 100;
    lines.push({
      from: prev,
      to: limit,
      rate,
      taxableSlice,
      taxAmount,
    });
    total += taxAmount;
    prev = limit;
  }

  return {taxBeforeRebate: total, slabs: lines};
}

export function calculateRegimeTax(regime: TaxRegime, taxable: number): RegimeTaxResult {
  const {taxBeforeRebate, slabs} = calculateSlabs(
    taxable,
    regime === 'new' ? NEW_SLABS : OLD_SLABS
  );

  let rebate = 0;
  if (regime === 'new') {
    if (taxable <= 1200000) {
      rebate = taxBeforeRebate;
    } else {
      // Marginal relief above ₹12L under Union Budget 2025 / FY26 New Regime
      rebate = Math.max(0, taxBeforeRebate - (taxable - 1200000));
    }
  } else if (taxable <= 500000) {
    rebate = Math.min(taxBeforeRebate, 12500);
  }

  const netAfterRebate = Math.max(0, taxBeforeRebate - rebate);
  const cess = Math.round(netAfterRebate * 0.04);
  const totalTax = Math.round(netAfterRebate + cess);

  return {
    taxBeforeRebate,
    slabs,
    rebate,
    netAfterRebate,
    cess,
    totalTax,
  };
}

export function computeAnnualTax(state: TaxState): AnnualComputation {
  const isNPS = state.pen.startsWith('NPS');
  const totals = {
    pay: 0,
    da: 0,
    hra: 0,
    tot: 0,
    cpf: 0,
    lic: 0,
    gis: 0,
    pt: 0,
    itPreFeb: 0,
    itFeb: 0,
    itPaid: 0,
  };

  const months: ComputedMonthRow[] = state.rows.map((r, i) => {
    const daAmount = Math.round((r.basic * r.daPct) / 100);
    const grossTotal = r.basic + daAmount + r.hra;
    const cpf = isNPS && !r.cpfManual ? Math.round((r.basic + daAmount) * 0.1) : r.cpf;

    totals.pay += r.basic;
    totals.da += daAmount;
    totals.hra += r.hra;
    totals.tot += grossTotal;
    totals.cpf += cpf;
    totals.lic += r.lic;
    totals.gis += r.gis;
    totals.pt += r.pt;
    if (i < 11) {
      totals.itPreFeb += r.it;
    }

    return {
      index: i,
      label: getMonthLabel(i, state.fy),
      basic: r.basic,
      daPct: r.daPct,
      daAmount,
      hra: r.hra,
      grossTotal,
      cpf,
      lic: r.lic,
      gis: r.gis,
      pt: r.pt,
      it: r.it,
    };
  });

  const arrears: ComputedArrearRow[] = state.arrears.map((a) => {
    const grossAmount = computeArrearGross(a.daAmount, a.grossOverride);
    const cpf = computeArrearCpf(a, isNPS);
    totals.da += a.daAmount;
    totals.tot += grossAmount;
    totals.cpf += cpf;
    return {
      id: a.id,
      label: a.label,
      daAmount: a.daAmount,
      grossAmount,
      cpf,
    };
  });

  const arrearGrossTotal = arrears.reduce((acc, a) => acc + a.grossAmount, 0);

  // House Property
  const nav = Math.max(0, state.hpR - state.hpM);
  const hpStdDed = nav * 0.3;
  const hpNet = nav - hpStdDed - state.hpI;

  const grossIncome = totals.tot + state.vrs + state.perq + state.med + hpNet + state.oth;

  // New Regime
  const newStd = state.reg === 'new' ? state.std : 75000;
  const newTaxable = Math.max(0, grossIncome - newStd - state.nps);
  const newTax = calculateRegimeTax('new', newTaxable);

  // Old Regime
  const oldStd = state.reg === 'old' ? state.std : 50000;
  const c80 = Math.min(150000, totals.cpf + totals.lic + totals.gis);
  const hraExemption =
    state.rent === 'YES'
      ? Math.max(0, Math.min(totals.hra, state.rentAmt - 0.1 * (totals.pay + totals.da)))
      : 0;
  const oldTaxable = Math.max(
    0,
    grossIncome - oldStd - hraExemption - c80 - totals.pt - state.nps
  );
  const oldTax = calculateRegimeTax('old', oldTaxable);

  const activeTax = state.reg === 'new' ? newTax : oldTax;
  const activeTaxable = state.reg === 'new' ? newTaxable : oldTaxable;
  const activeStd = state.reg === 'new' ? newStd : oldStd;

  // Auto-calculate February Income Tax balance
  const febTax = Math.max(0, activeTax.totalTax - state.relief - totals.itPreFeb);
  totals.itFeb = febTax;
  totals.itPaid = totals.itPreFeb + febTax;
  months[11] = {...months[11], it: febTax};

  const recommendedRegime: TaxRegime = newTax.totalTax <= oldTax.totalTax ? 'new' : 'old';
  const regimeSavings = Math.abs(newTax.totalTax - oldTax.totalTax);

  return {
    months,
    arrears,
    arrearGrossTotal,
    totals,
    nav,
    hpStdDed,
    hpNet,
    grossIncome,
    newTaxable,
    newTax,
    c80,
    hraExemption,
    oldTaxable,
    oldTax,
    activeTaxable,
    activeStd,
    activeTax,
    balancePayable: febTax,
    recommendedRegime,
    regimeSavings,
  };
}

export function computeNextYearTax(
  state: TaxState,
  current: AnnualComputation
): NextYearComputation {
  const fy0 = parseInt(state.fy, 10) || 2026;
  const fyN = `${fy0 + 1}/${String(fy0 + 2).slice(2)}`;
  const ayN = `${fy0 + 2}/${String(fy0 + 3).slice(2)}`;

  const febCurrent = current.months[11];
  const janCurrent = current.months[10];
  const isNPS = state.pen.startsWith('NPS');

  const pb0 =
    state.nextOverrides.basicOverride.trim() === ''
      ? febCurrent.basic
      : Number(state.nextOverrides.basicOverride) || 0;
  const pd =
    state.nextOverrides.daOverride.trim() === ''
      ? febCurrent.daPct
      : Number(state.nextOverrides.daOverride) || 0;
  const im = state.nextOverrides.incrementMonth;
  const ia = Number(state.nextOverrides.incrementAmount) || 0;
  const hraOn = state.hraYes === 'YES' && !state.hraNo[11];

  const totals = {
    pay: 0,
    da: 0,
    hra: 0,
    tot: 0,
    cpf: 0,
    lic: febCurrent.lic * 12,
    gis: febCurrent.gis * 12,
    pt: 0,
    itPreFeb: janCurrent.it * 11,
    itFeb: 0,
    itPaid: 0,
  };

  const months: ComputedMonthRow[] = MONTHS.map((m, i) => {
    const basic = i >= im ? pb0 + ia : pb0;
    const daAmount = Math.round((basic * pd) / 100);
    const hra = hraOn ? Math.round((basic * state.hraPct) / 100) : 0;
    const cpf = isNPS ? Math.round((basic + daAmount) * 0.1) : febCurrent.cpf;
    const pt = i === 11 ? febCurrent.pt : janCurrent.pt;
    const grossTotal = basic + daAmount + hra;
    const yr = i < 10 ? fy0 + 1 : fy0 + 2;

    totals.pay += basic;
    totals.da += daAmount;
    totals.hra += hra;
    totals.tot += grossTotal;
    totals.cpf += cpf;
    totals.pt += pt;

    return {
      index: i,
      label: `${m}-${String(yr % 100).padStart(2, '0')}`,
      basic,
      daPct: pd,
      daAmount,
      hra,
      grossTotal,
      cpf,
      lic: febCurrent.lic,
      gis: febCurrent.gis,
      pt,
      it: i === 11 ? 0 : janCurrent.it,
    };
  });

  const nav = Math.max(0, state.hpR - state.hpM);
  const hpStdDed = nav * 0.3;
  const hpNet = nav - hpStdDed - state.hpI;
  const grossIncome = totals.tot + state.perq + state.med + hpNet + state.oth;

  const newTaxable = Math.max(0, grossIncome - 75000 - state.nps);
  const newTax = calculateRegimeTax('new', newTaxable);

  const c80 = Math.min(150000, totals.cpf + totals.lic + totals.gis);
  const hraExemption =
    state.rent === 'YES'
      ? Math.max(0, Math.min(totals.hra, state.rentAmt - 0.1 * (totals.pay + totals.da)))
      : 0;
  const oldTaxable = Math.max(
    0,
    grossIncome - 50000 - hraExemption - c80 - totals.pt - state.nps
  );
  const oldTax = calculateRegimeTax('old', oldTaxable);

  const activeTax = state.reg === 'new' ? newTax : oldTax;
  const activeTaxable = state.reg === 'new' ? newTaxable : oldTaxable;
  const activeStd = state.reg === 'new' ? 75000 : 50000;

  const febN = Math.max(0, activeTax.totalTax - totals.itPreFeb);
  totals.itFeb = febN;
  totals.itPaid = totals.itPreFeb + febN;
  months[11] = {...months[11], it: febN};

  return {
    fyN,
    ayN,
    months,
    totals,
    nav,
    hpStdDed,
    hpNet,
    grossIncome,
    newTaxable,
    newTax,
    c80,
    hraExemption,
    oldTaxable,
    oldTax,
    activeTaxable,
    activeStd,
    activeTax,
    balancePayable: febN,
  };
}
