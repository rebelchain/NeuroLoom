"use client";

import { useEffect, useRef } from "react";
import { createChart, ColorType, LineSeries } from "lightweight-charts"; 

export function VaultChart({
  data,
}: {
  data: { time: string; value: number }[]; 
}) {
  const chartContainerRef = useRef<HTMLDivElement>(null); 

  useEffect(() => {
    if (!chartContainerRef.current) return; 

    const chart = createChart(chartContainerRef.current, {
      
      layout: {
        background: { type: ColorType.Solid, color: "transparent" }, 
        textColor: "#8a8a8a", 
        fontFamily:
          "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", 
      },
      grid: {
        vertLines: { color: "rgba(31, 31, 31, 0.5)" }, 
        horzLines: { color: "rgba(31, 31, 31, 0.5)" }, 
      },
      width: chartContainerRef.current.clientWidth, 
      height: 200, 
      rightPriceScale: {
        borderVisible: false, 
      },
      timeScale: {
        borderVisible: false, 
        timeVisible: true, 
      },
      localization: {
        priceFormatter: (price: number) =>
          new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 2,
          }).format(price),
      },
    });

    const lineSeries = chart.addSeries(LineSeries, {
      
      color: "#8b5cf6", 
      lineWidth: 2, 
      crosshairMarkerVisible: true, 
      crosshairMarkerRadius: 4, 
    });

    lineSeries.setData(data); 

    const handleResize = () => {
      
      if (chartContainerRef.current) {
        
        chart.applyOptions({ width: chartContainerRef.current.clientWidth }); 
      }
    };

    window.addEventListener("resize", handleResize); 
    return () => {
      window.removeEventListener("resize", handleResize); 
      chart.remove(); 
    };
  }, [data]); 

  return <div ref={chartContainerRef} className="w-full h-[200px]" />; 
}
