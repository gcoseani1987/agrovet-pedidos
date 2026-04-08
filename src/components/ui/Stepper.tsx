interface StepperProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  decimals?: number   // para kg/litros
  disabled?: boolean
}

export function Stepper({
  value,
  onChange,
  min = 1,
  max = 9999,
  step = 1,
  decimals = 0,
  disabled = false,
}: StepperProps) {
  const decrement = () => {
    const next = +(value - step).toFixed(decimals)
    if (next >= min) onChange(next)
  }

  const increment = () => {
    const next = +(value + step).toFixed(decimals)
    if (next <= max) onChange(next)
  }

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = parseFloat(e.target.value)
    if (!isNaN(raw) && raw >= min && raw <= max) onChange(+raw.toFixed(decimals))
  }

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={decrement}
        disabled={disabled || value <= min}
        className="w-12 h-12 rounded-xl bg-gray-100 text-gray-900 text-2xl font-bold
                   flex items-center justify-center
                   active:bg-gray-200 disabled:opacity-40
                   touch-manipulation select-none"
        aria-label="Reducir cantidad"
      >
        −
      </button>

      <input
        type="number"
        inputMode="decimal"
        value={value}
        onChange={handleInput}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className="w-20 h-12 text-center text-xl font-bold rounded-xl border-2 border-gray-300
                   focus:border-primary-500 focus:outline-none
                   disabled:bg-gray-50 disabled:text-gray-400"
      />

      <button
        type="button"
        onClick={increment}
        disabled={disabled || value >= max}
        className="w-12 h-12 rounded-xl bg-gray-100 text-gray-900 text-2xl font-bold
                   flex items-center justify-center
                   active:bg-gray-200 disabled:opacity-40
                   touch-manipulation select-none"
        aria-label="Aumentar cantidad"
      >
        +
      </button>
    </div>
  )
}
