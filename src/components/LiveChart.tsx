import { useRef, useEffect, useMemo } from "react";
import uPlot from "uplot";
import "uplot/dist/uPlot.min.css";
import type { GaugeReading } from "../types";

interface LiveChartProps {
  readings: GaugeReading[];
  height?: number;
}

export function LiveChart({ readings, height = 200 }: LiveChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<uPlot | null>(null);

  const data = useMemo(() => {
    if (!readings.length) return [[], []] as [number[], number[]];

    const timestamps = readings.map((r) => r.timestamp.getTime() / 1000);
    const levels = readings.map((r) => r.level);

    return [timestamps, levels] as [number[], number[]];
  }, [readings]);

  useEffect(() => {
    if (!containerRef.current || !data[0].length) return;

    const opts: uPlot.Options = {
      width: containerRef.current.clientWidth,
      height,
      cursor: { show: true },
      legend: { show: false },
      scales: {
        x: { time: true },
        y: { auto: true },
      },
      axes: [
        {
          stroke: "#9ca3af",
          grid: { stroke: "#e5e7eb", width: 1 },
          ticks: { stroke: "#e5e7eb" },
          font: "12px Inter, system-ui",
        },
        {
          stroke: "#9ca3af",
          grid: { stroke: "#e5e7eb", width: 1 },
          ticks: { stroke: "#e5e7eb" },
          font: "12px Inter, system-ui",
          values: (_, vals) => vals.map((v) => `${v.toFixed(1)}m`),
        },
      ],
      series: [
        {},
        {
          label: "Level",
          stroke: "#10b981",
          width: 2,
          fill: "rgba(16, 185, 129, 0.1)",
        },
      ],
    };

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    chartRef.current = new uPlot(opts, data, containerRef.current);

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [data, height]);

  useEffect(() => {
    const handleResize = () => {
      if (chartRef.current && containerRef.current) {
        chartRef.current.setSize({
          width: containerRef.current.clientWidth,
          height,
        });
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [height]);

  if (!readings.length) {
    return (
      <div
        className="flex items-center justify-center text-gray-400"
        style={{ height }}
      >
        No data available
      </div>
    );
  }

  return <div ref={containerRef} />;
}
