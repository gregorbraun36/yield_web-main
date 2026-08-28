import React from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const TableFilterBar = ({
  query,
  setQuery,
  queryPlaceholder = 'Suche...',
  rightSlot,
  onRefresh,
  refreshing = false,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col lg:flex-row gap-3 justify-between shadow-sm">
      <div className="relative min-w-[260px]">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={queryPlaceholder}
          className="pl-9"
        />
      </div>
      <div className="flex items-center gap-2">
        {rightSlot}
        <Button variant="outline" onClick={onRefresh} className="gap-2" disabled={refreshing}>
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Aktualisieren
        </Button>
      </div>
    </div>
  );
};

export default TableFilterBar;
