import * as React from "react"

const Switch = React.forwardRef(({ className, checked, defaultChecked = false, onCheckedChange, onClick, disabled, ...props }, ref) => {
  const [internalChecked, setInternalChecked] = React.useState(defaultChecked)
  const isChecked = checked ?? internalChecked

  const toggle = React.useCallback(() => {
    const nextChecked = !isChecked
    if (checked === undefined) setInternalChecked(nextChecked)
    onCheckedChange?.(nextChecked)
  }, [checked, isChecked, onCheckedChange])

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isChecked}
      data-state={isChecked ? "checked" : "unchecked"}
      disabled={disabled}
      className={`peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input ${className || ""}`}
      ref={ref}
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented && !disabled) toggle()
      }}
      {...props}
    >
      <span data-state={isChecked ? "checked" : "unchecked"} className="pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0" />
    </button>
  )
})
Switch.displayName = "Switch"

export { Switch }
