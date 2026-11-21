import React from 'react';
import {PrintDesign, RegimeTaxResult, TaxRegime} from '../types/tax';
import {fmtINR} from '../utils/taxEngine';

interface TaxComputationSheetProps {
  design: PrintDesign;
  name: string;
  desig: string;
  fy: string;
  ay: string;
  pan: string;
  regime: TaxRegime;
  assessmentBannerFy?: string;
  salaryTotal: number;
  vrs: number;
  perq: number;
  med: number;
  hpNet: number;
  oth: number;
  grossIncome: number;
  stdDeduction: number;
  hraExemption: number;
  c80: number;
  pt: number;
  nps: number;
  taxableIncome: number;
  taxResult: RegimeTaxResult;
  relief: number;
  taxAlreadyPaid: number;
  balanceTax: number;
}

interface CalcRowProps {
  label: React.ReactNode;
  value: number;
  negative?: boolean;
  showNil?: boolean;
  small?: boolean;
  noUnderline?: boolean;
  bold?: boolean;
}

const CalcRow: React.FC<CalcRowProps> = ({
  label,
  value,
  negative = false,
  showNil = false,
  small = false,
  noUnderline = false,
  bold = false,
}) => (
  <div className={`xr${small ? ' sm' : ''}${noUnderline ? ' nu' : ''}`}>
    <div>{bold ? <b>{label}</b> : label}</div>
    <div className="xn">{negative ? '(-)' : ''}</div>
    <div className="xu">
      <span>: ₹</span>
      <span>{showNil && value <= 0 ? 'NIL' : fmtINR(value)} /-</span>
    </div>
  </div>
);

export const TaxComputationSheet: React.FC<TaxComputationSheetProps> = ({
  design,
  name,
  desig,
  fy,
  ay,
  pan,
  regime,
  assessmentBannerFy,
  salaryTotal,
  vrs,
  perq,
  med,
  hpNet,
  oth,
  grossIncome,
  stdDeduction,
  hraExemption,
  c80,
  pt,
  nps,
  taxableIncome,
  taxResult,
  relief,
  taxAlreadyPaid,
  balanceTax,
}) => {
  const regimeLabel = regime === 'new' ? 'NEW' : 'OLD';

  return (
    <div className="paper-sheet cal">
      <div className="cal-header">
        {design === 'classic' ? (
          <>
            <div>
              CALCULATION OF INCOME TAX OF SRI/SMT:- {name}, {desig}, FOR THE FINANCIAL YEAR OF{' '}
              {fy} AND AY-{ay} PAN:- {pan} ({regimeLabel} REGIME)
            </div>
            {assessmentBannerFy && (
              <div style={{marginTop: '6px', letterSpacing: '0.5px'}}>
                ASSESSMENT SHEET FOR {assessmentBannerFy} YEARS
              </div>
            )}
          </>
        ) : (
          <>
            <div className="hd1">CALCULATION OF INCOME TAX</div>
            <div className="hd2">
              OF SRI/SMT: <u>{name}</u>, {desig}
            </div>
            <div className="hs">
              <div className="hc">
                <small>Financial Year</small>
                <b>{fy}</b>
              </div>
              <div className="hc">
                <small>Assessment Year</small>
                <b>{ay}</b>
              </div>
              <div className="hc">
                <small>PAN</small>
                <b>{pan}</b>
              </div>
              <div className="hc">
                <small>Regime</small>
                <b>{regimeLabel}</b>
              </div>
            </div>
            {assessmentBannerFy && (
              <div className="hb">ASSESSMENT SHEET FOR {assessmentBannerFy} YEARS</div>
            )}
          </>
        )}
      </div>

      <h4>Income Particulars</h4>
      <div className="cal-ip">
        <CalcRow
          label="1. Income from salary (Pay+G.P+D.A+H.R.A+O.A+Govt.Contribution to NPS)"
          value={salaryTotal}
          small
          noUnderline
        />
        <CalcRow
          label="2. Amount received on voluntary retirement/termination"
          value={vrs}
          small
          noUnderline
        />
        <CalcRow
          label="3. Valuation on perquisite (Licence fee for free accommodation etc.)"
          value={perq}
          small
          noUnderline
        />
        <CalcRow
          label="4. Medical reimbursement by the employer"
          value={med}
          small
          noUnderline
        />
        <CalcRow label="5. Income from House properties" value={hpNet} small noUnderline />
        <CalcRow label="6. Other income" value={oth} small />
      </div>

      <h4 className="sub-h4">Computation of total income and tax payable thereon</h4>
      <div className="cal-cp">
        <CalcRow label="Gross Income" value={grossIncome} noUnderline />
        <CalcRow
          label="Less: Standard Deduction under Section 16 {i(a)}"
          value={stdDeduction}
          negative
          noUnderline
        />

        {regime === 'old' && (
          <>
            <CalcRow
              label="Less: HRA exemption u/s 10(13A)"
              value={hraExemption}
              negative
            />
            <CalcRow
              label="Less: Deduction u/s 80C (GPF/LIC/GIS)"
              value={c80}
              negative
            />
            <CalcRow label="Less: Professional Tax" value={pt} negative />
          </>
        )}

        <div className="xd">Deduction</div>
        <CalcRow
          label="Deduction u/s 80CCD(2) (Employer Contribution toward NPS)"
          value={nps}
          negative
        />
        <CalcRow label="Total Taxable Income" value={taxableIncome} bold />
        <CalcRow
          label="Total Tax before Rebate on Taxable Income"
          value={taxResult.taxBeforeRebate}
        />
        <CalcRow
          label="Less:Tax Rebate under Section 87A(Lower Income bracket)"
          value={taxResult.rebate}
          negative
        />
        <CalcRow
          label="Net tax after Rebate Payable"
          value={taxResult.netAfterRebate}
          showNil
        />
        <CalcRow
          label="Add:Health & Education cess@4% of tax"
          value={taxResult.cess}
          showNil
        />
        <CalcRow
          label="Total Income Tax payable"
          value={taxResult.totalTax}
          showNil
          bold
        />
        <CalcRow
          label="Relief Under Section 89(1)as per Form 10E"
          value={relief}
          negative
          showNil
        />
        <CalcRow
          label="Income tax already paid"
          value={taxAlreadyPaid}
          negative
          showNil
        />
        <CalcRow
          label="Balance income tax to be paid"
          value={balanceTax}
          showNil
          bold
        />
      </div>

      <p className="checked-sig mt-8 text-center font-extrabold underline">CHECKED</p>
    </div>
  );
};
