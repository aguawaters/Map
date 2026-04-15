import * as React from "react"

const ScrollArea = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={`relative overflow-auto ${className || ""}`}
    {...props}
  />
))
ScrollArea.displayName = "ScrollArea"

export { ScrollArea }
