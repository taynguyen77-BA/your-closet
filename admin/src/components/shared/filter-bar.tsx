"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface FilterBarProps {
  placeholder?: string;
  onSearch?: (value: string) => void;
  actions?: React.ReactNode;
}

export function FilterBar({
  placeholder = "Tìm kiếm...",
  onSearch,
  actions,
}: FilterBarProps) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative max-w-sm flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          className="pl-9"
          onChange={(e) => onSearch?.(e.target.value)}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {actions}
        <Button variant="outline" size="sm">
          Bộ lọc
        </Button>
        <Button variant="outline" size="sm">
          Xuất
        </Button>
      </div>
    </div>
  );
}
