# backend/api/backtester.py
import pandas as pd
import operator
import numpy as np

def validate_strategy_config(config: dict) -> None:
    """Validate strategy configuration before running backtest."""
    if not isinstance(config, dict):
        raise ValueError("Strategy configuration must be a dictionary")
    
    if 'conditions' not in config:
        raise ValueError("Strategy configuration must contain 'conditions'")
    
    if not isinstance(config['conditions'], list):
        raise ValueError("Conditions must be a list")
    
    if len(config['conditions']) == 0:
        raise ValueError("At least one condition is required")
    
    for i, condition in enumerate(config['conditions']):
        if not isinstance(condition, dict):
            raise ValueError(f"Condition {i} must be a dictionary")
        
        required_fields = ['indicator', 'operator']
        for field in required_fields:
            if field not in condition:
                raise ValueError(f"Condition {i} missing required field: {field}")
        
        if condition['operator'] not in ['less_than', 'greater_than', 'crosses_above', 'crosses_below', 'equals', 'not_equals', 'between', 'outside']:
            raise ValueError(f"Invalid operator in condition {i}: {condition['operator']}")
        
        if condition['indicator'] not in ['RSI', 'MACD', 'Close', 'SMA', 'EMA', 'Bollinger_Bands', 'Stochastic', 'Williams_R', 'ATR', 'Volume']:
            raise ValueError(f"Invalid indicator in condition {i}: {condition['indicator']}")
    
    # Validate action
    if 'action' not in config:
        raise ValueError("Strategy configuration must contain 'action'")
    
    if config['action'] not in ['LONG', 'SHORT']:
        raise ValueError(f"Invalid action: {config['action']}. Must be 'LONG' or 'SHORT'")
    
    # Validate exit condition
    if 'exitCondition' not in config:
        raise ValueError("Strategy configuration must contain 'exitCondition'")
    
    exit_condition = config['exitCondition']
    if not isinstance(exit_condition, dict):
        raise ValueError("Exit condition must be a dictionary")
    
    if 'type' not in exit_condition:
        raise ValueError("Exit condition must have a 'type' field")
    
    valid_exit_types = ['manual', 'profit_target', 'stop_loss', 'trailing_stop', 'time_based', 'indicator_based']
    if exit_condition['type'] not in valid_exit_types:
        raise ValueError(f"Invalid exit condition type: {exit_condition['type']}")
    
    # Validate exit condition parameters based on type
    exit_type = exit_condition['type']
    if exit_type in ['profit_target', 'stop_loss', 'trailing_stop']:
        if 'value' not in exit_condition or not isinstance(exit_condition['value'], (int, float)):
            raise ValueError(f"{exit_type} exit condition must have a numeric 'value' field")
        if exit_condition['value'] <= 0 or exit_condition['value'] > 100:
            raise ValueError(f"{exit_type} percentage must be between 0 and 100")
    
    elif exit_type == 'time_based':
        if 'timePeriod' not in exit_condition or not isinstance(exit_condition['timePeriod'], int):
            raise ValueError("Time-based exit condition must have an integer 'timePeriod' field")
        if 'timeUnit' not in exit_condition:
            raise ValueError("Time-based exit condition must have a 'timeUnit' field")
        if exit_condition['timeUnit'] not in ['minutes', 'hours', 'days']:
            raise ValueError("Time unit must be 'minutes', 'hours', or 'days'")
        
        time_period = exit_condition['timePeriod']
        time_unit = exit_condition['timeUnit']
        
        if time_unit == 'minutes':
            if time_period <= 0 or time_period > 1440:  # Max 24 hours in minutes
                raise ValueError("Minutes must be between 1 and 1440")
        elif time_unit == 'hours':
            if time_period <= 0 or time_period > 8760:  # Max 365 days in hours
                raise ValueError("Hours must be between 1 and 8760")
        elif time_unit == 'days':
            if time_period <= 0 or time_period > 365:
                raise ValueError("Days must be between 1 and 365")
    
    elif exit_type == 'indicator_based':
        required_fields = ['indicator', 'operator', 'indicatorValue']
        for field in required_fields:
            if field not in exit_condition:
                raise ValueError(f"Indicator-based exit condition missing required field: {field}")
        
        if exit_condition['indicator'] not in ['RSI', 'MACD', 'Close', 'SMA', 'EMA', 'Bollinger_Bands', 'Stochastic', 'Williams_R', 'ATR', 'Volume']:
            raise ValueError(f"Invalid indicator in exit condition: {exit_condition['indicator']}")
        
        if exit_condition['operator'] not in ['less_than', 'greater_than', 'equals']:
            raise ValueError(f"Invalid operator in exit condition: {exit_condition['operator']}")

