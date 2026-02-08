import { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useStore } from "@/lib/store";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eye, Trash2, History, Search, AlertCircle, Pencil, ShoppingCart, TrendingUp, CheckCircle, Truck, Target, DollarSign, BarChart3, Percent, Filter, Globe, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SnapshotRow {
  productId: string;
  productName: string;
  productSku: string;
  totalOrders: number;
  ordersConfirmed: number;
  confirmationRate: number;
  deliveredOrders: number;
  deliveryRate: number;
  deliveryRatePerLead: number;
  revenue: number;
  ads: number;
  serviceFees: number;
  quantityDelivery: number;
  productFees: number;
  profit: number;
  margin: number;
}

interface AnalysisSnapshot {
  id: string;
  periodName: string;
  countryId: string;
  countryName: string;
  currency: string;
  snapshotData: SnapshotRow[];
  totalOrders: number;
  ordersConfirmed: number;
  deliveredOrders: number;
  totalRevenue: number;
  totalAds: number;
  totalServiceFees: number;
  totalProductFees: number;
  profit: number;
  margin: number;
  createdAt: string;
}

type SortDirection = "asc" | "desc" | null;

interface SortConfig {
  key: string;
  direction: SortDirection;
}

function SortableHeader({ label, sortKey, currentSort, onSort, className }: {
  label: string;
  sortKey: string;
  currentSort: SortConfig;
  onSort: (key: string) => void;
  className?: string;
}) {
  const isActive = currentSort.key === sortKey;
  return (
    <TableHead
      className={cn("cursor-pointer select-none group hover:bg-muted/80 transition-colors", className)}
      onClick={() => onSort(sortKey)}
      data-testid={`sort-${sortKey}`}
    >
      <div className={cn("flex items-center gap-1", className?.includes("text-right") && "justify-end")}>
        <span className="whitespace-nowrap">{label}</span>
        <span className={cn("transition-opacity", isActive ? "opacity-100" : "opacity-0 group-hover:opacity-40")}>
          {isActive && currentSort.direction === "asc" ? (
            <ArrowUp className="h-3.5 w-3.5" />
          ) : isActive && currentSort.direction === "desc" ? (
            <ArrowDown className="h-3.5 w-3.5" />
          ) : (
            <ArrowUpDown className="h-3.5 w-3.5" />
          )}
        </span>
      </div>
    </TableHead>
  );
}

