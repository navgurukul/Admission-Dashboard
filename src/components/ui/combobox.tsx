"use client"

import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface ComboboxOption {
  value: string
  label: string
}

interface ComboboxProps {
  options: ComboboxOption[]
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
  className?: string
  onOpen?: () => void
}

export const Combobox = React.memo(function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  emptyText = "No option found.",
  disabled = false,
  className,
  onOpen,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")

  const selectedOption = React.useMemo(
    () => options.find((option) => option.value === value),
    [options, value]
  )

  // Filter options based on search query - memoized for performance
  const filteredOptions = React.useMemo(() => {
    // Filter out any invalid options first
    const validOptions = options.filter(
      (option) => option && option.value !== undefined && option.label !== undefined && option.label !== null
    )
    
    if (!searchQuery) return validOptions
    
    const query = searchQuery.toLowerCase()
    return validOptions.filter((option) =>
      option.label.toLowerCase().includes(query)
    )
  }, [options, searchQuery])

  const handleSelect = React.useCallback(
    (currentValue: string) => {
      onValueChange(currentValue === value ? "" : currentValue)
      setOpen(false)
      setSearchQuery("")
    },
    [value, onValueChange]
  )

  const handleOpenChange = React.useCallback((newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      setSearchQuery("")
    } else if (onOpen) {
      // Call onOpen callback when dropdown opens
      onOpen()
    }
  }, [onOpen])

  const handleClear = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onValueChange("")
  }, [onValueChange])

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between h-8 border-0 shadow-none hover:bg-muted/50 focus:ring-1 focus:ring-ring",
            !value && "text-muted-foreground",
            disabled && "opacity-50 cursor-not-allowed",
            className
          )}
          disabled={disabled}
        >
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <div className="flex items-center gap-1 ml-2 shrink-0">
            {value && !disabled && (
              <div
                className="h-4 w-4 shrink-0 opacity-50 hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center"
                onClick={handleClear}
                onMouseDown={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
              >
                <X className="h-3.5 w-3.5" />
              </div>
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder={searchPlaceholder}
            value={searchQuery}
            onValueChange={setSearchQuery}
            className="h-9"
          />
          <CommandList 
            className="max-h-[300px] overflow-y-auto overflow-x-hidden"
            style={{ overscrollBehavior: 'contain' }}
            onWheel={(e) => {
              e.stopPropagation();
            }}
          >
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup className="overflow-visible">
              {filteredOptions.map((option) => {
                // Additional safety check - ensure label is a string
                const safeLabel = String(option.label || '');
                const safeValue = String(option.value || '');
                
                return (
                  <CommandItem
                    key={safeValue}
                    value={safeValue}
                    keywords={safeLabel ? [safeLabel] : []}
                    onSelect={handleSelect}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {safeLabel}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
})
