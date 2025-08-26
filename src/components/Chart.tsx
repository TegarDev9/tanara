import {
    createChart,
    ColorType,
    IChartApi,
    CandlestickData,
    Time,
    UTCTimestamp,
    BusinessDay,
    DeepPartial,
    ChartOptions,
    ISeriesApi,
    CandlestickSeries, // Import definisi series
} from 'lightweight-charts';
import React, {
    createContext,
    useContext,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';

// --- Konteks untuk menyediakan Chart API ke komponen anak dengan tipe yang benar ---
const ChartContext = createContext<IChartApi | null>(null);

// --- Tipe Props ---
interface TradingChartProps {
    colors?: {
        backgroundColor?: string;
        textColor?: string;
        upColor?: string;
        downColor?: string;
    };
    symbol?: string;
    timeframe?: string;
}

interface ChartContainerProps {
    children: React.ReactNode;
    container: HTMLElement;
    layout: DeepPartial<ChartOptions>;
}

interface CandlestickSeriesComponentProps {
    data: CandlestickData[];
    upColor?: string;
    downColor?: string;
}

// --- Mock Data Fetching (Tidak diubah) ---
const createTimeValue = (date: Date, timeframe: string): Time => {
    if (timeframe.includes('m') || timeframe.includes('H')) {
        return (date.getTime() / 1000) as UTCTimestamp;
    }
    const businessDay: BusinessDay = {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate()
    };
    return businessDay;
};

const fetchCandlestickData = async (symbol: string, timeframe: string): Promise<CandlestickData[]> => {
    const mockData: CandlestickData[] = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 100);
    let lastClose = 100 + Math.random() * 20;

    for (let i = 0; i < 100; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);

        const open = lastClose + (Math.random() - 0.5) * 4;
        const change = (Math.random() - 0.5) * 10;
        const high = Math.max(open, open + change) + Math.random() * 3;
        const low = Math.min(open, open + change) - Math.random() * 3;
        const close = open + change;

        const timeValue: Time = createTimeValue(currentDate, timeframe);

        mockData.push({
            time: timeValue,
            open: Number(open.toFixed(2)),
            high: Number(high.toFixed(2)),
            low: Number(low.toFixed(2)),
            close: Number(close.toFixed(2)),
        });

        lastClose = close;
    }
    return mockData;
};

// --- Komponen Utama TradingChart ---
export const TradingChart: React.FC<TradingChartProps> = ({
    colors,
    symbol = 'BINANCE:BTCUSDT',
    timeframe = '1D',
}) => {
    const {
        backgroundColor = '#000000',
        textColor = 'white',
        upColor = '#26a69a',
        downColor = '#ef5350'
    } = colors || {};

    const [chartLayoutOptions, setChartLayoutOptions] = useState<DeepPartial<ChartOptions>>({});
    const [candlestickData, setCandlestickData] = useState<CandlestickData[]>([]);
    const chartContainerRef = useRef<HTMLDivElement>(null);

    // Efek untuk memuat data
    useEffect(() => {
        const loadData = async () => {
            const data = await fetchCandlestickData(symbol, timeframe);
            setCandlestickData(data);
        };
        loadData();
    }, [symbol, timeframe]);

    // Efek untuk mengatur layout chart
    useEffect(() => {
        const isIntraday = timeframe.includes('m') || timeframe.includes('H');
        setChartLayoutOptions({
            layout: {
                background: { type: ColorType.Solid, color: backgroundColor },
                textColor: textColor,
            },
            grid: {
                vertLines: { color: 'rgba(70, 130, 180, 0.5)' },
                horzLines: { color: 'rgba(70, 130, 180, 0.5)' },
            },
            timeScale: {
                timeVisible: isIntraday,
                secondsVisible: false,
                borderColor: 'rgba(197, 203, 206, 0.8)',
            },
        });
    }, [backgroundColor, textColor, timeframe]);

    return (
        <div ref={chartContainerRef} className="h-full w-full">
            {chartContainerRef.current && (
                <ChartContainer
                    container={chartContainerRef.current}
                    layout={chartLayoutOptions}
                >
                    <CandlestickSeriesComponent
                        data={candlestickData}
                        upColor={upColor}
                        downColor={downColor}
                    />
                </ChartContainer>
            )}
        </div>
    );
};

// --- ChartContainer yang Disederhanakan ---
export const ChartContainer: React.FC<ChartContainerProps> = ({ children, container, layout }) => {
    const [chart, setChart] = useState<IChartApi | null>(null);

    useLayoutEffect(() => {
        if (!container) return;

        const chartInstance = createChart(container, {
            ...layout,
            width: container.clientWidth,
            height: container.clientHeight,
        });
        chartInstance.timeScale().fitContent();
        setChart(chartInstance);

        const handleResize = () => {
            chartInstance.applyOptions({
                width: container.clientWidth,
                height: container.clientHeight,
            });
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chartInstance.remove();
            setChart(null);
        };
    }, [container, layout]);

    useEffect(() => {
        if (chart) {
            chart.applyOptions(layout);
        }
    }, [layout, chart]);

    return (
        <ChartContext.Provider value={chart}>
            {chart ? children : null}
        </ChartContext.Provider>
    );
};

// --- Komponen Series yang Diperbaiki ---
export const CandlestickSeriesComponent: React.FC<CandlestickSeriesComponentProps> = (props) => {
    const chart = useContext(ChartContext);
    // Menggunakan tipe yang tepat untuk series API
    const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

    useEffect(() => {
        if (!chart) return;

        // PERBAIKAN: Menggunakan method addSeries yang benar dengan tipe yang tepat
        // Sesuai dengan API terbaru lightweight-charts v5.x
        const series = chart.addSeries(CandlestickSeries, {
            upColor: props.upColor,
            downColor: props.downColor,
            borderVisible: false,
            wickUpColor: props.upColor,
            wickDownColor: props.downColor,
        });
        
        series.setData(props.data);
        seriesRef.current = series;

        return () => {
            if (chart && seriesRef.current) {
                try {
                    // PERBAIKAN: Menggunakan method removeSeries yang benar dengan tipe yang tepat
                    chart.removeSeries(seriesRef.current);
                } catch (error) {
                    const typedError = error as Error;
                    console.warn("Gagal menghapus series, chart mungkin sudah dibersihkan.", typedError.message);
                }
            }
        };
    }, [chart, props.data, props.upColor, props.downColor]);

    return null;
};

// Komponen App utama untuk rendering
export default function App() {
    return (
        <div style={{ height: '500px', width: '100%', border: '1px solid #333', backgroundColor: '#111' }}>
            <h1 style={{color: 'white', textAlign: 'center', padding: '10px'}}>Trading Chart</h1>
            <TradingChart />
        </div>
    );
}
