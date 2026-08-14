"use client"

import * as React from "react"
import { Popover as PopoverPrimitive } from "radix-ui"
import { CheckIcon, ChevronsUpDownIcon, SearchIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

export interface ComboboxOption {
  value: string
  label: string
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Selecione...",
  searchPlaceholder = "Buscar...",
  emptyText = "Nenhum resultado.",
  className,
}: {
  options: ComboboxOption[]
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  className?: string
}) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const selected = options.find((option) => option.value === value)
  const term = search.trim().toLowerCase()
  const filtered = term
    ? options.filter((option) => option.label.toLowerCase().includes(term))
    : options

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) setSearch("")
  }

  function handleSelect(optionValue: string) {
    onValueChange(optionValue)
    handleOpenChange(false)
  }

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          data-slot="combobox-trigger"
          className={cn(
            "flex h-8 w-full min-w-0 items-center justify-between gap-2 rounded-full border border-input bg-transparent px-3 py-1 text-base whitespace-nowrap transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20 md:text-sm dark:bg-input/30",
            !selected && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate">{selected?.label ?? placeholder}</span>
          <ChevronsUpDownIcon className="size-4 shrink-0 text-muted-foreground opacity-50" />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          data-slot="combobox-content"
          align="start"
          sideOffset={4}
          className="z-[60] min-w-56 overflow-hidden rounded-lg bg-popover text-popover-foreground shadow-lg ring-1 ring-foreground/10 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
        >
          <div className="relative border-b border-border p-1.5">
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={searchPlaceholder}
              className="pl-9"
            />
          </div>
          <div className="max-h-60 overflow-y-auto p-1">
            {filtered.length === 0 && (
              <p className="px-2 py-4 text-center text-sm text-muted-foreground">
                {emptyText}
              </p>
            )}
            {filtered.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
              >
                <CheckIcon
                  className={cn(
                    "size-4 shrink-0",
                    option.value === value ? "opacity-100" : "opacity-0"
                  )}
                />
                <span className="truncate">{option.label}</span>
              </button>
            ))}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}
