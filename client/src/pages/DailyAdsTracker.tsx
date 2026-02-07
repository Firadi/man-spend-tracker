import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useStore, type Product, type DailyAdEntry } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Save, CalendarDays, Loader2, Search, DollarSign, TrendingUp, Package, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";

type DateFilter = "today" | "this_week" | "last_week" | "this_month" | "last_month" | "custom";

function getDateRange(filter: DateFilter, customStart?: string, customEnd?: string): { start: Date; end: Date } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (filter) {
    case "today": {
      return { start: today, end: today };
    }
    case "this_week": {
      const day = today.getDay();
      const diff = day === 0 ? 6 : day - 1;
      const start = new Date(today);
      start.setDate(today.getDate() - diff);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return { start, end };
    }
    case "last_week": {
      const day = today.getDay();
      const diff = day === 0 ? 6 : day - 1;
      const thisWeekStart = new Date(today);
      thisWeekStart.setDate(today.getDate() - diff);
      const start = new Date(thisWeekStart);
      start.setDate(thisWeekStart.getDate() - 7);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return { start, end };
    }
    case "this_month": {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return { start, end };
    }
    case "last_month": {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
      return { start, end };
    }
    case "custom": {
      if (customStart && customEnd) {
        return { start: new Date(customStart), end: new Date(customEnd) };
      }
      return { start: today, end: today };
    }
    default:
      return { start: today, end: today };
  }
}

function formatDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

