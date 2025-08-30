import type { BTH } from '@backtest/framework'

export const properties = {
  params: ['lowSMA', 'highSMA'],
  dynamicParams: false,
}

// Simple SMA helper for arrays of numbers
function sma(values: number[]): number {
  if (!values?.length) return NaN
  const sum = values.reduce((a, b) => a + b, 0)
  return sum / values.length
}

export async function runStrategy(bth: BTH) {
  const low = Number(bth.params.lowSMA ?? 10)
  const high = Number(bth.params.highSMA ?? 20)

  // Get the last N closes for each SMA window
  const lowSet = (await bth.getCandles('close', low, 0)) as number[]
  const highSet = (await bth.getCandles('close', high, 0)) as number[]

  const lowSMA = sma(lowSet)
  const highSMA = sma(highSet)

  if (Number.isFinite(lowSMA) && Number.isFinite(highSMA)) {
    if (lowSMA > highSMA) {
      await bth.buy()
    } else {
      await bth.sell()
    }
  }
}