def run_backtest(data_df: pd.DataFrame, strategy_config: dict, initial_cash: float, leverage: float = 1.0):
    """Main backtesting function with comprehensive error handling."""
    from .indicators import add_indicators_to_data
    
    # Validate inputs
    if data_df.empty:
        raise ValueError("Input data is empty")
    
    if initial_cash <= 0:
        raise ValueError("Initial cash must be positive")
    
    # Validate strategy configuration
    validate_strategy_config(strategy_config)
    
    try:
        # 1. Prepare Data: Calculate all indicators first.
        df_with_indicators = add_indicators_to_data(data_df)
        
        if df_with_indicators.empty:
            raise ValueError("No valid data after calculating indicators")
        
        # 2. Generate Signals: Create a single column of 'BUY', 'SELL', or 'HOLD'.
        signals = generate_signals(df_with_indicators, strategy_config)
        
        # 3. Simulate Portfolio: Loop through prices and signals to simulate trades.
        exit_condition = strategy_config.get('exitCondition', {'type': 'manual'})
        simulator = PortfolioSimulator(df_with_indicators, signals, initial_cash, leverage, exit_condition)
        results = simulator.run_simulation()
        
        return results
        
    except Exception as e:
        return {
            'error': f'Backtest failed: {str(e)}',
            'stats': {},
            'plot_data': {'equity_curve': [], 'dates': []},
            'trades': []
        }

def generate_signals(df: pd.DataFrame, config: dict) -> pd.Series:
    """
    Takes a DataFrame with indicators and returns a Series with trade signals.
    This is the core of the strategy logic.
    """
    op_map = {
        'less_than': operator.lt,
        'greater_than': operator.gt,
        'equals': operator.eq,
        'not_equals': operator.ne,
        'crosses_above': 'crosses_above',
        'crosses_below': 'crosses_below',
        'between': 'between',
        'outside': 'outside'
    }
    
    # Start with a neutral signal (no action)
    final_signal = pd.Series('HOLD', index=df.index)
    logical_op = config.get('logicalOperator', 'AND')
    
    # Validate logical operator
    if logical_op not in ['AND', 'OR']:
        logical_op = 'AND'
    
    # Evaluate all conditions in a vectorized way
    condition_signals = []
    for cond in config.get('conditions', []):
        indicator_name = cond.get('indicator', '').upper()
        op_str = cond.get('operator')
        value = cond.get('value', 0)
        
        condition_met = pd.Series(False, index=df.index)
        
        try:
            if op_str in ['crosses_above', 'crosses_below']:
                # Handle cross-indicator comparisons
                compare_indicator = cond.get('compareIndicator', 'Close')
                compare_indicator_name = compare_indicator.upper()
                
                # Map indicator names to column names
                indicator_mapping = {
                    'RSI': 'rsi',
                    'MACD': 'macd_line',
                    'SMA': 'sma_20',
                    'EMA': 'ema_20',
                    'BOLLINGER_BANDS': 'bb_middle',
                    'STOCHASTIC': 'stoch_k',
                    'WILLIAMS_R': 'williams_r',
                    'ATR': 'atr',
                    'VOLUME': 'Volume',
                    'CLOSE': 'Close'
                }
                
                # Get the main indicator column
                main_indicator_col = indicator_mapping.get(indicator_name, 'Close')
                compare_indicator_col = indicator_mapping.get(compare_indicator_name, 'Close')
                
                if main_indicator_col not in df.columns or compare_indicator_col not in df.columns:
                    continue
                
                main_line = df[main_indicator_col]
                compare_line = df[compare_indicator_col]
                valid_mask = ~(main_line.isna() | compare_line.isna())
                
                if op_str == 'crosses_above':
                    condition_met = (
                        (main_line.shift(1) < compare_line.shift(1)) & 
                        (main_line > compare_line) & 
                        valid_mask
                    )
                else:  # crosses_below
                    condition_met = (
                        (main_line.shift(1) > compare_line.shift(1)) & 
                        (main_line < compare_line) & 
                        valid_mask
                    )
            elif op_str in ['between', 'outside']:
                # Handle range operators
                op_func = op_map.get(op_str)
                if op_func:
                    indicator_mapping = {
                        'RSI': 'rsi',
                        'MACD': 'macd_line',
                        'SMA': 'sma_20',
                        'EMA': 'ema_20',
                        'BOLLINGER_BANDS': 'bb_middle',
                        'STOCHASTIC': 'stoch_k',
                        'WILLIAMS_R': 'williams_r',
                        'ATR': 'atr',
                        'VOLUME': 'Volume',
                        'CLOSE': 'Close'
                    }
                    
                    indicator_col = indicator_mapping.get(indicator_name, 'Close')
                    
                    if indicator_col not in df.columns:
                        continue
                    
                    try:
                        min_val = float(value)
                        max_val = float(cond.get('compareValue', value))
                        
                        if op_str == 'between':
                            condition_met = (df[indicator_col] >= min_val) & (df[indicator_col] <= max_val)
                        else:  # outside
                            condition_met = (df[indicator_col] < min_val) | (df[indicator_col] > max_val)
                    except (ValueError, TypeError):
                        continue
            else:
                # Handle comparison operators
                op_func = op_map.get(op_str)
                if op_func:
                    # Map indicator names to column names
                    indicator_mapping = {
                        'RSI': 'rsi',
                        'MACD': 'macd_line',
                        'SMA': 'sma_20',
                        'EMA': 'ema_20',
                        'BOLLINGER_BANDS': 'bb_middle',  # Use middle band for comparison
                        'STOCHASTIC': 'stoch_k',
                        'WILLIAMS_R': 'williams_r',
                        'ATR': 'atr',
                        'VOLUME': 'Volume',
                        'CLOSE': 'Close'
                    }
                    
                    indicator_col = indicator_mapping.get(indicator_name, 'Close')
                    
                    if indicator_col not in df.columns:
                        continue
                    
                    try:
                        value = float(value)
                        condition_met = op_func(df[indicator_col], value)
                    except (ValueError, TypeError):
                        continue

            condition_signals.append(condition_met.fillna(False))
            
        except Exception as e:
            # Skip this condition if there's an error
            continue

    # Combine the boolean Series for each condition
    if not condition_signals:
        return final_signal # No conditions, so no signals

    if logical_op == 'AND':
        triggered = pd.concat(condition_signals, axis=1).all(axis=1)
    else: # OR
        triggered = pd.concat(condition_signals, axis=1).any(axis=1)

    # Create more sophisticated signal generation
    # LONG/SHORT when conditions are met and we're not already in a position
    # Exit when conditions are NOT met and we have a position
    # This creates natural long/short cycles
    
    # Start with HOLD
    final_signal = pd.Series('HOLD', index=df.index)
    
    # Apply LONG/SHORT signals where conditions are met
    action = config.get('action', 'LONG')
    final_signal[triggered] = action
    
    # We'll handle the alternating logic in the portfolio simulator
    
    return final_signal

