// frontend/src/components/builder/types.ts

export type IndicatorType = 
  | 'RSI' 
  | 'MACD' 
  | 'Close' 
  | 'SMA' 
  | 'EMA' 
  | 'Bollinger_Bands' 
  | 'Stochastic' 
  | 'Williams_R' 
  | 'ATR' 
  | 'Volume';

export type OperatorType = 
  | 'less_than' 
  | 'greater_than' 
  | 'crosses_above' 
  | 'crosses_below'
  | 'equals'
  | 'not_equals'
  | 'between'
  | 'outside';

export type ExitType = 
  | 'manual'           // Exit when conditions reverse
  | 'profit_target'    // Exit at specific profit percentage
  | 'stop_loss'        // Exit at specific loss percentage
  | 'trailing_stop'    // Dynamic trailing stop loss
  | 'time_based'       // Exit after specific time period
  | 'indicator_based'; // Exit based on indicator condition

export type TimeUnit = 'days' | 'hours' | 'minutes';

export interface ExitCondition {
  type: ExitType;
  value?: number;      // For profit target, stop loss, trailing stop percentage
  timePeriod?: number; // For time-based exits
  timeUnit?: TimeUnit; // For time-based exits (days, hours, minutes)
  indicator?: IndicatorType; // For indicator-based exits
  operator?: OperatorType;   // For indicator-based exits
  indicatorValue?: string;   // For indicator-based exits
}

export interface Condition {
  id: string;
  indicator: IndicatorType;
  operator: OperatorType;
  value: string;
  // For cross-indicator comparisons
  compareIndicator?: IndicatorType;
  compareValue?: string;
  // Additional parameters for indicators
  period?: number;
  fast_period?: number;
  slow_period?: number;
  signal_period?: number;
  upper_band?: number;
  lower_band?: number;
  k_period?: number;
  d_period?: number;
  // For comparison indicators
  comparePeriod?: number;
  compareFastPeriod?: number;
  compareSlowPeriod?: number;
  compareSignalPeriod?: number;
  compareUpperBand?: number;
  compareLowerBand?: number;
  compareKPeriod?: number;
  compareDPeriod?: number;
}

export interface StrategyConfiguration {
  conditions: Condition[];
  logicalOperator: 'AND' | 'OR';
  action: 'LONG' | 'SHORT';
  exitCondition: ExitCondition;
}

// Indicator parameter definitions
export const INDICATOR_PARAMS = {
  RSI: { period: 14 },
  MACD: { fast_period: 12, slow_period: 26, signal_period: 9 },
  SMA: { period: 20 },
  EMA: { period: 20 },
  Bollinger_Bands: { period: 20, upper_band: 2, lower_band: 2 },
  Stochastic: { k_period: 14, d_period: 3 },
  Williams_R: { period: 14 },
  ATR: { period: 14 },
  Volume: {},
  Close: {}
} as const;

// Exit condition presets
export const EXIT_PRESETS = [
  { label: 'Manual Exit', type: 'manual', description: 'Exit when conditions reverse' },
  { label: '5% Trailing Stop', type: 'trailing_stop', value: 5, description: 'Dynamic trailing stop to protect profits' },
  { label: '10% Profit Target', type: 'profit_target', value: 10, description: 'Exit at 10% profit' },
  { label: '7 Days Hold', type: 'time_based', timePeriod: 7, timeUnit: 'days', description: 'Hold position for 7 days' },
] as const;

// Common indicator combinations for cross-comparisons
export const COMMON_CROSSES = [
  { label: 'SMA crosses EMA', indicator1: 'SMA', indicator2: 'EMA' },
  { label: 'EMA crosses SMA', indicator1: 'EMA', indicator2: 'SMA' },
  { label: 'Price crosses SMA', indicator1: 'Close', indicator2: 'SMA' },
  { label: 'Price crosses EMA', indicator1: 'Close', indicator2: 'EMA' },
  { label: 'RSI crosses 30', indicator1: 'RSI', indicator2: 'Close' },
  { label: 'RSI crosses 70', indicator1: 'RSI', indicator2: 'Close' },
  { label: 'MACD crosses Signal', indicator1: 'MACD', indicator2: 'MACD' },
  { label: 'Stochastic crosses 20', indicator1: 'Stochastic', indicator2: 'Close' },
  { label: 'Stochastic crosses 80', indicator1: 'Stochastic', indicator2: 'Close' },
] as const;