function useSorting<T>(data: T[], defaultSort?: SortConfig) {
  const [sort, setSort] = useState<SortConfig>(defaultSort || { key: "", direction: null });

  const handleSort = useCallback((key: string) => {
    setSort(prev => {
      if (prev.key !== key) return { key, direction: "desc" };
      if (prev.direction === "desc") return { key, direction: "asc" };
      return { key: "", direction: null };
    });
  }, []);

  const sorted = useMemo(() => {
    if (!sort.key || !sort.direction) return data;
    return [...data].sort((a, b) => {
      const aVal = (a as any)[sort.key];
      const bVal = (b as any)[sort.key];
      if (typeof aVal === "string") {
        return sort.direction === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sort.direction === "asc" ? aVal - bVal : bVal - aVal;
    });
  }, [data, sort]);

  return { sort, handleSort, sorted };
}

export default function AnalysisHistory() {
  const [snapshots, setSnapshots] = useState<AnalysisSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewSnapshot, setViewSnapshot] = useState<AnalysisSnapshot | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { setEditingSnapshot } = useStore();

  const fetchSnapshots = async () => {
    try {
      const res = await apiRequest("GET", "/api/analysis-snapshots");
      const data = await res.json();
      setSnapshots(data);
    } catch (error) {
      console.error("Failed to fetch snapshots:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSnapshots();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await apiRequest("DELETE", `/api/analysis-snapshots/${id}`);
      setSnapshots(prev => prev.filter(s => s.id !== id));
      toast({ title: "Deleted", description: "Snapshot deleted." });
    } catch (error) {
      toast({ title: "Error", description: "Could not delete snapshot.", variant: "destructive" });
    }
  };

  const handleEdit = (snapshot: AnalysisSnapshot) => {
    setEditingSnapshot({
      id: snapshot.id,
      periodName: snapshot.periodName,
      countryId: snapshot.countryId,
      countryName: snapshot.countryName,
      currency: snapshot.currency,
      snapshotData: snapshot.snapshotData.map(row => ({
        productId: row.productId,
        productName: row.productName,
        productSku: row.productSku,
        totalOrders: row.totalOrders,
        ordersConfirmed: row.ordersConfirmed,
        deliveredOrders: row.deliveredOrders,
        revenue: row.revenue,
        ads: row.ads,
        serviceFees: row.serviceFees,
        quantityDelivery: row.quantityDelivery,
        productFees: row.productFees,
      })),
    });
    setLocation("/analyse");
  };

  const availableCountries = useMemo(() => {
    const countryMap = new Map<string, { id: string; name: string }>();
    snapshots.forEach(s => {
      if (!countryMap.has(s.countryId)) {
        countryMap.set(s.countryId, { id: s.countryId, name: s.countryName });
      }
    });
    return Array.from(countryMap.values());
  }, [snapshots]);

  const baseFilteredSnapshots = useMemo(() => {
    return snapshots.filter(s => {
      if (countryFilter !== "all" && s.countryId !== countryFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!s.periodName.toLowerCase().includes(q) && !s.countryName.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [snapshots, countryFilter, searchQuery]);

  const filteredSnapshots = useMemo(() => {
    if (selectedIds.size === 0) return baseFilteredSnapshots;
    return baseFilteredSnapshots.filter(s => selectedIds.has(s.id));
  }, [baseFilteredSnapshots, selectedIds]);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAllVisible = () => {
    const visibleIds = baseFilteredSnapshots.map(s => s.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every(id => selectedIds.has(id));
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(visibleIds));
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  const summaryTotals = useMemo(() => {
    if (filteredSnapshots.length === 0) return null;
    const t = filteredSnapshots.reduce((acc, s) => ({
      totalOrders: acc.totalOrders + s.totalOrders,
      ordersConfirmed: acc.ordersConfirmed + s.ordersConfirmed,
      deliveredOrders: acc.deliveredOrders + s.deliveredOrders,
      totalAds: acc.totalAds + s.totalAds,
      profit: acc.profit + s.profit,
      totalRevenue: acc.totalRevenue + s.totalRevenue,
      totalServiceFees: acc.totalServiceFees + s.totalServiceFees,
      totalProductFees: acc.totalProductFees + s.totalProductFees,
    }), { totalOrders: 0, ordersConfirmed: 0, deliveredOrders: 0, totalAds: 0, profit: 0, totalRevenue: 0, totalServiceFees: 0, totalProductFees: 0 });

    const confirmationRate = t.totalOrders > 0 ? (t.ordersConfirmed / t.totalOrders) * 100 : 0;
    const deliveryRate = t.ordersConfirmed > 0 ? (t.deliveredOrders / t.ordersConfirmed) * 100 : 0;
    const cpa = t.totalOrders > 0 ? t.totalAds / t.totalOrders : 0;
    const cpad = t.deliveredOrders > 0 ? t.totalAds / t.deliveredOrders : 0;
    const cpd = t.deliveredOrders > 0 ? (t.totalAds + t.totalServiceFees + t.totalProductFees) / t.deliveredOrders : 0;

    const currency = filteredSnapshots[0]?.currency || "USD";

    return { ...t, confirmationRate, deliveryRate, cpa, cpad, cpd, currency };
  }, [filteredSnapshots]);

  const countrySummary = useMemo(() => {
    if (filteredSnapshots.length === 0) return [];
    const map = new Map<string, {
      countryId: string;
      countryName: string;
      currency: string;
      totalOrders: number;
      ordersConfirmed: number;
      deliveredOrders: number;
      totalRevenue: number;
      totalAds: number;
      totalServiceFees: number;
      totalProductFees: number;
      profit: number;
    }>();

    filteredSnapshots.forEach(s => {
      const existing = map.get(s.countryId);
      if (existing) {
        existing.totalOrders += s.totalOrders;
        existing.ordersConfirmed += s.ordersConfirmed;
        existing.deliveredOrders += s.deliveredOrders;
        existing.totalRevenue += s.totalRevenue;
        existing.totalAds += s.totalAds;
        existing.totalServiceFees += s.totalServiceFees;
        existing.totalProductFees += s.totalProductFees;
        existing.profit += s.profit;
      } else {
        map.set(s.countryId, {
          countryId: s.countryId,
          countryName: s.countryName,
          currency: s.currency,
          totalOrders: s.totalOrders,
          ordersConfirmed: s.ordersConfirmed,
          deliveredOrders: s.deliveredOrders,
          totalRevenue: s.totalRevenue,
          totalAds: s.totalAds,
          totalServiceFees: s.totalServiceFees,
          totalProductFees: s.totalProductFees,
          profit: s.profit,
        });
      }
    });

    return Array.from(map.values()).map(c => ({
      ...c,
      confirmationRate: c.totalOrders > 0 ? (c.ordersConfirmed / c.totalOrders) * 100 : 0,
      deliveryRate: c.ordersConfirmed > 0 ? (c.deliveredOrders / c.ordersConfirmed) * 100 : 0,
      margin: c.totalRevenue > 0 ? (c.profit / c.totalRevenue) * 100 : 0,
    }));
  }, [filteredSnapshots]);

  const countrySort = useSorting(countrySummary, { key: "profit", direction: "desc" });

  const periodsWithExtra = useMemo(() => {
    return filteredSnapshots.map(s => ({
      ...s,
      confirmationRate: s.totalOrders > 0 ? (s.ordersConfirmed / s.totalOrders) * 100 : 0,
      deliveryRate: s.ordersConfirmed > 0 ? (s.deliveredOrders / s.ordersConfirmed) * 100 : 0,
      createdAtTs: new Date(s.createdAt).getTime(),
    }));
  }, [filteredSnapshots]);

  const periodSort = useSorting(periodsWithExtra, { key: "createdAtTs", direction: "desc" });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh] text-muted-foreground">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <History className="h-8 w-8" />
            Dashboard
          </h2>
          <p className="text-muted-foreground">Saved analysis snapshots for different periods.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Select value={countryFilter} onValueChange={setCountryFilter}>
            <SelectTrigger className="w-[180px]" data-testid="select-country-filter">
              <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="All Countries" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Countries</SelectItem>
              {availableCountries.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative w-full sm:w-[250px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search periods..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search-history"
            />
          </div>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-2.5 px-4 bg-blue-50 border border-blue-200 rounded-lg shadow-sm" data-testid="selection-indicator">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-sm font-medium text-blue-800">
            {selectedIds.size} period{selectedIds.size > 1 ? 's' : ''} selected
          </span>
          <Button variant="ghost" size="sm" className="h-7 text-xs text-blue-600 hover:text-blue-800" onClick={clearSelection} data-testid="button-clear-selection">
            Clear
          </Button>
        </div>
      )}

      {summaryTotals && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {[
            { icon: DollarSign, label: "Total Profit", value: formatCurrency(summaryTotals.profit, summaryTotals.currency), color: summaryTotals.profit >= 0 ? "text-green-600" : "text-red-600", id: "total-profit" },
            { icon: ShoppingCart, label: "Total Orders", value: formatNumber(summaryTotals.totalOrders), id: "total-orders" },
            { icon: CheckCircle, label: "Confirmed", value: formatNumber(summaryTotals.ordersConfirmed), id: "confirmed" },
            { icon: Truck, label: "Delivered", value: formatNumber(summaryTotals.deliveredOrders), id: "delivered" },
            { icon: Percent, label: "Conf. Rate", value: `${summaryTotals.confirmationRate.toFixed(1)}%`, id: "conf-rate" },
            { icon: TrendingUp, label: "Del. Rate", value: `${summaryTotals.deliveryRate.toFixed(1)}%`, id: "del-rate" },
            { icon: BarChart3, label: "Total Spend", value: formatCurrency(summaryTotals.totalAds, summaryTotals.currency), id: "total-spend" },
            { icon: Target, label: "CPA", value: summaryTotals.cpa > 0 ? formatCurrency(summaryTotals.cpa, summaryTotals.currency) : '-', id: "cpa" },
            { icon: Target, label: "CPAD", value: summaryTotals.cpad > 0 ? formatCurrency(summaryTotals.cpad, summaryTotals.currency) : '-', id: "cpad" },
            { icon: Target, label: "CPD", value: summaryTotals.cpd > 0 ? formatCurrency(summaryTotals.cpd, summaryTotals.currency) : '-', id: "cpd" },
          ].map(card => (
            <Card key={card.id} className="p-3 shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-primary/20" data-testid={`card-${card.id}`}>
              <div className="flex items-center gap-2 mb-1">
                <card.icon className="h-4 w-4 text-primary/60" />
                <p className="text-xs font-medium text-muted-foreground">{card.label}</p>
              </div>
              <p className={cn("text-lg font-bold", card.color || "")}>{card.value}</p>
            </Card>
          ))}
        </div>
      )}

      {countrySort.sorted.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary/60" />
            Country Summary
          </h3>
          <Card className="shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-muted/60 to-muted/30 hover:from-muted/60 hover:to-muted/30">
                    <SortableHeader label="Country" sortKey="countryName" currentSort={countrySort.sort} onSort={countrySort.handleSort} className="min-w-[140px]" />
                    <SortableHeader label="Orders" sortKey="totalOrders" currentSort={countrySort.sort} onSort={countrySort.handleSort} className="text-right w-[100px]" />
                    <SortableHeader label="Confirmed" sortKey="ordersConfirmed" currentSort={countrySort.sort} onSort={countrySort.handleSort} className="text-right w-[100px]" />
                    <SortableHeader label="Conf. %" sortKey="confirmationRate" currentSort={countrySort.sort} onSort={countrySort.handleSort} className="text-right w-[90px]" />
                    <SortableHeader label="Delivered" sortKey="deliveredOrders" currentSort={countrySort.sort} onSort={countrySort.handleSort} className="text-right w-[100px]" />
                    <SortableHeader label="Del. %" sortKey="deliveryRate" currentSort={countrySort.sort} onSort={countrySort.handleSort} className="text-right w-[90px]" />
                    <SortableHeader label="Ads Spend" sortKey="totalAds" currentSort={countrySort.sort} onSort={countrySort.handleSort} className="text-right w-[110px]" />
                    <SortableHeader label="Revenue" sortKey="totalRevenue" currentSort={countrySort.sort} onSort={countrySort.handleSort} className="text-right w-[110px]" />
                    <SortableHeader label="Profit" sortKey="profit" currentSort={countrySort.sort} onSort={countrySort.handleSort} className="text-right w-[110px]" />
                    <SortableHeader label="Margin" sortKey="margin" currentSort={countrySort.sort} onSort={countrySort.handleSort} className="text-right w-[80px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {countrySort.sorted.map((c, idx) => (
                    <TableRow
                      key={c.countryId}
                      className={cn(
                        "transition-colors hover:bg-muted/40",
                        idx % 2 === 0 ? "bg-background" : "bg-muted/10"
                      )}
                      data-testid={`row-country-summary-${c.countryId}`}
                    >
                      <TableCell className="font-semibold">{c.countryName}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatNumber(c.totalOrders)}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatNumber(c.ordersConfirmed)}</TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        <span className={cn(
                          "inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium",
                          c.confirmationRate >= 50 ? "bg-green-50 text-green-700" : c.confirmationRate >= 30 ? "bg-yellow-50 text-yellow-700" : "bg-red-50 text-red-700"
                        )}>
                          {c.confirmationRate.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatNumber(c.deliveredOrders)}</TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        <span className={cn(
                          "inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium",
                          c.deliveryRate >= 80 ? "bg-green-50 text-green-700" : c.deliveryRate >= 50 ? "bg-yellow-50 text-yellow-700" : "bg-red-50 text-red-700"
                        )}>
                          {c.deliveryRate.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatCurrency(c.totalAds, c.currency)}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatCurrency(c.totalRevenue, c.currency)}</TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        <span className={cn("font-semibold", c.profit >= 0 ? "text-green-600" : "text-red-600")}>
                          {formatCurrency(c.profit, c.currency)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        <span className={cn(
                          "inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium",
                          c.margin >= 20 ? "bg-green-50 text-green-700" : c.margin >= 0 ? "bg-yellow-50 text-yellow-700" : "bg-red-50 text-red-700"
                        )}>
                          {c.margin.toFixed(1)}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      )}

      {filteredSnapshots.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[40vh] text-muted-foreground">
          <AlertCircle className="w-10 h-10 mb-4" />
          <p>{snapshots.length === 0 ? "No saved analysis snapshots yet. Go to Analyse and click 'Save Data' to create one." : "No snapshots match your search."}</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <History className="h-5 w-5 text-primary/60" />
            Periods
          </h3>
          <Card className="shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-muted/60 to-muted/30 hover:from-muted/60 hover:to-muted/30">
                    <TableHead className="w-[40px] px-2">
                      <Checkbox
                        checked={baseFilteredSnapshots.length > 0 && baseFilteredSnapshots.every(s => selectedIds.has(s.id))}
                        onCheckedChange={toggleAllVisible}
                        data-testid="checkbox-select-all"
                      />
                    </TableHead>
                    <SortableHeader label="Period" sortKey="periodName" currentSort={periodSort.sort} onSort={periodSort.handleSort} className="min-w-[180px]" />
                    <SortableHeader label="Country" sortKey="countryName" currentSort={periodSort.sort} onSort={periodSort.handleSort} className="min-w-[120px]" />
                    <SortableHeader label="Orders" sortKey="totalOrders" currentSort={periodSort.sort} onSort={periodSort.handleSort} className="text-right w-[90px]" />
                    <SortableHeader label="Confirmed" sortKey="ordersConfirmed" currentSort={periodSort.sort} onSort={periodSort.handleSort} className="text-right w-[100px]" />
                    <SortableHeader label="Conf. %" sortKey="confirmationRate" currentSort={periodSort.sort} onSort={periodSort.handleSort} className="text-right w-[85px]" />
                    <SortableHeader label="Delivered" sortKey="deliveredOrders" currentSort={periodSort.sort} onSort={periodSort.handleSort} className="text-right w-[100px]" />
                    <SortableHeader label="Del. %" sortKey="deliveryRate" currentSort={periodSort.sort} onSort={periodSort.handleSort} className="text-right w-[85px]" />
                    <SortableHeader label="Revenue" sortKey="totalRevenue" currentSort={periodSort.sort} onSort={periodSort.handleSort} className="text-right w-[110px]" />
                    <SortableHeader label="Profit" sortKey="profit" currentSort={periodSort.sort} onSort={periodSort.handleSort} className="text-right w-[110px]" />
                    <SortableHeader label="Margin" sortKey="margin" currentSort={periodSort.sort} onSort={periodSort.handleSort} className="text-right w-[80px]" />
                    <SortableHeader label="Date" sortKey="createdAtTs" currentSort={periodSort.sort} onSort={periodSort.handleSort} className="text-right w-[100px]" />
                    <TableHead className="text-right w-[110px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {periodSort.sorted.map((snapshot, idx) => (
                    <TableRow
                      key={snapshot.id}
                      className={cn(
                        "transition-colors hover:bg-muted/40",
                        idx % 2 === 0 ? "bg-background" : "bg-muted/10",
                        selectedIds.has(snapshot.id) && "bg-blue-50/50 hover:bg-blue-50/70"
                      )}
                      data-testid={`row-snapshot-${snapshot.id}`}
                    >
                      <TableCell className="px-2">
                        <Checkbox
                          checked={selectedIds.has(snapshot.id)}
                          onCheckedChange={() => toggleSelection(snapshot.id)}
                          data-testid={`checkbox-snapshot-${snapshot.id}`}
                        />
                      </TableCell>
                      <TableCell className="font-semibold">{snapshot.periodName}</TableCell>
                      <TableCell>
                        <span className="text-muted-foreground text-sm">{snapshot.countryName}</span>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatNumber(snapshot.totalOrders)}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatNumber(snapshot.ordersConfirmed)}</TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        <span className={cn(
                          "inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium",
                          snapshot.confirmationRate >= 50 ? "bg-green-50 text-green-700" : snapshot.confirmationRate >= 30 ? "bg-yellow-50 text-yellow-700" : "bg-red-50 text-red-700"
                        )}>
                          {snapshot.confirmationRate.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatNumber(snapshot.deliveredOrders)}</TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        <span className={cn(
                          "inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium",
                          snapshot.deliveryRate >= 80 ? "bg-green-50 text-green-700" : snapshot.deliveryRate >= 50 ? "bg-yellow-50 text-yellow-700" : "bg-red-50 text-red-700"
                        )}>
                          {snapshot.deliveryRate.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatCurrency(snapshot.totalRevenue, snapshot.currency)}</TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        <span className={cn("font-semibold", snapshot.profit >= 0 ? "text-green-600" : "text-red-600")}>
                          {formatCurrency(snapshot.profit, snapshot.currency)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        <span className={cn(
                          "inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium",
                          snapshot.margin >= 20 ? "bg-green-50 text-green-700" : snapshot.margin >= 0 ? "bg-yellow-50 text-yellow-700" : "bg-red-50 text-red-700"
                        )}>
                          {snapshot.margin.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {new Date(snapshot.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right p-1">
                        <div className="flex items-center justify-end gap-0.5">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-50" onClick={() => setViewSnapshot(snapshot)} data-testid={`button-view-snapshot-${snapshot.id}`}>
                            <Eye className="h-4 w-4 text-blue-500" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-amber-50" onClick={() => handleEdit(snapshot)} data-testid={`button-edit-snapshot-${snapshot.id}`}>
                            <Pencil className="h-4 w-4 text-amber-500" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-50" onClick={() => handleDelete(snapshot.id)} data-testid={`button-delete-snapshot-${snapshot.id}`}>
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      )}

      <Dialog open={!!viewSnapshot} onOpenChange={(open) => !open && setViewSnapshot(null)}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewSnapshot?.periodName}</DialogTitle>
            <DialogDescription>
              {viewSnapshot?.countryName} — Saved on {viewSnapshot ? new Date(viewSnapshot.createdAt).toLocaleDateString() : ''}
            </DialogDescription>
          </DialogHeader>

          {viewSnapshot && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <Card className="p-3 shadow-sm">
                  <p className="text-xs font-medium text-muted-foreground">Total Profit</p>
                  <p className={`text-lg font-bold ${viewSnapshot.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(viewSnapshot.profit, viewSnapshot.currency)}
                  </p>
                  <span className={`text-xs ${viewSnapshot.margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {viewSnapshot.margin.toFixed(1)}% margin
                  </span>
                </Card>
                <Card className="p-3 shadow-sm">
                  <p className="text-xs font-medium text-muted-foreground">Total Orders</p>
                  <p className="text-lg font-bold">{formatNumber(viewSnapshot.totalOrders)}</p>
                </Card>
                <Card className="p-3 shadow-sm">
                  <p className="text-xs font-medium text-muted-foreground">Confirmed</p>
                  <p className="text-lg font-bold">{formatNumber(viewSnapshot.ordersConfirmed)}</p>
                  <span className="text-xs text-muted-foreground">
                    {viewSnapshot.totalOrders > 0 ? ((viewSnapshot.ordersConfirmed / viewSnapshot.totalOrders) * 100).toFixed(1) : 0}%
                  </span>
                </Card>
                <Card className="p-3 shadow-sm">
                  <p className="text-xs font-medium text-muted-foreground">Delivered</p>
                  <p className="text-lg font-bold">{formatNumber(viewSnapshot.deliveredOrders)}</p>
                  <span className="text-xs text-muted-foreground">
                    {viewSnapshot.ordersConfirmed > 0 ? ((viewSnapshot.deliveredOrders / viewSnapshot.ordersConfirmed) * 100).toFixed(1) : 0}%
                  </span>
                </Card>
                <Card className="p-3 shadow-sm">
                  <p className="text-xs font-medium text-muted-foreground">Total Spend</p>
                  <p className="text-lg font-bold">{formatCurrency(viewSnapshot.totalAds, viewSnapshot.currency)}</p>
                </Card>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <Card className="p-3 shadow-sm">
                  <p className="text-xs font-medium text-muted-foreground">Revenue</p>
                  <p className="text-lg font-bold">{formatCurrency(viewSnapshot.totalRevenue, viewSnapshot.currency)}</p>
                </Card>
                <Card className="p-3 shadow-sm">
                  <p className="text-xs font-medium text-muted-foreground">Service Fees</p>
                  <p className="text-lg font-bold">{formatCurrency(viewSnapshot.totalServiceFees, viewSnapshot.currency)}</p>
                </Card>
                <Card className="p-3 shadow-sm">
                  <p className="text-xs font-medium text-muted-foreground">Product Fees</p>
                  <p className="text-lg font-bold">{formatCurrency(viewSnapshot.totalProductFees, viewSnapshot.currency)}</p>
                </Card>
                <Card className="p-3 shadow-sm">
                  <p className="text-xs font-medium text-muted-foreground">CPA</p>
                  <p className="text-lg font-bold">
                    {viewSnapshot.totalOrders > 0 ? formatCurrency(viewSnapshot.totalAds / viewSnapshot.totalOrders, viewSnapshot.currency) : '-'}
                  </p>
                </Card>
                <Card className="p-3 shadow-sm">
                  <p className="text-xs font-medium text-muted-foreground">CPAD</p>
                  <p className="text-lg font-bold">
                    {viewSnapshot.deliveredOrders > 0 ? formatCurrency(viewSnapshot.totalAds / viewSnapshot.deliveredOrders, viewSnapshot.currency) : '-'}
                  </p>
                </Card>
              </div>

              <Card className="shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-muted/60 to-muted/30 hover:from-muted/60 hover:to-muted/30">
                        <TableHead className="min-w-[180px]">Product</TableHead>
                        <TableHead className="text-right">Orders</TableHead>
                        <TableHead className="text-right">Confirmed</TableHead>
                        <TableHead className="text-right">Conf. %</TableHead>
                        <TableHead className="text-right">Delivered</TableHead>
                        <TableHead className="text-right">Del. %</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                        <TableHead className="text-right">Ads</TableHead>
                        <TableHead className="text-right">Service Fees</TableHead>
                        <TableHead className="text-right">Qty Del.</TableHead>
                        <TableHead className="text-right">Prod. Fees</TableHead>
                        <TableHead className="text-right">Profit</TableHead>
                        <TableHead className="text-right">Margin</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {viewSnapshot.snapshotData.map((row: SnapshotRow, index: number) => (
                        <TableRow
                          key={index}
                          className={cn(
                            "transition-colors hover:bg-muted/40",
                            index % 2 === 0 ? "bg-background" : "bg-muted/10",
                            row.profit < 0 && "bg-red-50/50"
                          )}
                          data-testid={`row-snapshot-product-${index}`}
                        >
                          <TableCell>
                            <div className="font-semibold">{row.productName}</div>
                            <div className="text-xs text-muted-foreground font-mono">{row.productSku}</div>
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">{formatNumber(row.totalOrders)}</TableCell>
                          <TableCell className="text-right font-mono text-sm">{formatNumber(row.ordersConfirmed)}</TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            <span className={cn(
                              "inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium",
                              row.confirmationRate >= 50 ? "bg-green-50 text-green-700" : row.confirmationRate >= 30 ? "bg-yellow-50 text-yellow-700" : "bg-red-50 text-red-700"
                            )}>
                              {row.confirmationRate.toFixed(1)}%
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">{formatNumber(row.deliveredOrders)}</TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            <span className={cn(
                              "inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium",
                              row.deliveryRate >= 80 ? "bg-green-50 text-green-700" : row.deliveryRate >= 50 ? "bg-yellow-50 text-yellow-700" : "bg-red-50 text-red-700"
                            )}>
                              {row.deliveryRate.toFixed(1)}%
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">{formatCurrency(row.revenue, viewSnapshot.currency)}</TableCell>
                          <TableCell className="text-right font-mono text-sm">{formatCurrency(row.ads, viewSnapshot.currency)}</TableCell>
                          <TableCell className="text-right font-mono text-sm">{formatCurrency(row.serviceFees, viewSnapshot.currency)}</TableCell>
                          <TableCell className="text-right font-mono text-sm">{formatNumber(row.quantityDelivery)}</TableCell>
                          <TableCell className="text-right font-mono text-sm">{formatCurrency(row.productFees, viewSnapshot.currency)}</TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            <span className={cn("font-semibold", row.profit >= 0 ? "text-green-600" : "text-red-600")}>
                              {formatCurrency(row.profit, viewSnapshot.currency)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            <span className={cn(
                              "inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium",
                              row.margin >= 20 ? "bg-green-50 text-green-700" : row.margin >= 0 ? "bg-yellow-50 text-yellow-700" : "bg-red-50 text-red-700"
                            )}>
                              {row.margin.toFixed(1)}%
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
