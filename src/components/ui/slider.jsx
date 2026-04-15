import * as React from "react"

const Slider = React.forwardRef(({ className, value, defaultValue, onValueChange, onChange, min, max, step, ...props }, ref) => {
  const currentValue = Array.isArray(value) ? value[0] : value
  const currentDefault = Array.isArray(defaultValue) ? defaultValue[0] : defaultValue

  return (
    <input
      type="range"
      className={`w-full ${className || ""}`}
      ref={ref}
      value={currentValue}
      defaultValue={currentDefault}
      min={min}
      max={max}
      step={step}
      onChange={(event) => {
        const nextValue = Number(event.target.value)
        onChange?.(event)
        onValueChange?.([nextValue])
      }}
      {...props}
    />
  )
})
Slider.displayName = "Slider"

export { Slider }
