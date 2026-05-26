"""Pure-math quant engine.

Computes technical indicators (RSI, MACD, Bollinger, ATR, EMAs, VWAP) and
risk metrics (Sharpe, max drawdown, annualised volatility, VaR, beta) from an
OHLCV series. The engine is **AI-free** by design — every number is derived
from price and volume.
"""

from __future__ import annotations

import math

import numpy as np
import pandas as pd

from ..schemas import IndicatorBundle, OhlcvPoint, QuantBundle, RiskBundle


def _to_dataframe(candles: list[OhlcvPoint]) -> pd.DataFrame:
    if not candles:
        return pd.DataFrame()
    df = pd.DataFrame([c.model_dump() for c in candles])
    df = df.sort_values("timestamp").reset_index(drop=True)
    return df


def _rsi(series: pd.Series, window: int = 14) -> float:
    delta = series.diff()
    gain = delta.clip(lower=0).rolling(window=window).mean()
    loss = (-delta.clip(upper=0)).rolling(window=window).mean()
    rs = gain / loss.replace(0, np.nan)
    rsi = 100 - (100 / (1 + rs))
    return float(rsi.iloc[-1]) if not rsi.empty and not pd.isna(rsi.iloc[-1]) else 50.0


def _macd(series: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9) -> tuple[float, float, float]:
    ema_fast = series.ewm(span=fast, adjust=False).mean()
    ema_slow = series.ewm(span=slow, adjust=False).mean()
    macd_line = ema_fast - ema_slow
    signal_line = macd_line.ewm(span=signal, adjust=False).mean()
    hist = macd_line - signal_line
    return (
        float(macd_line.iloc[-1]) if not macd_line.empty else 0.0,
        float(signal_line.iloc[-1]) if not signal_line.empty else 0.0,
        float(hist.iloc[-1]) if not hist.empty else 0.0,
    )


def _bollinger(series: pd.Series, window: int = 20, k: float = 2.0) -> tuple[float, float, float]:
    sma = series.rolling(window=window).mean()
    std = series.rolling(window=window).std()
    upper = sma + k * std
    lower = sma - k * std
    last_price = float(series.iloc[-1])
    upper_v = float(upper.iloc[-1]) if not pd.isna(upper.iloc[-1]) else last_price * 1.05
    lower_v = float(lower.iloc[-1]) if not pd.isna(lower.iloc[-1]) else last_price * 0.95
    pct = (last_price - lower_v) / (upper_v - lower_v) if upper_v != lower_v else 0.5
    return upper_v, lower_v, max(0.0, min(1.0, float(pct)))


def _atr(df: pd.DataFrame, window: int = 14) -> float:
    if df.empty:
        return 0.0
    high_low = df["high"] - df["low"]
    high_close = (df["high"] - df["close"].shift()).abs()
    low_close = (df["low"] - df["close"].shift()).abs()
    tr = pd.concat([high_low, high_close, low_close], axis=1).max(axis=1)
    atr = tr.rolling(window=window).mean()
    return float(atr.iloc[-1]) if not pd.isna(atr.iloc[-1]) else 0.0


def _vwap(df: pd.DataFrame) -> float:
    if df.empty:
        return 0.0
    typical = (df["high"] + df["low"] + df["close"]) / 3
    pv = typical * df["volume"]
    return float(pv.sum() / df["volume"].sum()) if df["volume"].sum() else 0.0


def _ema(series: pd.Series, span: int) -> float:
    if series.empty:
        return 0.0
    return float(series.ewm(span=span, adjust=False).mean().iloc[-1])


def _sma(series: pd.Series, window: int) -> float:
    if series.empty:
        return 0.0
    sma = series.rolling(window=min(window, len(series))).mean()
    return float(sma.iloc[-1])


# ---------------------------------------------------------------------------
# Risk metrics
# ---------------------------------------------------------------------------


