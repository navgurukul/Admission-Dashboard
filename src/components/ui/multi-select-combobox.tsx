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
import { Checkbox } from "@/components/ui/checkbox"

export interface MultiSelectComboboxOption {
    value: string
    label: string
}

interface MultiSelectComboboxProps {
    options: MultiSelectComboboxOption[]
    value: string[]
    onValueChange: (value: string[]) => void
    placeholder?: string
    searchPlaceholder?: string
    emptyText?: string
    disabled?: boolean
    className?: string
    onOpen?: () => void
}

export const MultiSelectCombobox = React.memo(function MultiSelectCombobox({
    options,
    value = [],
    onValueChange,
    placeholder = "Select options...",
    searchPlaceholder = "Search...",
    emptyText = "No option found.",
    disabled = false,
    className,
    onOpen,
}: MultiSelectComboboxProps) {
    const [open, setOpen] = React.useState(false)
    const [searchQuery, setSearchQuery] = React.useState("")

    const safeValue = Array.isArray(value) ? value : []

    // Filter options based on search query
    const filteredOptions = React.useMemo(() => {
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
            if (currentValue === "all") {
                const allValues = options
                    .filter(opt => opt.value !== "all")
                    .map(opt => opt.value)

                const isAllSelected = safeValue.length === allValues.length
                onValueChange(isAllSelected ? [] : allValues)
            } else {
                const newValue = safeValue.includes(currentValue)
                    ? safeValue.filter((v) => v !== currentValue)
                    : [...safeValue, currentValue]
                onValueChange(newValue)
            }
        },
        [safeValue, onValueChange, options]
    )

    const handleOpenChange = React.useCallback((newOpen: boolean) => {
        setOpen(newOpen)
        if (!newOpen) {
            setSearchQuery("")
        } else if (onOpen) {
            onOpen()
        }
    }, [onOpen])

    const handleClear = React.useCallback((e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        onValueChange([])
    }, [onValueChange])

    const displayLabel = React.useMemo(() => {
        if (safeValue.length === 0) return placeholder
        if (safeValue.length === 1) {
            const opt = options.find(o => o.value === safeValue[0])
            return opt ? opt.label : placeholder
        }
        return `${safeValue.length} items selected`
    }, [safeValue, options, placeholder])

    const isAllSelected = React.useMemo(() => {
        const listOptions = options.filter(opt => opt.value !== "all")
        return listOptions.length > 0 && safeValue.length === listOptions.length
    }, [options, safeValue])

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "w-full justify-between h-8 border-0 shadow-none hover:bg-muted/50 focus:ring-1 focus:ring-ring text-left font-normal",
                        safeValue.length === 0 && "text-muted-foreground",
                        disabled && "opacity-50 cursor-not-allowed",
                        className
                    )}
                    disabled={disabled}
                >
                    <span className="truncate flex-1">
                        {displayLabel}
                    </span>
                    <div className="flex items-center gap-1 ml-2 shrink-0">
                        {safeValue.length > 0 && !disabled && (
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
                    <CommandList className="max-h-[300px] overflow-y-auto overflow-x-hidden">
                        <CommandEmpty>{emptyText}</CommandEmpty>
                        <CommandGroup>
                            {options.some(opt => opt.value === "all") && (
                                <CommandItem
                                    value="all"
                                    onSelect={() => handleSelect("all")}
                                    className="cursor-pointer font-semibold border-b"
                                >
                                    <div className="flex items-center w-full">
                                        <Checkbox
                                            checked={isAllSelected}
                                            className="mr-2"
                                            onCheckedChange={() => { }}
                                        />
                                        <span className="flex-1">Select All</span>
                                    </div>
                                </CommandItem>
                            )}
                            {filteredOptions.filter(opt => opt.value !== "all").map((option) => {
                                const isSelected = safeValue.includes(option.value)
                                return (
                                    <CommandItem
                                        key={option.value}
                                        value={option.label}
                                        onSelect={() => handleSelect(option.value)}
                                        className="cursor-pointer"
                                    >
                                        <div className="flex items-center w-full">
                                            <Checkbox
                                                checked={isSelected}
                                                className="mr-2"
                                                onCheckedChange={() => { }}
                                            />
                                            <span className="flex-1 truncate">{option.label}</span>
                                            {isSelected && <Check className="ml-auto h-4 w-4 opacity-70" />}
                                        </div>
                                    </CommandItem>
                                )
                            })}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
})