function getDatesInRange(start: Date, end: Date): string[] {
  const dates: string[] = [];
  const current = new Date(start);
  while (current <= end) {
    dates.push(formatDateStr(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return `${dayNames[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`;
}

function DebouncedCell({ value, onChange, disabled, testId }: { value: number; onChange: (val: number) => void; disabled?: boolean; testId?: string }) {
  const [localValue, setLocalValue] = useState(value === 0 ? '' : String(value));
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFocusedRef = useRef(false);

  useEffect(() => {
    if (!isFocusedRef.current) {
      setLocalValue(value === 0 ? '' : String(value));
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalValue(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onChange(parseFloat(val) || 0);
    }, 800);
  };

  const handleBlur = () => {
    isFocusedRef.current = false;
    if (timerRef.current) clearTimeout(timerRef.current);
    onChange(parseFloat(localValue) || 0);
  };

  return (
    <input
      type="number"
      disabled={disabled}
      className="w-full h-9 text-right text-sm font-mono bg-transparent border-none shadow-none focus-visible:ring-0 focus:outline-none rounded-none px-2 text-foreground [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-40 disabled:cursor-not-allowed"
      value={localValue}
      onChange={handleChange}
      onFocus={() => { isFocusedRef.current = true; }}
      onBlur={handleBlur}
      placeholder="0"
      data-testid={testId}
    />
  );
}

export default function DailyAdsTracker() {
  const { products, fetchDailyAds, saveDailyAds, dailyAds, updateProduct } = useStore();
  const { toast } = useToast();
  const [dateFilter, setDateFilter] = useState<DateFilter>("today");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [localData, setLocalData] = useState<Record<string, Record<string, number>>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "Active" | "Draft">("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { start, end } = useMemo(
    () => getDateRange(dateFilter, customStart, customEnd),
    [dateFilter, customStart, customEnd]
  );

  const dates = useMemo(() => getDatesInRange(start, end), [start, end]);
  const startStr = formatDateStr(start);
  const endStr = formatDateStr(end);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchDailyAds(startStr, endStr);
      setLoading(false);
    };
    load();
  }, [startStr, endStr, fetchDailyAds]);

  useEffect(() => {
    const map: Record<string, Record<string, number>> = {};
    for (const entry of dailyAds) {
      if (!map[entry.productId]) map[entry.productId] = {};
      map[entry.productId][entry.date] = entry.amount;
    }
    setLocalData(map);
  }, [dailyAds]);

  const allProducts = useMemo(() => {
    return products.filter(p => p.status === 'Active' || p.status === 'Draft');
  }, [products]);

  const filteredProducts = useMemo(() => {
    let filtered = allProducts;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter(p => p.status === statusFilter);
    }
    return filtered;
  }, [allProducts, searchQuery, statusFilter]);

  const handleCellChange = useCallback((productId: string, date: string, amount: number) => {
    setLocalData(prev => ({
      ...prev,
      [productId]: {
        ...(prev[productId] || {}),
        [date]: amount
      }
    }));
  }, []);

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const entries: DailyAdEntry[] = [];
      for (const productId of Object.keys(localData)) {
        for (const date of Object.keys(localData[productId])) {
          entries.push({
            productId,
            date,
            amount: localData[productId][date] || 0
          });
        }
      }
      if (entries.length > 0) {
        await saveDailyAds(entries);
      }
      toast({ title: "Saved", description: "All daily ads data has been saved." });
    } catch (err) {
      toast({ title: "Error", description: "Failed to save daily ads data.", variant: "destructive" });
    }
    setSaving(false);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredProducts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProducts.map(p => p.id)));
    }
  };

  const handleBulkStatusChange = async (newStatus: "Active" | "Draft") => {
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      await updateProduct(id, { status: newStatus });
    }
    setSelectedIds(new Set());
    toast({ title: "Updated", description: `${ids.length} product(s) set to ${newStatus}.` });
  };

  const getProductTotal = (productId: string): number => {
    const productData = localData[productId] || {};
    return dates.reduce((sum, d) => sum + (productData[d] || 0), 0);
  };

  const getDateTotal = (date: string): number => {
    return filteredProducts.reduce((sum, p) => {
      return sum + ((localData[p.id] || {})[date] || 0);
    }, 0);
  };

  const grandTotal = filteredProducts.reduce((sum, p) => sum + getProductTotal(p.id), 0);
  const activeCount = allProducts.filter(p => p.status === 'Active').length;
  const avgDaily = dates.length > 0 ? grandTotal / dates.length : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">Daily Ads Tracker</h2>
          <p className="text-muted-foreground">Log daily Facebook Ads spend per product.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Select value={dateFilter} onValueChange={(val) => setDateFilter(val as DateFilter)}>
            <SelectTrigger className="w-[180px]" data-testid="select-date-filter">
              <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="this_week">This Week</SelectItem>
              <SelectItem value="last_week">Last Week</SelectItem>
              <SelectItem value="this_month">This Month</SelectItem>
              <SelectItem value="last_month">Last Month</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>

          {dateFilter === "custom" && (
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-[150px] h-9"
                data-testid="input-custom-start"
              />
              <span className="text-muted-foreground text-sm">to</span>
              <Input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-[150px] h-9"
                data-testid="input-custom-end"
              />
            </div>
          )}

          <Button onClick={handleSaveAll} disabled={saving} data-testid="button-save-all">
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save All
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="p-4" data-testid="card-total-spend">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-primary/10">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Spend</p>
              <p className="text-2xl font-bold">${grandTotal.toFixed(2)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4" data-testid="card-avg-daily">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-blue-500/10">
              <TrendingUp className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg. Daily Spend</p>
              <p className="text-2xl font-bold">${avgDaily.toFixed(2)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4" data-testid="card-active-products">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-green-500/10">
              <Package className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Products</p>
              <p className="text-2xl font-bold">{activeCount}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative w-full sm:w-[280px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Filter products..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-products"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as "all" | "Active" | "Draft")}>
            <SelectTrigger className="w-[150px]" data-testid="select-status-filter">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Active">Active Only</SelectItem>
              <SelectItem value="Draft">Draft Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-muted-foreground">{selectedIds.size} selected</span>
            <Button size="sm" variant="outline" onClick={() => handleBulkStatusChange("Active")} data-testid="button-set-active">
              Set Active
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleBulkStatusChange("Draft")} data-testid="button-set-draft">
              Set Draft
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="sticky left-0 z-20 bg-muted/95 backdrop-blur w-[40px] border-r px-2">
                      <Checkbox
                        checked={filteredProducts.length > 0 && selectedIds.size === filteredProducts.length}
                        onCheckedChange={toggleSelectAll}
                        data-testid="checkbox-select-all"
                      />
                    </TableHead>
                    <TableHead className="sticky left-[40px] z-20 bg-muted/95 backdrop-blur min-w-[180px] border-r" data-testid="header-product">
                      Product
                    </TableHead>
                    <TableHead className="sticky left-[220px] z-20 bg-muted/95 backdrop-blur w-[90px] border-r text-center" data-testid="header-status">
                      Status
                    </TableHead>
                    {dates.map(date => (
                      <TableHead key={date} className="text-center min-w-[100px] text-xs whitespace-nowrap" data-testid={`header-date-${date}`}>
                        {formatDateLabel(date)}
                      </TableHead>
                    ))}
                    <TableHead className="text-right min-w-[100px] font-bold border-l" data-testid="header-total">
                      Total
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={dates.length + 4} className="h-24 text-center text-muted-foreground">
                        No products found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((product) => {
                      const isDisabled = product.status === 'Draft';
                      const total = getProductTotal(product.id);
                      return (
                        <TableRow key={product.id} className={isDisabled ? "opacity-60" : ""} data-testid={`row-product-${product.id}`}>
                          <TableCell className="sticky left-0 z-10 bg-card border-r px-2">
                            <Checkbox
                              checked={selectedIds.has(product.id)}
                              onCheckedChange={() => toggleSelect(product.id)}
                              data-testid={`checkbox-product-${product.id}`}
                            />
                          </TableCell>
                          <TableCell className="sticky left-[40px] z-10 bg-card border-r font-medium">
                            <div>{product.name}</div>
                            <div className="text-xs text-muted-foreground font-mono">{product.sku}</div>
                          </TableCell>
                          <TableCell className="sticky left-[220px] z-10 bg-card border-r text-center">
                            <Badge variant={isDisabled ? "secondary" : "default"} className="text-xs">
                              {product.status}
                            </Badge>
                          </TableCell>
                          {dates.map(date => (
                            <TableCell key={date} className="p-0">
                              <DebouncedCell
                                value={(localData[product.id] || {})[date] || 0}
                                onChange={(val) => handleCellChange(product.id, date, val)}
                                disabled={isDisabled}
                                testId={`input-daily-ad-${product.id}-${date}`}
                              />
                            </TableCell>
                          ))}
                          <TableCell className="text-right font-mono font-bold border-l pr-3">
                            {total > 0 ? `$${total.toFixed(2)}` : '-'}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                  {filteredProducts.length > 0 && (
                    <TableRow className="bg-muted/30 font-bold border-t-2">
                      <TableCell className="sticky left-0 z-10 bg-muted/30 border-r" />
                      <TableCell className="sticky left-[40px] z-10 bg-muted/30 border-r">
                        Totals
                      </TableCell>
                      <TableCell className="sticky left-[220px] z-10 bg-muted/30 border-r" />
                      {dates.map(date => {
                        const dateTotal = getDateTotal(date);
                        return (
                          <TableCell key={date} className="text-right font-mono text-sm pr-3">
                            {dateTotal > 0 ? `$${dateTotal.toFixed(2)}` : '-'}
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-right font-mono font-bold border-l pr-3 text-primary">
                        ${grandTotal.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