class PortfolioSimulator:
    """Simulates trades based on a signal Series and returns the results."""
    def __init__(self, df: pd.DataFrame, signals: pd.Series, initial_cash: float, leverage: float = 1.0, exit_condition: dict = None):
        self.df = df
        self.signals = signals
        self.initial_cash = initial_cash
        self.leverage = max(1.0, min(10.0, leverage))  # Clamp leverage between 1x and 10x
        self.exit_condition = exit_condition if exit_condition is not None else {'type': 'manual'}
        self.cash = initial_cash
        self.position = 0.0  # Positive for long, negative for short
        self.trades = []
        self.equity_curve = []
        self.in_position = False  # Track if we're currently holding a position
        self.position_type = None  # 'LONG' or 'SHORT'
        self.entry_price = None  # Track entry price for P&L calculation
        self.entry_date = None  # Track when we entered for time-based exits
        self.highest_price = 0  # Track highest price for trailing stops (for long positions)
        self.lowest_price = float('inf')  # Track lowest price for trailing stops (for short positions)

    def should_exit_position(self, current_price: float, current_date, current_index: int) -> bool:
        """Check if we should exit the position based on exit conditions."""
        if not self.in_position or self.position == 0:
            return False
        
        exit_type = self.exit_condition.get('type', 'manual')
        
        if exit_type == 'manual':
            # Manual exit: only exit when signal changes from current position type
            current_signal = self.signals.iloc[current_index]
            return current_signal != self.position_type
        
        elif exit_type == 'profit_target':
            # Exit when profit target is reached
            if self.entry_price is not None:
                if self.position_type == 'LONG':
                    profit_pct = ((current_price - self.entry_price) / self.entry_price) * 100
                else:  # SHORT
                    profit_pct = ((self.entry_price - current_price) / self.entry_price) * 100
                target_value = float(self.exit_condition.get('value', 5))
                return profit_pct >= target_value
        
        elif exit_type == 'stop_loss':
            # Exit when stop loss is hit
            if self.entry_price is not None:
                if self.position_type == 'LONG':
                    loss_pct = ((self.entry_price - current_price) / self.entry_price) * 100
                else:  # SHORT
                    loss_pct = ((current_price - self.entry_price) / self.entry_price) * 100
                target_value = float(self.exit_condition.get('value', 2))
                return loss_pct >= target_value
        
        elif exit_type == 'trailing_stop':
            if self.position_type == 'LONG':
                # Update highest price if current price is higher
                if current_price > self.highest_price:
                    self.highest_price = current_price
                
                # Exit if price has dropped by trailing stop percentage from highest
                if self.highest_price > 0:
                    drop_pct = ((self.highest_price - current_price) / self.highest_price) * 100
                    target_value = float(self.exit_condition.get('value', 3))
                    return drop_pct >= target_value
            else:  # SHORT
                # Update lowest price if current price is lower
                if current_price < self.lowest_price:
                    self.lowest_price = current_price
                
                # Exit if price has risen by trailing stop percentage from lowest
                if self.lowest_price < float('inf'):
                    rise_pct = ((current_price - self.lowest_price) / self.lowest_price) * 100
                    target_value = float(self.exit_condition.get('value', 3))
                    return rise_pct >= target_value
        
        elif exit_type == 'time_based':
            # Exit after holding for specified time period
            if self.entry_date is not None:
                time_period = self.exit_condition.get('timePeriod', 7)
                time_unit = self.exit_condition.get('timeUnit', 'days')
                
                if time_unit == 'minutes':
                    # Convert to minutes for comparison
                    time_diff = current_date - self.entry_date
                    minutes_held = time_diff.total_seconds() / 60
                    return minutes_held >= time_period
                elif time_unit == 'hours':
                    # Convert to hours for comparison
                    time_diff = current_date - self.entry_date
                    hours_held = time_diff.total_seconds() / 3600
                    return hours_held >= time_period
                else:  # days
                    days_held = (current_date - self.entry_date).days
                    return days_held >= time_period
        
        elif exit_type == 'indicator_based':
            # Exit based on indicator condition
            indicator = self.exit_condition.get('indicator', 'RSI')
            operator = self.exit_condition.get('operator', 'greater_than')
            target_value = float(self.exit_condition.get('indicatorValue', '70'))
            
            # Map indicator names to column names
            indicator_mapping = {
                'RSI': 'rsi',
                'MACD': 'macd_line',
                'SMA': 'sma_20',
                'EMA': 'ema_20',
                'Bollinger_Bands': 'bb_middle',
                'Stochastic': 'stoch_k',
                'Williams_R': 'williams_r',
                'ATR': 'atr',
                'Volume': 'Volume',
                'Close': 'Close'
            }
            
            indicator_col = indicator_mapping.get(indicator, 'Close')
            if indicator_col in self.df.columns:
                current_indicator_value = self.df[indicator_col].iloc[current_index]
                if not pd.isna(current_indicator_value):
                    if operator == 'greater_than':
                        return current_indicator_value > target_value
                    elif operator == 'less_than':
                        return current_indicator_value < target_value
                    elif operator == 'equals':
                        return abs(current_indicator_value - target_value) < 0.01
        
        return False

    def run_simulation(self):
        """Run the portfolio simulation with proper buy/sell cycles."""
        try:
            for i in range(len(self.df)):
                current_price = self.df['Close'].iloc[i]
                current_date = self.df.index[i]
                signal = self.signals.iloc[i]
                
                # Skip if price is invalid
                if pd.isna(current_price) or current_price <= 0:
                    self.equity_curve.append(self.cash + (self.position * (self.df['Close'].iloc[i-1] if i > 0 else current_price)))
                    continue

                # Trading logic: LONG/SHORT when signal matches and we're not in position
                # Exit when exit conditions are met
                if signal in ['LONG', 'SHORT'] and not self.in_position and self.cash > 0 and self.equity_curve and self.equity_curve[-1] > 0:
                    # Enter position: use current portfolio value with leverage
                    current_portfolio_value = self.cash  # Current available cash
                    available_capital = current_portfolio_value * self.leverage
                    
                    if signal == 'LONG':
                        # Long position: buy shares
                        self.position = available_capital / current_price
                        trade_type = 'LONG'
                        trade_description = f"LONG: {current_date.strftime('%Y-%m-%d')} at ${current_price:.2f}"
                    else:  # SHORT
                        # Short position: sell shares (negative position)
                        self.position = -(available_capital / current_price)
                        trade_type = 'SHORT'
                        trade_description = f"SHORT: {current_date.strftime('%Y-%m-%d')} at ${current_price:.2f}"
                    
                    # Check if this trade would result in negative equity
                    # For leveraged positions, we need to ensure we can cover potential losses
                    max_loss_pct = 100 / self.leverage  # Maximum loss percentage before margin call
                    
                    # Calculate the maximum price movement we can handle
                    if signal == 'LONG':
                        max_price_drop = current_price * (max_loss_pct / 100)
                        min_safe_price = current_price - max_price_drop
                    else:  # SHORT
                        max_price_rise = current_price * (max_loss_pct / 100)
                        max_safe_price = current_price + max_price_rise
                    
                    trade_value = available_capital  # Total value of the leveraged position
                    self.cash = 0  # All cash is used as margin
                    self.in_position = True
                    self.position_type = signal
                    self.entry_price = current_price  # Store entry price for P&L calculation
                    self.entry_date = current_date  # Store entry date for time-based exits
                    self.entry_portfolio_value = current_portfolio_value  # Store portfolio value at entry
                    
                    # Initialize trailing stops
                    if signal == 'LONG':
                        self.highest_price = current_price
                    else:  # SHORT
                        self.lowest_price = current_price
                    
                    # Calculate current portfolio value (actual equity, not leveraged position value)
                    portfolio_value = current_portfolio_value  # Portfolio value is the current cash amount
                    
                    self.trades.append({
                        'Date': current_date.strftime('%Y-%m-%d %H:%M'), 
                        'Type': trade_type, 
                        'Price': f"{current_price:.2f}", 
                        'Portfolio': f"${portfolio_value:,.2f}",
                        'P&L': '—',  # No P&L for entry trades
                        'Leverage': f"{self.leverage}x"
                    })
                    print(f"{trade_description}, Value: ${trade_value:,.2f}, Leverage: {self.leverage}x")
                        
                elif self.in_position and self.position != 0 and self.should_exit_position(current_price, current_date, i):
                    # Exit position: close all position
                    if self.position_type == 'LONG':
                        # Close long position: sell shares
                        trade_value = self.position * current_price
                        trade_type = 'EXIT LONG'
                        trade_description = f"EXIT LONG: {current_date.strftime('%Y-%m-%d')} at ${current_price:.2f}"
                    else:  # SHORT
                        # Close short position: buy back shares
                        trade_value = abs(self.position) * current_price
                        trade_type = 'EXIT SHORT'
                        trade_description = f"EXIT SHORT: {current_date.strftime('%Y-%m-%d')} at ${current_price:.2f}"
                    
                    # Calculate P&L for this specific trade
                    if self.entry_price is not None:
                        if self.position_type == 'LONG':
                            # Long position P&L
                            price_change_pct = ((current_price - self.entry_price) / self.entry_price) * 100
                            pnl_amount = (current_price - self.entry_price) * abs(self.position)
                        else:  # SHORT
                            # Short position P&L (profit when price goes down)
                            price_change_pct = ((self.entry_price - current_price) / self.entry_price) * 100
                            pnl_amount = (self.entry_price - current_price) * abs(self.position)
                        
                        pnl_pct = price_change_pct * self.leverage  # Leveraged percentage
                        
                        # Format P&L display
                        if pnl_amount >= 0:
                            pnl_display = f"+${pnl_amount:,.2f} (+{pnl_pct:.2f}%)"
                        else:
                            pnl_display = f"-${abs(pnl_amount):,.2f} ({pnl_pct:.2f}%)"
                    else:
                        pnl_display = "N/A"
                    
                    # Calculate profit/loss with leverage for portfolio
                    # Use the actual portfolio value that was used for this trade
                    if self.position_type == 'LONG':
                        profit_loss = trade_value - (self.entry_portfolio_value * self.leverage)
                    else:  # SHORT
                        # For shorts, we get cash when we sell, then pay when we buy back
                        profit_loss = (self.entry_portfolio_value * self.leverage) - trade_value
                    
                    self.cash = self.entry_portfolio_value + profit_loss  # Return to entry portfolio value + P&L
                    self.position = 0
                    self.in_position = False
                    self.position_type = None
                    
                    # Calculate final portfolio value after the trade (actual equity)
                    portfolio_value = self.cash  # After exiting, portfolio is just cash
                    
                    self.trades.append({
                        'Date': current_date.strftime('%Y-%m-%d %H:%M'), 
                        'Type': trade_type, 
                        'Price': f"{current_price:.2f}", 
                        'Portfolio': f"${portfolio_value:,.2f}",
                        'P&L': pnl_display,
                        'Leverage': f"{self.leverage}x"
                    })
                    print(f"{trade_description}, P&L: {pnl_display}, Leverage: {self.leverage}x")
                
                # Calculate current equity (actual portfolio value, not leveraged position value)
                if self.in_position:
                    # When in position, calculate actual equity based on P&L
                    if self.entry_price is not None:
                        if self.position_type == 'LONG':
                            # For long positions: entry portfolio value + (current price - entry price) * position size
                            price_change = current_price - self.entry_price
                            pnl = price_change * abs(self.position)
                            current_equity = self.entry_portfolio_value + pnl
                        else:  # SHORT
                            # For short positions: entry portfolio value + (entry price - current price) * position size
                            price_change = self.entry_price - current_price
                            pnl = price_change * abs(self.position)
                            current_equity = self.entry_portfolio_value + pnl
                    else:
                        current_equity = self.cash
                else:
                    # When not in position, equity is just the cash
                    current_equity = self.cash
                
                # Prevent negative equity - implement margin call
                if current_equity <= 0:
                    # Force exit position to prevent negative equity
                    if self.in_position and self.position != 0:
                        # Emergency exit - close position at current price
                        if self.position_type == 'LONG':
                            trade_value = self.position * current_price
                            trade_type = 'MARGIN CALL LONG'
                        else:  # SHORT
                            trade_value = abs(self.position) * current_price
                            trade_type = 'MARGIN CALL SHORT'
                        
                        # Calculate P&L for margin call
                        if self.entry_price is not None:
                            if self.position_type == 'LONG':
                                pnl_amount = (current_price - self.entry_price) * abs(self.position)
                            else:  # SHORT
                                pnl_amount = (self.entry_price - current_price) * abs(self.position)
                            
                            if pnl_amount >= 0:
                                pnl_display = f"+${pnl_amount:,.2f}"
                            else:
                                pnl_display = f"-${abs(pnl_amount):,.2f}"
                        else:
                            pnl_display = "N/A"
                        
                        # Reset to zero cash (margin call wiped out the account)
                        self.cash = 0
                        self.position = 0
                        self.in_position = False
                        self.position_type = None
                        
                        self.trades.append({
                            'Date': current_date.strftime('%Y-%m-%d %H:%M'), 
                            'Type': trade_type, 
                            'Price': f"{current_price:.2f}", 
                            'Portfolio': "$0.00",  # Margin call results in zero portfolio value
                            'P&L': pnl_display,
                            'Leverage': f"{self.leverage}x"
                        })
                        print(f"MARGIN CALL: {trade_type} at ${current_price:.2f}, P&L: {pnl_display}")
                    
                    current_equity = 0  # Set equity to zero to prevent negative values
                
                self.equity_curve.append(current_equity)
            
            return self._format_results()
            
        except Exception as e:
            return {
                'error': f'Simulation failed: {str(e)}',
                'stats': {},
                'plot_data': {'equity_curve': [], 'dates': []},
                'trades': []
            }

    def _format_results(self):
        """Format the simulation results with error handling."""
        if not self.equity_curve:
            return {
                'error': 'Backtest generated no data.',
                'stats': {},
                'plot_data': {'equity_curve': [], 'dates': []},
                'trades': []
            }
        
        try:
            final_equity = self.equity_curve[-1]
            total_return_pct = ((final_equity - self.initial_cash) / self.initial_cash) * 100

            return {
                'stats': {
                    'Start': self.df.index[0].strftime('%Y-%m-%d'),
                    'End': self.df.index[-1].strftime('%Y-%m-%d'),
                    'Equity Final [$]': f"{final_equity:,.2f}",
                    'Return [%]': f"{total_return_pct:.2f}",
                    '# Trades': len(self.trades)
                },
                'plot_data': {
                    'equity_curve': self.equity_curve,
                    'dates': self.df.index.strftime('%Y-%m-%d %H:%M').tolist()
                },
                'trades': self.trades
            }
        except Exception as e:
            return {
                'error': f'Error formatting results: {str(e)}',
                'stats': {},
                'plot_data': {'equity_curve': [], 'dates': []},
                'trades': []
            }