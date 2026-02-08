import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eye, Trash2, History, Search, AlertCircle } from "lucide-react";

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
  const { toast } = useToast();

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

  const filteredSnapshots = snapshots.filter(s => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return s.periodName.toLowerCase().includes(q) || s.countryName.toLowerCase().includes(q);
  });

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
        <div className="relative w-full sm:w-[300px]">
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
                  <TableHead className="min-w-[180px]">Period</TableHead>
                  <TableHead className="min-w-[120px]">Country</TableHead>
                  <TableHead className="text-right w-[100px]">Total Orders</TableHead>
                  <TableHead className="text-right w-[100px]">Confirmed</TableHead>
                  <TableHead className="text-right w-[100px]">Delivered</TableHead>
                  <TableHead className="text-right w-[120px]">Revenue</TableHead>
                  <TableHead className="text-right w-[120px]">Profit</TableHead>
                  <TableHead className="text-right w-[80px]">Margin</TableHead>
                  <TableHead className="text-right w-[120px]">Date</TableHead>
                  <TableHead className="text-right w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSnapshots.map((snapshot) => (
                  <TableRow key={snapshot.id} data-testid={`row-snapshot-${snapshot.id}`}>
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold">{formatNumber(viewSnapshot.totalOrders)}</p>
                </Card>
                <Card className="p-4">
                  <p className="text-sm font-medium text-muted-foreground">Confirmed</p>
                  <p className="text-2xl font-bold">{formatNumber(viewSnapshot.ordersConfirmed)}</p>
                </Card>
                <Card className="p-4">
                  <p className="text-sm font-medium text-muted-foreground">Delivered</p>
                  <p className="text-2xl font-bold">{formatNumber(viewSnapshot.deliveredOrders)}</p>
                </Card>
                <Card className="p-4 bg-primary/5 border-primary/10">
                  <p className="text-sm font-medium text-muted-foreground">Profit</p>
                  <div className="flex items-baseline gap-2">
                    <p className={`text-2xl font-bold ${viewSnapshot.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(viewSnapshot.profit, viewSnapshot.currency)}
                    </p>
                    <span className={`text-sm font-medium ${viewSnapshot.margin >= 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                      ({viewSnapshot.margin.toFixed(1)}%)
                    </span>
                  </div>
                </Card>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4">
                  <p className="text-sm font-medium text-muted-foreground">Revenue</p>
                  <p className="text-xl font-bold">{formatCurrency(viewSnapshot.totalRevenue, viewSnapshot.currency)}</p>
                </Card>
                <Card className="p-4">
                  <p className="text-sm font-medium text-muted-foreground">Ads</p>
                  <p className="text-xl font-bold">{formatCurrency(viewSnapshot.totalAds, viewSnapshot.currency)}</p>
                </Card>
                <Card className="p-4">
                  <p className="text-sm font-medium text-muted-foreground">Service Fees</p>
                  <p className="text-xl font-bold">{formatCurrency(viewSnapshot.totalServiceFees, viewSnapshot.currency)}</p>
                </Card>
                <Card className="p-4">
                  <p className="text-sm font-medium text-muted-foreground">Product Fees</p>
                  <p className="text-xl font-bold">{formatCurrency(viewSnapshot.totalProductFees, viewSnapshot.currency)}</p>
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
