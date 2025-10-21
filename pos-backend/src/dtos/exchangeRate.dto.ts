export interface UpdateManualRateDTO {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  notes?: string;
}

export interface ToggleManualRateDTO {
  fromCurrency: string;
  toCurrency: string;
  useManual: boolean;
}

export interface ConvertDTO {
  amount: number;
  fromCurrency: string;
  toCurrency: string;
}