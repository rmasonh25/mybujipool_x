import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export function formatHashrate(hashrate) {
  if (hashrate >= 1000000000000) {
    return `${(hashrate / 1000000000000).toFixed(2)} TH/s`
  } else if (hashrate >= 1000000000) {
    return `${(hashrate / 1000000000).toFixed(2)} GH/s`
  } else if (hashrate >= 1000000) {
    return `${(hashrate / 1000000).toFixed(2)} MH/s`
  } else if (hashrate >= 1000) {
    return `${(hashrate / 1000).toFixed(2)} KH/s`
  } else {
    return `${hashrate.toFixed(2)} H/s`
  }
}

export function formatPower(power) {
  return `${power} W`
}

export function calculateEfficiency(hashrate, power) {
  // Efficiency in J/TH
  const hashrateInTH = hashrate / 1000000000000
  return (power / hashrateInTH).toFixed(2)
}