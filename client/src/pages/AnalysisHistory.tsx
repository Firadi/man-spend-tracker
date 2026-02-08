import { useState, useEffect, useMemo } from "react";
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
import { Eye, Trash2, History, Search, AlertCircle, Pencil, ShoppingCart, TrendingUp, CheckCircle, Truck, Target, DollarSign, BarChart3, Percent, Filter } from "lucide-react";

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
            Analysis History
          </h2>
          <p className="text-muted-foreground">Saved analysis snapshots for different periods.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {availableCountries.length > 1 && (
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
          )}
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
        <div className="flex items-center gap-3 p-2 px-3 bg-blue-50 border border-blue-200 rounded-lg" data-testid="selection-indicator">
          <span className="text-sm font-medium text-blue-800">
            {selectedIds.size} period{selectedIds.size > 1 ? 's' : ''} selected
          </span>
          <Button variant="ghost" size="sm" className="h-7 text-xs text-blue-600 hover:text-blue-800" onClick={clearSelection} data-testid="button-clear-selection">
            Clear selection
          </Button>
        </div>
      )}

      {summaryTotals && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          <Card className="p-3" data-testid="card-total-profit">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs font-medium text-muted-foreground">Total Profit</p>
            </div>
            <p className={`text-lg font-bold ${summaryTotals.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(summaryTotals.profit, summaryTotals.currency)}
            </p>
          </Card>
          <Card className="p-3" data-testid="card-total-orders">
            <div className="flex items-center gap-2 mb-1">
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs font-medium text-muted-foreground">Total Orders</p>
            </div>
            <p className="text-lg font-bold">{formatNumber(summaryTotals.totalOrders)}</p>
          </Card>
          <Card className="p-3" data-testid="card-total-confirmed">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs font-medium text-muted-foreground">Confirmed</p>
            </div>
            <p className="text-lg font-bold">{formatNumber(summaryTotals.ordersConfirmed)}</p>
          </Card>
          <Card className="p-3" data-testid="card-total-delivered">
            <div className="flex items-center gap-2 mb-1">
              <Truck className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs font-medium text-muted-foreground">Delivered</p>
            </div>
            <p className="text-lg font-bold">{formatNumber(summaryTotals.deliveredOrders)}</p>
          </Card>
          <Card className="p-3" data-testid="card-confirmation-rate">
            <div className="flex items-center gap-2 mb-1">
              <Percent className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs font-medium text-muted-foreground">Conf. Rate</p>
            </div>
            <p className="text-lg font-bold">{summaryTotals.confirmationRate.toFixed(1)}%</p>
          </Card>
          <Card className="p-3" data-testid="card-delivery-rate">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs font-medium text-muted-foreground">Delivery Rate</p>
            </div>
            <p className="text-lg font-bold">{summaryTotals.deliveryRate.toFixed(1)}%</p>
          </Card>
          <Card className="p-3" data-testid="card-total-spend">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs font-medium text-muted-foreground">Total Spend</p>
            </div>
            <p className="text-lg font-bold">{formatCurrency(summaryTotals.totalAds, summaryTotals.currency)}</p>
          </Card>
          <Card className="p-3" data-testid="card-cpa">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs font-medium text-muted-foreground">CPA</p>
            </div>
            <p className="text-lg font-bold">{summaryTotals.cpa > 0 ? formatCurrency(summaryTotals.cpa, summaryTotals.currency) : '-'}</p>
          </Card>
          <Card className="p-3" data-testid="card-cpad">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs font-medium text-muted-foreground">CPAD</p>
            </div>
            <p className="text-lg font-bold">{summaryTotals.cpad > 0 ? formatCurrency(summaryTotals.cpad, summaryTotals.currency) : '-'}</p>
          </Card>
          <Card className="p-3" data-testid="card-cpd">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs font-medium text-muted-foreground">CPD</p>
            </div>
            <p className="text-lg font-bold">{summaryTotals.cpd > 0 ? formatCurrency(summaryTotals.cpd, summaryTotals.currency) : '-'}</p>
          </Card>
        </div>
      )}

      {filteredSnapshots.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[40vh] text-muted-foreground">
          <AlertCircle className="w-10 h-10 mb-4" />
          <p>{snapshots.length === 0 ? "No saved analysis snapshots yet. Go to Analyse and click 'Save Data' to create one." : "No snapshots match your search."}</p>
        </div>
      ) : (
        <div className="border rounded-md bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="w-[40px] px-2">
                    <Checkbox
                      checked={baseFilteredSnapshots.length > 0 && baseFilteredSnapshots.every(s => selectedIds.has(s.id))}
                      onCheckedChange={toggleAllVisible}
                      data-testid="checkbox-select-all"
                    />
                  </TableHead>
                  <TableHead className="min-w-[180px]">Period</TableHead>
                  <TableHead className="min-w-[120px]">Country</TableHead>
                  <TableHead className="text-right w-[100px]">Total Orders</TableHead>
                  <TableHead className="text-right w-[100px]">Confirmed</TableHead>
                  <TableHead className="text-right w-[100px]">Delivered</TableHead>
                  <TableHead className="text-right w-[120px]">Revenue</TableHead>
                  <TableHead className="text-right w-[120px]">Profit</TableHead>
                  <TableHead className="text-right w-[80px]">Margin</TableHead>
                  <TableHead className="text-right w-[120px]">Date</TableHead>
                  <TableHead className="text-right w-[110px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSnapshots.map((snapshot) => (
                  <TableRow key={snapshot.id} data-testid={`row-snapshot-${snapshot.id}`}>
                    <TableCell className="px-2">
                      <Checkbox
                        checked={selectedIds.has(snapshot.id)}
                        onCheckedChange={() => toggleSelection(snapshot.id)}
                        data-testid={`checkbox-snapshot-${snapshot.id}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{snapshot.periodName}</TableCell>
                    <TableCell>
                      <span className="text-muted-foreground">{snapshot.countryName}</span>
                    </TableCell>
                    <TableCell className="text-right font-mono">{formatNumber(snapshot.totalOrders)}</TableCell>
                    <TableCell className="text-right font-mono">{formatNumber(snapshot.ordersConfirmed)}</TableCell>
                    <TableCell className="text-right font-mono">{formatNumber(snapshot.deliveredOrders)}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(snapshot.totalRevenue, snapshot.currency)}</TableCell>
                    <TableCell className="text-right font-mono">
                      <span className={snapshot.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(snapshot.profit, snapshot.currency)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      <span className={snapshot.margin >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {snapshot.margin.toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {new Date(snapshot.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right p-1">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewSnapshot(snapshot)} data-testid={`button-view-snapshot-${snapshot.id}`}>
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(snapshot)} data-testid={`button-edit-snapshot-${snapshot.id}`}>
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700" onClick={() => handleDelete(snapshot.id)} data-testid={`button-delete-snapshot-${snapshot.id}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
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
                <Card className="p-3">
                  <p className="text-xs font-medium text-muted-foreground">Total Profit</p>
                  <p className={`text-lg font-bold ${viewSnapshot.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(viewSnapshot.profit, viewSnapshot.currency)}
                  </p>
                  <span className={`text-xs ${viewSnapshot.margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {viewSnapshot.margin.toFixed(1)}% margin
                  </span>
                </Card>
                <Card className="p-3">
                  <p className="text-xs font-medium text-muted-foreground">Total Orders</p>
                  <p className="text-lg font-bold">{formatNumber(viewSnapshot.totalOrders)}</p>
                </Card>
                <Card className="p-3">
                  <p className="text-xs font-medium text-muted-foreground">Confirmed</p>
                  <p className="text-lg font-bold">{formatNumber(viewSnapshot.ordersConfirmed)}</p>
                  <span className="text-xs text-muted-foreground">
                    {viewSnapshot.totalOrders > 0 ? ((viewSnapshot.ordersConfirmed / viewSnapshot.totalOrders) * 100).toFixed(1) : 0}%
                  </span>
                </Card>
                <Card className="p-3">
                  <p className="text-xs font-medium text-muted-foreground">Delivered</p>
                  <p className="text-lg font-bold">{formatNumber(viewSnapshot.deliveredOrders)}</p>
                  <span className="text-xs text-muted-foreground">
                    {viewSnapshot.ordersConfirmed > 0 ? ((viewSnapshot.deliveredOrders / viewSnapshot.ordersConfirmed) * 100).toFixed(1) : 0}%
                  </span>
                </Card>
                <Card className="p-3">
                  <p className="text-xs font-medium text-muted-foreground">Total Spend</p>
                  <p className="text-lg font-bold">{formatCurrency(viewSnapshot.totalAds, viewSnapshot.currency)}</p>
                </Card>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <Card className="p-3">
                  <p className="text-xs font-medium text-muted-foreground">Revenue</p>
                  <p className="text-lg font-bold">{formatCurrency(viewSnapshot.totalRevenue, viewSnapshot.currency)}</p>
                </Card>
                <Card className="p-3">
                  <p className="text-xs font-medium text-muted-foreground">Service Fees</p>
                  <p className="text-lg font-bold">{formatCurrency(viewSnapshot.totalServiceFees, viewSnapshot.currency)}</p>
                </Card>
                <Card className="p-3">
                  <p className="text-xs font-medium text-muted-foreground">Product Fees</p>
                  <p className="text-lg font-bold">{formatCurrency(viewSnapshot.totalProductFees, viewSnapshot.currency)}</p>
                </Card>
                <Card className="p-3">
                  <p className="text-xs font-medium text-muted-foreground">CPA</p>
                  <p className="text-lg font-bold">
                    {viewSnapshot.totalOrders > 0 ? formatCurrency(viewSnapshot.totalAds / viewSnapshot.totalOrders, viewSnapshot.currency) : '-'}
                  </p>
                </Card>
                <Card className="p-3">
                  <p className="text-xs font-medium text-muted-foreground">CPAD</p>
                  <p className="text-lg font-bold">
                    {viewSnapshot.deliveredOrders > 0 ? formatCurrency(viewSnapshot.totalAds / viewSnapshot.deliveredOrders, viewSnapshot.currency) : '-'}
                  </p>
                </Card>
              </div>

              <div className="border rounded-md bg-card overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="min-w-[180px]">Product</TableHead>
                        <TableHead className="text-right">Total Orders</TableHead>
                        <TableHead className="text-right">Confirmed</TableHead>
                        <TableHead className="text-right">Conf. Rate</TableHead>
                        <TableHead className="text-right">Delivered</TableHead>
                        <TableHead className="text-right">Del. Rate</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                        <TableHead className="text-right">Ads</TableHead>
                        <TableHead className="text-right">Service Fees</TableHead>
                        <TableHead className="text-right">Qty Delivery</TableHead>
                        <TableHead className="text-right">Prod. Fees</TableHead>
                        <TableHead className="text-right">Profit</TableHead>
                        <TableHead className="text-right">Margin</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {viewSnapshot.snapshotData.map((row: SnapshotRow, index: number) => (
                        <TableRow key={index} className={row.profit < 0 ? "bg-red-50" : ""} data-testid={`row-snapshot-product-${index}`}>
                          <TableCell>
                            <div className="font-medium">{row.productName}</div>
                            <div className="text-xs text-muted-foreground font-mono">{row.productSku}</div>
                          </TableCell>
                          <TableCell className="text-right font-mono">{formatNumber(row.totalOrders)}</TableCell>
                          <TableCell className="text-right font-mono">{formatNumber(row.ordersConfirmed)}</TableCell>
                          <TableCell className="text-right font-mono">{row.confirmationRate.toFixed(1)}%</TableCell>
                          <TableCell className="text-right font-mono">{formatNumber(row.deliveredOrders)}</TableCell>
                          <TableCell className="text-right font-mono">{row.deliveryRate.toFixed(1)}%</TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(row.revenue, viewSnapshot.currency)}</TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(row.ads, viewSnapshot.currency)}</TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(row.serviceFees, viewSnapshot.currency)}</TableCell>
                          <TableCell className="text-right font-mono">{formatNumber(row.quantityDelivery)}</TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(row.productFees, viewSnapshot.currency)}</TableCell>
                          <TableCell className="text-right font-mono">
                            <span className={row.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {formatCurrency(row.profit, viewSnapshot.currency)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            <span className={row.margin >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {row.margin.toFixed(1)}%
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
