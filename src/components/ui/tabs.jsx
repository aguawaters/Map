import * as React from "react"

const TabsContext = React.createContext(null)

const Tabs = ({ value, defaultValue, onValueChange, children, ...props }) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue)
  const selectedValue = value ?? internalValue

  const selectValue = React.useCallback((nextValue) => {
    if (value === undefined) setInternalValue(nextValue)
    onValueChange?.(nextValue)
  }, [onValueChange, value])

  return (
    <TabsContext.Provider value={{ selectedValue, selectValue }}>
      <div {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

const TabsList = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={`inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground ${className}`}
    {...props}
  />
))
TabsList.displayName = "TabsList"

const TabsTrigger = React.forwardRef(({ className, value, onClick, ...props }, ref) => {
  const context = React.useContext(TabsContext)
  const active = context?.selectedValue === value

  return (
    <button
      ref={ref}
      type="button"
      data-state={active ? "active" : "inactive"}
      aria-selected={active}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm ${className}`}
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) context?.selectValue(value)
      }}
      {...props}
    />
  )
})
TabsTrigger.displayName = "TabsTrigger"

const TabsContent = React.forwardRef(({ className, value, ...props }, ref) => {
  const context = React.useContext(TabsContext)
  const active = context?.selectedValue === value

  return (
    <div
      ref={ref}
      hidden={!active}
      data-state={active ? "active" : "inactive"}
      className={`mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${className}`}
      {...props}
    />
  )
})
TabsContent.displayName = "TabsContent"

export { Tabs, TabsList, TabsTrigger, TabsContent }
