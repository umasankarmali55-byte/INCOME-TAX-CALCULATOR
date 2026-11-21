export type SheetId = 's1' | 's2' | 's3' | 's4' | 's5';
export type PrintDesign = 'modern' | 'classic';
export type TaxRegime = 'new' | 'old';
export type PensionScheme = 'OPS (Old Pension Scheme - GPF)' | 'NPS (PRAN)';
export type GisHbaLabel = 'GIS' | 'HBA';
export type YesNo = 'YES' | 'NO';

export interface MonthlyRow {
  basic: number;
  lic: number;
  gis: number;
  daPct: number;
  hra: number;
  cpf: number;
  cpfManual: boolean;
  pt: number;
  it: number;
}

export interface ArrearRow {
  id: string;
  label: string;
  daAmount: number;
  grossOverride?: number | null;
  cpfOverride: number | null;
}

export interface NextYearOverrides {
  basicOverride: string;
  daOverride: string;
  incrementMonth: number; // 0..11 (Mar..Feb), default 4 (Jul)
  incrementAmount: string;
}

export interface TaxState {
  fy: string;
  ay: string;
  name: string;
  desig: string;
  pan: string;
  pen: PensionScheme;
  gpfno: string;
  addr: string;

  gpf: number;
  incM: number; // 0..11
  inc: number;
  rent: YesNo;
  rentAmt: number;
  hraYes: YesNo;
  hraPct: number;
  itInst: number;
  arrYes: YesNo;

  reg: TaxRegime;
  std: number;
  relief: number;
  nps: number;

  med: number;
  vrs: number;
  perq: number;
  hpR: number;
  hpM: number;
  hpI: number;
  oth: number;

  gl: GisHbaLabel;
  cascade: boolean;

  hraNo: boolean[]; // length 12
  hraC: number; // -1 or 0..11

  rows: MonthlyRow[];
  arrears: ArrearRow[];
  nextOverrides: NextYearOverrides;
}

export interface SlabLine {
  from: number;
  to: number;
  rate: number;
  taxableSlice: number;
  taxAmount: number;
}

export interface RegimeTaxResult {
  taxBeforeRebate: number;
  slabs: SlabLine[];
  rebate: number;
  netAfterRebate: number;
  cess: number;
  totalTax: number;
}

export interface ComputedMonthRow {
  index: number;
  label: string;
  basic: number;
  daPct: number;
  daAmount: number;
  hra: number;
  grossTotal: number;
  cpf: number;
  lic: number;
  gis: number;
  pt: number;
  it: number;
}

export interface ComputedArrearRow {
  id: string;
  label: string;
  daAmount: number;
  grossAmount: number;
  cpf: number;
}

export interface AnnualTotals {
  pay: number;
  da: number;
  hra: number;
  tot: number;
  cpf: number;
  lic: number;
  gis: number;
  pt: number;
  itPreFeb: number;
  itFeb: number;
  itPaid: number;
}

export interface AnnualComputation {
  months: ComputedMonthRow[];
  arrears: ComputedArrearRow[];
  arrearGrossTotal: number;
  totals: AnnualTotals;
  nav: number;
  hpStdDed: number;
  hpNet: number;
  grossIncome: number;
  newTaxable: number;
  newTax: RegimeTaxResult;
  c80: number;
  hraExemption: number;
  oldTaxable: number;
  oldTax: RegimeTaxResult;
  activeTaxable: number;
  activeStd: number;
  activeTax: RegimeTaxResult;
  balancePayable: number;
  recommendedRegime: TaxRegime;
  regimeSavings: number;
}

export interface NextYearComputation {
  fyN: string;
  ayN: string;
  months: ComputedMonthRow[];
  totals: AnnualTotals;
  nav: number;
  hpStdDed: number;
  hpNet: number;
  grossIncome: number;
  newTaxable: number;
  newTax: RegimeTaxResult;
  c80: number;
  hraExemption: number;
  oldTaxable: number;
  oldTax: RegimeTaxResult;
  activeTaxable: number;
  activeStd: number;
  activeTax: RegimeTaxResult;
  balancePayable: number;
}
