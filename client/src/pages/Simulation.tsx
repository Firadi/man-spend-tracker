import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { RotateCcw, Calculator } from "lucide-react";

export default function Simulation() {
  const [inputs, setInputs] = useState({
    totalOrders: 180,
    confirmationRate: 70,
    deliveryRate: 40,
    sellingPrice: 46,
    productCost: 20,
    serviceFee: 5.7,
    adsCost: 310,
    otherCost: 0
  });

  const [results, setResults] = useState<null | {
    confirmedOrders: number;
    deliveredOrders: number;
    totalRevenue: number;
    totalCosts: number;
    costBreakdown: {
      product: number;
      service: number;
      ads: number;
      other: number;
    };
    totalProfit: number;
    profitPerDelivered: number;
    cpd: number;
    cpa: number;
    cpaDelivered: number;
    tdc: number;
  }>(null);

  const handleInputChange = (field: string, value: string) => {
    setInputs(prev => ({
      ...prev,
      [field]: value === '' ? 0 : parseFloat(value)
    }));
  };

  const calculate = () => {
    const confirmedOrders = (inputs.totalOrders * inputs.confirmationRate) / 100;
    const deliveredOrders = (confirmedOrders * inputs.deliveryRate) / 100;
    
    const totalRevenue = deliveredOrders * inputs.sellingPrice;
    
    const totalProductCost = inputs.productCost * deliveredOrders;
    const totalServiceFee = inputs.serviceFee * deliveredOrders;
    const totalAdsCost = inputs.adsCost;
    const totalOtherCost = inputs.otherCost;
    
    const totalCosts = totalProductCost + totalServiceFee + totalAdsCost + totalOtherCost;
    const totalProfit = totalRevenue - totalCosts;
    const profitPerDelivered = deliveredOrders > 0 ? totalProfit / deliveredOrders : 0;

    // Breakdown metrics
    const cpd = inputs.productCost + inputs.serviceFee;
    const cpa = inputs.totalOrders > 0 ? inputs.adsCost / inputs.totalOrders : 0;
    const cpaDelivered = deliveredOrders > 0 ? inputs.adsCost / deliveredOrders : 0;
    const tdc = cpd + cpaDelivered;

    setResults({
      confirmedOrders,
      deliveredOrders,
      totalRevenue,
      totalCosts,
      costBreakdown: {
        product: totalProductCost,
        service: totalServiceFee,
        ads: totalAdsCost,
        other: totalOtherCost
      },
      totalProfit,
      profitPerDelivered,
      cpd,
      cpa,
      cpaDelivered,
      tdc
    });
  };

  const reset = () => {
    setInputs({
      totalOrders: 0,
      confirmationRate: 0,
      deliveryRate: 0,
      sellingPrice: 0,
      productCost: 0,
      serviceFee: 5.7,
      adsCost: 0,
      otherCost: 0
    });
    setResults(null);
  };

  // Helper to display KES estimation
  const formatKES = (usdAmount: number) => {
    return `≈ ${(usdAmount * 130).toLocaleString()} KES`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Simulation</h2>
        <p className="text-muted-foreground">Simulate profitability before launching a product (COD Simulator).</p>
        <p className="text-xs text-muted-foreground font-mono">1 USD = 130 KES</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Inputs */}
        <Card className="border-muted/40 shadow-sm">
          <CardHeader>
            <CardTitle>Inputs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="totalOrders">Total Orders</Label>
                <Input 
                  id="totalOrders" 
                  type="number" 
                  value={inputs.totalOrders || ''}
                  onChange={(e) => handleInputChange('totalOrders', e.target.value)}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmationRate">Confirmation Rate (%)</Label>
                <Input 
                  id="confirmationRate" 
                  type="number" 
                  value={inputs.confirmationRate || ''}
                  onChange={(e) => handleInputChange('confirmationRate', e.target.value)}
                  placeholder="0"
                />
                <p className="text-[10px] text-muted-foreground">
                  Confirmed = Total Orders × Rate
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deliveryRate">Delivery Rate (%)</Label>
                <Input 
                  id="deliveryRate" 
                  type="number" 
                  value={inputs.deliveryRate || ''}
                  onChange={(e) => handleInputChange('deliveryRate', e.target.value)}
                  placeholder="0"
                />
                <p className="text-[10px] text-muted-foreground">
                  Delivered = Confirmed × Rate
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sellingPrice">Selling Price (USD)</Label>
                <Input 
                  id="sellingPrice" 
                  type="number" 
                  value={inputs.sellingPrice || ''}
                  onChange={(e) => handleInputChange('sellingPrice', e.target.value)}
                  placeholder="0"
                />
                <p className="text-[10px] text-muted-foreground">
                  {formatKES(inputs.sellingPrice)}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="productCost">Product Cost (USD)</Label>
                <Input 
                  id="productCost" 
                  type="number" 
                  value={inputs.productCost || ''}
                  onChange={(e) => handleInputChange('productCost', e.target.value)}
                  placeholder="0"
                />
                <p className="text-[10px] text-muted-foreground">
                  {formatKES(inputs.productCost)}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="serviceFee">Service Fee (USD)</Label>
                <Input 
                  id="serviceFee" 
                  type="number" 
                  value={inputs.serviceFee || ''}
                  onChange={(e) => handleInputChange('serviceFee', e.target.value)}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="adsCost">Ads Cost (Total USD)</Label>
                <Input 
                  id="adsCost" 
                  type="number" 
                  value={inputs.adsCost || ''}
                  onChange={(e) => handleInputChange('adsCost', e.target.value)}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="otherCost">Other Cost (Total USD)</Label>
                <Input 
                  id="otherCost" 
                  type="number" 
                  value={inputs.otherCost || ''}
                  onChange={(e) => handleInputChange('otherCost', e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button onClick={calculate} className="w-full gap-2">
                <Calculator className="h-4 w-4" /> Calculate
              </Button>
              <Button onClick={reset} variant="outline" className="w-full gap-2">
                <RotateCcw className="h-4 w-4" /> Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Results */}
        <Card className="border-muted/40 shadow-sm bg-muted/10 h-full">
          <CardHeader>
            <CardTitle>Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {!results ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                Click Calculate to see results
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-background rounded-lg border">
                    <p className="text-sm font-medium text-muted-foreground">Confirmed Orders</p>
                    <p className="text-2xl font-bold">{formatNumber(results.confirmedOrders)}</p>
                  </div>
                  <div className="p-4 bg-background rounded-lg border">
                    <p className="text-sm font-medium text-muted-foreground">Delivered Orders</p>
                    <p className="text-2xl font-bold">{formatNumber(results.deliveredOrders)}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground">Total Revenue</span>
                    <span className="font-mono font-bold">{formatCurrency(results.totalRevenue, 'USD')}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground">Total Costs</span>
                    <span className="font-mono font-bold text-red-500">-{formatCurrency(results.totalCosts, 'USD')}</span>
                  </div>
                  
                  {/* Detailed Cost Breakdown (Small) */}
                  <div className="pl-4 space-y-1 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Product:</span>
                      <span>{formatCurrency(results.costBreakdown.product, 'USD')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Service Fees:</span>
                      <span>{formatCurrency(results.costBreakdown.service, 'USD')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ads:</span>
                      <span>{formatCurrency(results.costBreakdown.ads, 'USD')}</span>
                    </div>
                    {results.costBreakdown.other > 0 && (
                      <div className="flex justify-between">
                        <span>Other:</span>
                        <span>{formatCurrency(results.costBreakdown.other, 'USD')}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4">
                     <p className="text-sm font-medium text-muted-foreground mb-1">Total Profit</p>
                     <div className={`text-4xl font-bold ${results.totalProfit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                       {formatCurrency(results.totalProfit, 'USD')}
                     </div>
                     <p className="text-sm text-muted-foreground mt-1">
                       {results.totalProfit > 0 ? '+' : ''}{formatCurrency(results.profitPerDelivered, 'USD')} per delivered order
                     </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Footer: CPD & CPA Breakdown */}
      {results && (
        <Card className="border-muted/40 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
          <CardHeader>
            <CardTitle>CPD & CPA Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Metric</TableHead>
                    <TableHead>Formula</TableHead>
                    <TableHead className="text-right">Value (USD)</TableHead>
                    <TableHead className="text-right">Value (KES)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">CPD (Cost per Delivered)</TableCell>
                    <TableCell className="text-muted-foreground text-xs">Product Cost + Service Fee</TableCell>
                    <TableCell className="text-right font-mono text-lg">{formatCurrency(results.cpd, 'USD')}</TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm">{formatKES(results.cpd)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">CPA (Ads per Order)</TableCell>
                    <TableCell className="text-muted-foreground text-xs">Ads Cost / Total Orders</TableCell>
                    <TableCell className="text-right font-mono text-lg">{formatCurrency(results.cpa, 'USD')}</TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm">{formatKES(results.cpa)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">CPA (Delivered)</TableCell>
                    <TableCell className="text-muted-foreground text-xs">Ads Cost / Delivered Orders</TableCell>
                    <TableCell className="text-right font-mono text-lg">{formatCurrency(results.cpaDelivered, 'USD')}</TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm">{formatKES(results.cpaDelivered)}</TableCell>
                  </TableRow>
                  <TableRow className="bg-muted/30 font-bold">
                    <TableCell>Total Delivery Cost per Delivered</TableCell>
                    <TableCell className="text-muted-foreground text-xs font-normal">CPD + CPA (Delivered)</TableCell>
                    <TableCell className="text-right font-mono text-lg">{formatCurrency(results.tdc, 'USD')}</TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm">{formatKES(results.tdc)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}