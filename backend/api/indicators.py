# backend/api/indicators.py
import pandas as pd
import numpy as np


def calculate_rsi(prices: pd.Series, period: int = 14) -> pd.Series:
    """Calculate RSI with proper handling of division by zero."""
    delta = prices.diff()
    gain = delta.where(delta > 0, 0).ewm(alpha=1 / period, adjust=False).mean()
    loss = -delta.where(delta < 0, 0).ewm(alpha=1 / period, adjust=False).mean()

    # Handle division by zero
    rs = np.where(loss != 0, gain / loss, 0)
    rsi = 100 - (100 / (1 + rs))
    rsi = pd.Series(rsi, index=prices.index)
    rsi.fillna(50, inplace=True)
    return rsi


def calculate_macd(
    prices: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9
) -> dict:
    """Calculate MACD with proper error handling."""
    if len(prices) < slow:
        # Return empty MACD if not enough data
        empty_series = pd.Series([np.nan] * len(prices), index=prices.index)
        return {"macd_line": empty_series, "signal_line": empty_series}

    ema_fast = prices.ewm(span=fast, adjust=False).mean()
    ema_slow = prices.ewm(span=slow, adjust=False).mean()
    macd_line = ema_fast - ema_slow
    signal_line = macd_line.ewm(span=signal, adjust=False).mean()
    return {"macd_line": macd_line, "signal_line": signal_line}


def calculate_sma(prices: pd.Series, period: int = 20) -> pd.Series:
    """Calculate Simple Moving Average."""
    return prices.rolling(window=period).mean()


def calculate_ema(prices: pd.Series, period: int = 20) -> pd.Series:
    """Calculate Exponential Moving Average."""
    return prices.ewm(span=period, adjust=False).mean()


def calculate_bollinger_bands(
    prices: pd.Series, period: int = 20, upper_band: float = 2, lower_band: float = 2
) -> dict:
    """Calculate Bollinger Bands."""
    sma = prices.rolling(window=period).mean()
    std = prices.rolling(window=period).std()
    upper = sma + (std * upper_band)
    lower = sma - (std * lower_band)
    return {"upper": upper, "middle": sma, "lower": lower}


def calculate_stochastic(
    high: pd.Series,
    low: pd.Series,
    close: pd.Series,
    k_period: int = 14,
    d_period: int = 3,
) -> dict:
    """Calculate Stochastic Oscillator."""
    lowest_low = low.rolling(window=k_period).min()
    highest_high = high.rolling(window=k_period).max()
    k_percent = 100 * ((close - lowest_low) / (highest_high - lowest_low))
    d_percent = k_percent.rolling(window=d_period).mean()
    return {"k_percent": k_percent, "d_percent": d_percent}


def calculate_williams_r(
    high: pd.Series, low: pd.Series, close: pd.Series, period: int = 14
) -> pd.Series:
    """Calculate Williams %R."""
    highest_high = high.rolling(window=period).max()
    lowest_low = low.rolling(window=period).min()
    williams_r = -100 * ((highest_high - close) / (highest_high - lowest_low))
    return williams_r


def calculate_atr(
    high: pd.Series, low: pd.Series, close: pd.Series, period: int = 14
) -> pd.Series:
    """Calculate Average True Range."""
    tr1 = high - low
    tr2 = abs(high - close.shift(1))
    tr3 = abs(low - close.shift(1))
    true_range = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
    atr = true_range.rolling(window=period).mean()
    return atr


def add_indicators_to_data(df: pd.DataFrame) -> pd.DataFrame:
    """This function takes a DataFrame and adds all supported indicator columns."""
    if df.empty:
        raise ValueError("DataFrame is empty")

    if "Close" not in df.columns:
        raise ValueError("DataFrame must contain 'Close' column")

    # Create a copy to avoid modifying the original
    df_copy = df.copy()
    close_prices = df_copy["Close"]

    # Calculate basic indicators
    df_copy["rsi"] = calculate_rsi(close_prices)
    macd_dict = calculate_macd(close_prices)
    df_copy["macd_line"] = macd_dict["macd_line"]
    df_copy["macd_signal"] = macd_dict["signal_line"]

    # Calculate moving averages
    df_copy["sma_20"] = calculate_sma(close_prices, 20)
    df_copy["ema_20"] = calculate_ema(close_prices, 20)

    # Calculate Bollinger Bands
    bb_dict = calculate_bollinger_bands(close_prices, 20, 2, 2)
    df_copy["bb_upper"] = bb_dict["upper"]
    df_copy["bb_middle"] = bb_dict["middle"]
    df_copy["bb_lower"] = bb_dict["lower"]

    # Calculate Stochastic (if we have High and Low data)
    if "High" in df_copy.columns and "Low" in df_copy.columns:
        stoch_dict = calculate_stochastic(df_copy["High"], df_copy["Low"], close_prices)
        df_copy["stoch_k"] = stoch_dict["k_percent"]
        df_copy["stoch_d"] = stoch_dict["d_percent"]

        # Calculate Williams %R
        df_copy["williams_r"] = calculate_williams_r(
            df_copy["High"], df_copy["Low"], close_prices
        )

        # Calculate ATR
        df_copy["atr"] = calculate_atr(df_copy["High"], df_copy["Low"], close_prices)

    # Fill NaN values with forward fill, then backward fill for any remaining NaNs
    df_copy.ffill(inplace=True)
    df_copy.bfill(inplace=True)

    # Only remove rows if they still have NaN values after filling
    df_copy.dropna(inplace=True)

    if df_copy.empty:
        raise ValueError("No valid data after calculating indicators")

    return df_copy