def _returns(close: pd.Series) -> pd.Series:
    return close.pct_change().dropna()


def _sharpe(returns: pd.Series, rf: float = 0.04) -> float:
    if returns.empty or returns.std() == 0:
        return 0.0
    annual_return = returns.mean() * 252
    annual_vol = returns.std() * math.sqrt(252)
    return float((annual_return - rf) / annual_vol)


def _max_drawdown(close: pd.Series) -> float:
    if close.empty:
        return 0.0
    cumulative = close / close.iloc[0]
    peak = cumulative.cummax()
    drawdown = (cumulative - peak) / peak
    return float(drawdown.min())


def _var_95(returns: pd.Series) -> float:
    if returns.empty:
        return 0.0
    return float(np.percentile(returns, 5))


def _annual_vol(returns: pd.Series) -> float:
    if returns.empty:
        return 0.0
    return float(returns.std() * math.sqrt(252))


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def compute(candles: list[OhlcvPoint], beta_proxy: float = 1.05) -> QuantBundle:
    df = _to_dataframe(candles)
    notes: list[str] = []
    if df.empty or len(df) < 20:
        notes.append("Insufficient history; using neutral defaults.")
        ind = IndicatorBundle(
            rsi=50, macd=0, macd_signal=0, macd_hist=0,
            bb_upper=0, bb_lower=0, bb_pct=0.5,
            atr=0, ema_20=0, ema_50=0, sma_200=0, vwap=0,
        )
        risk = RiskBundle(sharpe=0, max_drawdown=0, annualised_volatility=0, var_95=0, beta=beta_proxy)
        return QuantBundle(indicators=ind, risk=risk, notes=notes)

    close = df["close"]
    rsi = _rsi(close)
    macd, signal, hist = _macd(close)
    bb_u, bb_l, bb_pct = _bollinger(close)
    atr = _atr(df)
    ema20 = _ema(close, 20)
    ema50 = _ema(close, 50)
    sma200 = _sma(close, 200)
    vwap = _vwap(df.tail(60))
    indicators = IndicatorBundle(
        rsi=round(rsi, 2),
        macd=round(macd, 3),
        macd_signal=round(signal, 3),
        macd_hist=round(hist, 3),
        bb_upper=round(bb_u, 2),
        bb_lower=round(bb_l, 2),
        bb_pct=round(bb_pct, 3),
        atr=round(atr, 2),
        ema_20=round(ema20, 2),
        ema_50=round(ema50, 2),
        sma_200=round(sma200, 2),
        vwap=round(vwap, 2),
    )

    rets = _returns(close)
    risk = RiskBundle(
        sharpe=round(_sharpe(rets), 2),
        max_drawdown=round(_max_drawdown(close), 4),
        annualised_volatility=round(_annual_vol(rets), 4),
        var_95=round(_var_95(rets), 4),
        beta=round(beta_proxy, 2),
    )

    # Narrative notes — surfaced in the UI
    if rsi >= 70:
        notes.append("RSI in overbought territory — momentum stretched.")
    elif rsi <= 30:
        notes.append("RSI in oversold territory — possible reversion setup.")
    if hist > 0 and macd > signal:
        notes.append("MACD histogram positive — bullish momentum confirmed.")
    if hist < 0 and macd < signal:
        notes.append("MACD histogram negative — bearish momentum building.")
    if close.iloc[-1] > ema20 > ema50:
        notes.append("Price above 20/50 EMAs — uptrend structure intact.")
    if close.iloc[-1] < ema20 < ema50:
        notes.append("Price below 20/50 EMAs — downtrend structure.")
    if bb_pct > 0.95:
        notes.append("Price hugging upper Bollinger band — extension risk.")
    elif bb_pct < 0.05:
        notes.append("Price hugging lower Bollinger band — capitulation risk.")

    return QuantBundle(indicators=indicators, risk=risk, notes=notes)


quant_engine = compute
