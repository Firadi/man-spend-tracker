import { useState, useMemo } from "react";
import { useStore, Product } from "@/lib/store";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function Analyse() {
  const { countries, products, analysis, updateAnalysis } = useStore();
  const [selectedCountryId, setSelectedCountryId] = useState<string>(countries[0]?.id || "");
  const [showDrafts, setShowDrafts] = useState(false);

  // Fallback to first country if selected is invalid
  const activeCountryId = selectedCountryId || countries[0]?.id;
  const activeCountry = countries.find(c => c.id === activeCountryId);

  // Filter products:
  // 1. Must match status (Active or Show Drafts)
  // 2. Must be assigned to selected country (check countryIds)
  // Note: If countryIds is missing/undefined, assuming not assigned.
  const filteredProducts = products.filter(p => {
    const statusMatch = showDrafts || p.status === 'Active';
    const countryMatch = activeCountryId && p.countryIds && p.countryIds.includes(activeCountryId);
    return statusMatch && countryMatch;
  });

  const getAnalysisValue = (productId: string, field: 'revenue' | 'ads' | 'serviceFees' | 'productFees' | 'deliveredOrders') => {
    if (!activeCountryId) return 0;
    const override = analysis[activeCountryId]?.[productId]?.[field];
    if (override !== undefined) return override;
    
    // Defaults
    if (field === 'serviceFees' && activeCountry) {
      return activeCountry.defaultShipping + activeCountry.defaultCod + activeCountry.defaultReturn;
    }
    return 0;
  };

  const handleUpdate = (productId: string, field: 'revenue' | 'ads' | 'serviceFees' | 'productFees' | 'deliveredOrders', value: string) => {
    if (!activeCountryId) return;
    const numValue = parseFloat(value) || 0;
    updateAnalysis(activeCountryId, productId, { [field]: numValue });
  };

  // Calculations
  const rows = filteredProducts.map(p => {
    const revenue = getAnalysisValue(p.id, 'revenue');
    const ads = getAnalysisValue(p.id, 'ads');
    const serviceFees = getAnalysisValue(p.id, 'serviceFees');
    const productFees = getAnalysisValue(p.id, 'productFees');
    const deliveredOrders = getAnalysisValue(p.id, 'deliveredOrders');
    const profit = revenue - ads - serviceFees - productFees;
    
    return {
      product: p,
      revenue,
      ads,
      serviceFees,
      productFees,
      deliveredOrders,
      profit
    };
  });

  const totals = rows.reduce((acc, row) => ({
    revenue: acc.revenue + row.revenue,
    ads: acc.ads + row.ads,
    serviceFees: acc.serviceFees + row.serviceFees,
    productFees: acc.productFees + row.productFees,
    deliveredOrders: acc.deliveredOrders + row.deliveredOrders,
    profit: acc.profit + row.profit,
  }), { revenue: 0, ads: 0, serviceFees: 0, productFees: 0, deliveredOrders: 0, profit: 0 });

  const totalOrders = rows.reduce((acc, row) => {
    // If delivered orders is manually set > 0, use it. Otherwise fallback to revenue/price calculation.
    if (row.deliveredOrders > 0) return acc + row.deliveredOrders;
    if (row.product.price > 0) return acc + (row.revenue / row.product.price);
    return acc;
  }, 0);

  const globalCPA = totalOrders > 0 ? totals.ads / totalOrders : 0;
  const globalMargin = totals.revenue > 0 ? (totals.profit / totals.revenue) * 100 : 0;

  if (!activeCountry) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-muted-foreground">
        <AlertCircle className="w-10 h-10 mb-4" />
        <p>No countries configured. Go to Settings to add a country.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analyse</h2>
          <p className="text-muted-foreground">Profitability analysis for {activeCountry.name}.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Switch id="drafts" checked={showDrafts} onCheckedChange={setShowDrafts} />
            <Label htmlFor="drafts">Show Drafts</Label>
          </div>
          
          <Select value={activeCountryId} onValueChange={setSelectedCountryId}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Country" />
            </SelectTrigger>
            <SelectContent>
              {countries.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name} ({c.currency})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <Card className="p-4 bg-primary/5 border-primary/10">
           <p className="text-sm font-medium text-muted-foreground">Total Profit</p>
           <p className={`text-2xl font-bold ${totals.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
             {formatCurrency(totals.profit, activeCountry.currency)}
           </p>
         </Card>
         <Card className="p-4">
           <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
           <p className="text-2xl font-bold">{formatCurrency(totals.revenue, activeCountry.currency)}</p>
         </Card>
         <Card className="p-4">
           <p className="text-sm font-medium text-muted-foreground">Est. Orders</p>
           <p className="text-2xl font-bold">{formatNumber(totalOrders)}</p>
         </Card>
         <Card className="p-4">
           <p className="text-sm font-medium text-muted-foreground">Margin</p>
           <p className={`text-2xl font-bold ${globalMargin > 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
             {globalMargin.toFixed(1)}%
           </p>
         </Card>
      </div>

      <div className="border rounded-md bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="min-w-[200px]">Product</TableHead>
                <TableHead className="w-[140px] text-right">Revenue</TableHead>
                <TableHead className="w-[140px] text-right">Ads</TableHead>
                <TableHead className="w-[140px] text-right">Service Fees</TableHead>
                <TableHead className="w-[140px] text-right">Prod. Fees</TableHead>
                <TableHead className="w-[140px] text-right">Delivered</TableHead>
                <TableHead className="w-[140px] text-right font-bold">Profit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                     No products assigned to this country (or no active products).
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.product.id}>
                    <TableCell>
                      <div className="font-medium">{row.product.name}</div>
                      <div className="text-xs text-muted-foreground font-mono">{row.product.sku}</div>
                    </TableCell>
                    <TableCell className="p-1">
                      <Input 
                        type="number" 
                        className="text-right h-8 font-mono bg-transparent border-transparent hover:border-input focus:border-ring"
                        value={row.revenue || ''}
                        onChange={(e) => handleUpdate(row.product.id, 'revenue', e.target.value)}
                        placeholder="0"
                      />
                    </TableCell>
                    <TableCell className="p-1">
                      <Input 
                        type="number" 
                        className="text-right h-8 font-mono bg-transparent border-transparent hover:border-input focus:border-ring"
                        value={row.ads || ''}
                        onChange={(e) => handleUpdate(row.product.id, 'ads', e.target.value)}
                        placeholder="0"
                      />
                    </TableCell>
                    <TableCell className="p-1">
                      <Input 
                        type="number" 
                        className="text-right h-8 font-mono bg-transparent border-transparent hover:border-input focus:border-ring"
                        value={row.serviceFees || ''}
                        onChange={(e) => handleUpdate(row.product.id, 'serviceFees', e.target.value)}
                        placeholder="0"
                      />
                    </TableCell>
                    <TableCell className="p-1">
                      <Input 
                        type="number" 
                        className="text-right h-8 font-mono bg-transparent border-transparent hover:border-input focus:border-ring"
                        value={row.productFees || ''}
                        onChange={(e) => handleUpdate(row.product.id, 'productFees', e.target.value)}
                        placeholder="0"
                      />
                    </TableCell>
                    <TableCell className="p-1">
                      <Input 
                        type="number" 
                        className="text-right h-8 font-mono bg-transparent border-transparent hover:border-input focus:border-ring"
                        value={row.deliveredOrders || ''}
                        onChange={(e) => handleUpdate(row.product.id, 'deliveredOrders', e.target.value)}
                        placeholder="0"
                      />
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      <span className={row.profit > 0 ? 'text-green-600' : row.profit < 0 ? 'text-red-600' : 'text-muted-foreground'}>
                        {formatNumber(row.profit)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
              {rows.length > 0 && (
                <TableRow className="bg-muted/30 font-bold border-t-2">
                  <TableCell>Totals</TableCell>
                  <TableCell className="text-right font-mono">{formatNumber(totals.revenue)}</TableCell>
                  <TableCell className="text-right font-mono">{formatNumber(totals.ads)}</TableCell>
                  <TableCell className="text-right font-mono">{formatNumber(totals.serviceFees)}</TableCell>
                  <TableCell className="text-right font-mono">{formatNumber(totals.productFees)}</TableCell>
                  <TableCell className="text-right font-mono">{formatNumber(totals.deliveredOrders)}</TableCell>
                  <TableCell className="text-right font-mono">
                    <span className={totals.profit > 0 ? 'text-green-600' : totals.profit < 0 ? 'text-red-600' : ''}>
                      {formatCurrency(totals.profit, activeCountry.currency)}
                    </span>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
