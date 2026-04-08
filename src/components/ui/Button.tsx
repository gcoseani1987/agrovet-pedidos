import { type ButtonHTMLAttributes, forwardRef } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  fullWidth?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary:   'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 disabled:bg-primary-300',
  secondary: 'bg-white text-primary-700 border-2 border-primary-600 hover:bg-primary-50 active:bg-primary-100 disabled:opacity-50',
  danger:    'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 disabled:bg-red-300',
  ghost:     'bg-transparent text-gray-700 hover:bg-gray-100 active:bg-gray-200 disabled:opacity-50',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-2 text-sm min-h-[2.5rem]',
  md: 'px-4 py-3 text-base min-h-[3rem]',
  lg: 'px-6 py-4 text-lg min-h-[3.5rem]',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, fullWidth, className = '', children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={[
          'inline-flex items-center justify-center gap-2',
          'font-semibold rounded-xl',
          'transition-colors duration-150',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
          'select-none touch-manipulation',
          variantClasses[variant],
          sizeClasses[size],
          fullWidth ? 'w-full' : '',
          className,
        ].join(' ')}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        )}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
