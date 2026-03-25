"use client";

// TradingView Lightweight Charts v5 を使用したチャートコンポーネント
import { useEffect, useRef } from "react";
import { createChart, CandlestickSeries, ColorType, type IChartApi, type ISeriesApi } from "lightweight-charts";
import type { OhlcvData } from "@/types";

interface ChartProps {
  candles: OhlcvData[];
  className?: string;
}

export default function CandlestickChart({ candles, className = "" }: ChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // チャート初期化
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#9ca3af",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "rgba(255, 255, 255, 0.03)" },
        horzLines: { color: "rgba(255, 255, 255, 0.03)" },
      },
      crosshair: {
        vertLine: { color: "rgba(59, 130, 246, 0.3)", width: 1 },
        horzLine: { color: "rgba(59, 130, 246, 0.3)", width: 1 },
      },
      timeScale: {
        borderColor: "rgba(255, 255, 255, 0.06)",
        timeVisible: true,
      },
      rightPriceScale: {
        borderColor: "rgba(255, 255, 255, 0.06)",
      },
      handleScroll: { vertTouchDrag: false },
    });

    // v5 API: chart.addSeries(CandlestickSeries, options)
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderUpColor: "#22c55e",
      borderDownColor: "#ef4444",
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });

    chartRef.current = chart;
    seriesRef.current = candleSeries;

    // リサイズ対応
    const resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      chart.applyOptions({ width, height });
    });
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, []);

  // データ更新
  useEffect(() => {
    if (!seriesRef.current || candles.length === 0) return;

    const chartData = candles.map((c) => ({
      time: Math.floor(new Date(c.timestamp).getTime() / 1000) as number,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    // 時系列でソート
    chartData.sort((a, b) => (a.time as number) - (b.time as number));

    // 重複を排除 (lightweight-charts は厳密な昇順を要求するため)
    const uniqueData = chartData.filter((item, index, self) => 
      index === 0 || item.time > self[index - 1].time
    );

    if (uniqueData.length > 0) {
      seriesRef.current.setData(uniqueData as any);
      
      // 初回またはデータ追加時にコンテンツにフィットさせる
      // 短いタイムアウトを入れることで、レンダリング直後のサイズ計算ミスを防ぐ
      requestAnimationFrame(() => {
        chartRef.current?.timeScale().fitContent();
      });
    }
  }, [candles]);

  return (
    <div
      ref={chartContainerRef}
      className={`w-full ${className}`}
      style={{ minHeight: "300px" }}
    />
  );
}
