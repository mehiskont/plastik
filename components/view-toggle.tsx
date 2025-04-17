"use client"

import { Grid, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

interface ViewToggleProps {
  viewMode: string
  onViewModeChange: (value: string) => void
}

export function ViewToggle({ viewMode, onViewModeChange }: ViewToggleProps) {
  return (
    <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && onViewModeChange(value)}>
      <ToggleGroupItem value="grid" aria-label="Grid view" className="p-2">
        <Grid className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="list" aria-label="List view" className="p-2">
        <List className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  )
}