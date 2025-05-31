import * as React from "react"
import { Check, ChevronDown, X } from "lucide-react"

import { cn } from "@/lib/utils"

type Option = {
  value: string
  label: string
}

type MultiSelectProps = {
  options: Option[]
  selectedValues?: string[]
  onChange?: (selectedValues: string[]) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  //size?: "sm" | "default"
}

function MultiSelect({
  options,
  selectedValues = [],
  onChange,
  placeholder = "Chọn các mục...",
  disabled = false,
  className,
  //size = "default",
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [selected, setSelected] = React.useState<string[]>(selectedValues)
  const [searchTerm, setSearchTerm] = React.useState("")
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    setSelected(selectedValues)
  }, [selectedValues])

  React.useEffect(() => {
    // Handle clicks outside of the component to close dropdown
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleOutsideClick)
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick)
    }
  }, [])

  const toggleOption = (value: string) => {
    const newSelected = selected.includes(value)
      ? selected.filter(item => item !== value)
      : [...selected, value]
    
    setSelected(newSelected)
    onChange?.(newSelected)
  }

  const removeOption = (value: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const newSelected = selected.filter(item => item !== value)
    setSelected(newSelected)
    onChange?.(newSelected)
  }

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation()
    setSelected([])
    onChange?.([])
  }

  const filteredOptions = options.filter(option => 
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div ref={containerRef} className="relative w-full" data-slot="multi-select">
      <div 
        data-slot="multi-select-trigger"
        //data-size={size}
        className={cn(
          "border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-full items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8",
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
          className
        )}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className="flex flex-wrap gap-1 flex-1">
          {selected.length === 0 ? (
            <span className="text-muted-foreground">{placeholder}</span>
          ) : (
            selected.map(value => {
              const option = options.find(opt => opt.value === value)
              return (
                <span 
                  key={value} 
                  className="flex items-center gap-1 rounded-md bg-accent px-2 py-1 text-xs"
                >
                  {option?.label}
                  {!disabled && (
                    <X 
                      className="size-3.5 cursor-pointer text-muted-foreground hover:text-foreground"
                      onClick={(e) => removeOption(value, e)}
                    />
                  )}
                </span>
              )
            })
          )}
          {selected.length > 0 && !disabled && (
            <button 
              onClick={clearAll}
              className="ml-1 text-xs text-destructive hover:text-foreground"
            >
              Xóa tất cả
            </button>
          )}
        </div>
        <ChevronDown className={cn("size-4 opacity-50 transition-transform", isOpen && "rotate-180")} />
      </div>
      
      {isOpen && !disabled && (
        <div 
          data-slot="multi-select-content"
          className="bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 absolute z-50 mt-1 w-full min-w-[8rem] overflow-hidden rounded-md border shadow-md"
        >
          <div className="p-2">
            <input
              type="text"
              data-slot="multi-select-search"
              className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Tìm kiếm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          
          <ul className="max-h-60 overflow-auto p-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(option => (
                <li
                  key={option.value}
                  data-slot="multi-select-item"
                  className={cn(
                    "focus:bg-accent focus:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground hover:bg-accent relative flex w-full cursor-default items-center justify-between rounded-sm py-1.5 px-2 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
                    selected.includes(option.value) ? "bg-accent/50" : ""
                  )}
                  onClick={() => toggleOption(option.value)}
                >
                  <span>{option.label}</span>
                  {selected.includes(option.value) && (
                    <Check className="size-4 text-primary" />
                  )}
                </li>
              ))
            ) : (
              <li className="px-2 py-1.5 text-sm text-muted-foreground">Không tìm thấy kết quả</li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

export { MultiSelect }
