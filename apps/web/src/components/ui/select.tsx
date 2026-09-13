import { Select } from '@base-ui/react/select'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ModelSelect({
  value,
  onValueChange,
  items,
}: {
  value: string
  onValueChange: (value: string) => void
  items: Record<string, string>
}) {
  return (
    <Select.Root value={value} onValueChange={(next) => next && onValueChange(next)} items={items}>
      <Select.Trigger
        className={cn(
          'press inline-flex items-center gap-2 rounded-full border border-[var(--rule)] bg-white px-3 py-2 text-xs text-[var(--fg)]',
        )}
      >
        <Select.Value />
        <Select.Icon>
          <ChevronDown className="size-3.5 opacity-60" />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner sideOffset={8} className="z-[60] outline-none">
          <Select.Popup className="select-popup min-w-[var(--anchor-width)] rounded-2xl border border-[var(--rule)] bg-white p-1 shadow-[0_16px_48px_rgba(13,12,11,0.12)]">
            <Select.List>
              {Object.entries(items).map(([id, label]) => (
                <Select.Item
                  key={id}
                  value={id}
                  className="cursor-pointer rounded-xl px-3 py-2 text-sm text-[var(--fg)] outline-none data-[highlighted]:bg-[var(--shade)]"
                >
                  <Select.ItemText>{label}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  )
}
