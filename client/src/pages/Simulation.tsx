import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { RotateCcw, Calculator, DollarSign, TrendingUp, TrendingDown, Package, CheckCircle, Truck, Coins } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-amber-200 to-yellow-500 bg-clip-text text-transparent w-fit">COD Simulator</h2>
          <p className="text-muted-foreground mt-1">
            Analyze profitability with real-time currency conversion (1 USD = 130 KES).
          </p>
        </div>
        <Badge variant="outline" className="text-sm px-4 py-1.5 h-auto bg-yellow-500/10 border-yellow-500/30 text-yellow-500 gap-2 backdrop-blur-sm">
          <Coins className="w-4 h-4" />
          <span>Currency: USD ($)</span>
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Inputs */}
        <div className="lg:col-span-5 h-full">
            <Card className="border-muted/30 shadow-lg bg-card/80 backdrop-blur-sm h-full flex flex-col">
              <CardHeader className="pb-4 border-b border-muted/20">
                <CardTitle className="text-amber-500 font-bold uppercase text-sm tracking-wider flex items-center gap-2">
                   <Calculator className="w-4 h-4" /> Inputs
                </CardTitle>
                <p className="text-xs text-muted-foreground">Enter your campaign metrics below.</p>
              </CardHeader>
              <CardContent className="space-y-6 pt-6 flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                  <div className="space-y-2 col-span-2 md:col-span-1">
                    <Label htmlFor="totalOrders" className="text-foreground font-medium text-xs uppercase tracking-wide">Total Orders</Label>
                    <div className="relative">
                        <Input 
                          id="totalOrders" 
                          type="number" 
                          value={inputs.totalOrders || ''}
                          onChange={(e) => handleInputChange('totalOrders', e.target.value)}
                          placeholder="0"
                          className="bg-muted/30 border-muted-foreground/20 h-10 focus-visible:ring-amber-500/50 pl-9"
                        />
                        <Package className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/50" />
                    </div>
                  </div>

                  <div className="space-y-2 col-span-2 md:col-span-1">
                    <Label htmlFor="confirmationRate" className="text-foreground font-medium text-xs uppercase tracking-wide">Confirmation Rate (%)</Label>
                    <div className="relative">
                        <Input 
                          id="confirmationRate" 
                          type="number" 
                          value={inputs.confirmationRate || ''}
                          onChange={(e) => handleInputChange('confirmationRate', e.target.value)}
                          placeholder="0"
                          className="bg-muted/30 border-muted-foreground/20 h-10 focus-visible:ring-amber-500/50 pl-9"
                        />
                        <CheckCircle className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/50" />
                    </div>
                    <p className="text-[10px] text-muted-foreground italic truncate">
                      Confirmed = Total × Rate %
                    </p>
                  </div>

                  <div className="space-y-2 col-span-2 md:col-span-1">
                    <Label htmlFor="deliveryRate" className="text-foreground font-medium text-xs uppercase tracking-wide">Delivery Rate (%)</Label>
                    <div className="relative">
                        <Input 
                          id="deliveryRate" 
                          type="number" 
                          value={inputs.deliveryRate || ''}
                          onChange={(e) => handleInputChange('deliveryRate', e.target.value)}
                          placeholder="0"
                          className="bg-muted/30 border-muted-foreground/20 h-10 focus-visible:ring-amber-500/50 pl-9"
                        />
                        <Truck className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/50" />
                    </div>
                    <p className="text-[10px] text-muted-foreground italic truncate">
                      Delivered = Confirmed × Rate %
                    </p>
                  </div>

                  <div className="space-y-2 col-span-2 md:col-span-1">
                    <Label htmlFor="sellingPrice" className="text-foreground font-medium text-xs uppercase tracking-wide">Selling Price (USD)</Label>
                    <div className="relative">
                        <Input 
                          id="sellingPrice" 
                          type="number" 
                          value={inputs.sellingPrice || ''}
                          onChange={(e) => handleInputChange('sellingPrice', e.target.value)}
                          placeholder="0"
                          className="bg-muted/30 border-muted-foreground/20 h-10 focus-visible:ring-amber-500/50 pl-9"
                        />
                        <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/50" />
                    </div>
                    <p className="text-[10px] text-amber-500/70 font-mono">
                      {formatKES(inputs.sellingPrice)}
                    </p>
                  </div>

                  <div className="col-span-2 h-px bg-muted/20 my-2" />

                  <div className="space-y-2 col-span-2 md:col-span-1">
                    <Label htmlFor="productCost" className="text-foreground font-medium text-xs uppercase tracking-wide">Product Cost (USD)</Label>
                    <Input 
                      id="productCost" 
                      type="number" 
                      value={inputs.productCost || ''}
                      onChange={(e) => handleInputChange('productCost', e.target.value)}
                      placeholder="0"
                      className="bg-muted/30 border-muted-foreground/20 h-10 focus-visible:ring-amber-500/50"
                    />
                    <p className="text-[10px] text-muted-foreground font-mono">
                      {formatKES(inputs.productCost)}
                    </p>
                  </div>

                  <div className="space-y-2 col-span-2 md:col-span-1">
                    <Label htmlFor="serviceFee" className="text-foreground font-medium text-xs uppercase tracking-wide">Service Fee (USD)</Label>
                    <Input 
                      id="serviceFee" 
                      type="number" 
                      value={inputs.serviceFee || ''}
                      onChange={(e) => handleInputChange('serviceFee', e.target.value)}
                      placeholder="0"
                      className="bg-muted/30 border-muted-foreground/20 h-10 focus-visible:ring-amber-500/50"
                    />
                    <p className="text-[10px] text-muted-foreground italic">
                      Default: 5.7
                    </p>
                  </div>

                  <div className="space-y-2 col-span-2 md:col-span-1">
                    <Label htmlFor="adsCost" className="text-foreground font-medium text-xs uppercase tracking-wide">Total Ads Cost (USD)</Label>
                    <Input 
                      id="adsCost" 
                      type="number" 
                      value={inputs.adsCost || ''}
                      onChange={(e) => handleInputChange('adsCost', e.target.value)}
                      placeholder="0"
                      className="bg-muted/30 border-muted-foreground/20 h-10 focus-visible:ring-amber-500/50"
                    />
                  </div>

                  <div className="space-y-2 col-span-2 md:col-span-1">
                    <Label htmlFor="otherCost" className="text-foreground font-medium text-xs uppercase tracking-wide">Total Other Cost (USD)</Label>
                    <Input 
                      id="otherCost" 
                      type="number" 
                      value={inputs.otherCost || ''}
                      onChange={(e) => handleInputChange('otherCost', e.target.value)}
                      placeholder="0"
                      className="bg-muted/30 border-muted-foreground/20 h-10 focus-visible:ring-amber-500/50"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-6 mt-auto">
                  <Button onClick={calculate} className="bg-amber-500 hover:bg-amber-600 text-black font-bold flex-1 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02]">
                    Calculate Profit
                  </Button>
                  <Button onClick={reset} variant="outline" className="flex-1 hover:bg-muted/50 border-muted-foreground/20">
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-7 h-full">
            <Card className="border-muted/30 shadow-lg bg-card/80 backdrop-blur-sm h-full">
              <CardHeader className="pb-4 border-b border-muted/20">
                <CardTitle className="text-amber-500 font-bold uppercase text-sm tracking-wider flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" /> Results Analysis
                </CardTitle>
                <p className="text-xs text-muted-foreground">Comprehensive breakdown of your simulation.</p>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {!results ? (
                  <div className="h-[400px] flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-muted/40 rounded-xl bg-muted/5 animate-in fade-in zoom-in-95 duration-500">
                    <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mb-4">
                        <Calculator className="w-8 h-8 opacity-40" />
                    </div>
                    <p className="font-medium">Ready to Simulate</p>
                    <p className="text-sm opacity-60 mt-1">Enter your metrics and click Calculate</p>
                  </div>
                ) : (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    
                    {/* Top Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-muted/20 rounded-xl p-4 border border-muted/20 relative overflow-hidden group hover:border-amber-500/20 transition-colors">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-bl-full -mr-2 -mt-2 transition-transform group-hover:scale-110" />
                            <p className="text-muted-foreground text-xs uppercase tracking-wider font-medium mb-1">Confirmed Orders</p>
                            <p className="text-3xl font-bold tracking-tight">{formatNumber(results.confirmedOrders)}</p>
                            <p className="text-[10px] text-muted-foreground mt-2 font-mono bg-background/50 w-fit px-1.5 py-0.5 rounded">
                                {inputs.confirmationRate}% Rate
                            </p>
                        </div>
                        <div className="bg-muted/20 rounded-xl p-4 border border-muted/20 relative overflow-hidden group hover:border-amber-500/20 transition-colors">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-bl-full -mr-2 -mt-2 transition-transform group-hover:scale-110" />
                            <p className="text-muted-foreground text-xs uppercase tracking-wider font-medium mb-1">Delivered Orders</p>
                            <p className="text-3xl font-bold tracking-tight">{formatNumber(results.deliveredOrders)}</p>
                            <p className="text-[10px] text-muted-foreground mt-2 font-mono bg-background/50 w-fit px-1.5 py-0.5 rounded">
                                {inputs.deliveryRate}% Rate
                            </p>
                        </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-muted/10 border border-muted/20 flex flex-col justify-between h-24">
                          <div className="flex justify-between items-start">
                            <p className="text-muted-foreground text-xs uppercase font-bold">Total Revenue</p>
                            <TrendingUp className="w-4 h-4 text-green-500/50" />
                          </div>
                          <p className="text-2xl font-bold font-mono">{formatCurrency(results.totalRevenue, 'USD')}</p>
                        </div>

                        <div className="p-4 rounded-xl bg-muted/10 border border-muted/20 flex flex-col justify-between h-24">
                          <div className="flex justify-between items-start">
                            <p className="text-muted-foreground text-xs uppercase font-bold">Total Costs</p>
                            <TrendingDown className="w-4 h-4 text-red-500/50" />
                          </div>
                          <p className="text-2xl font-bold font-mono text-red-400">-{formatCurrency(results.totalCosts, 'USD')}</p>
                        </div>
                    </div>

                    {/* Profit Highlight */}
                    <div className={`p-6 rounded-xl border-2 transition-all duration-500 ${results.totalProfit > 0 ? 'bg-green-500/10 border-green-500/20 shadow-[0_0_30px_-10px_rgba(34,197,94,0.2)]' : 'bg-red-500/10 border-red-500/20'}`}>
                        <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                            <div>
                                <p className={`text-sm font-bold uppercase tracking-wider mb-1 ${results.totalProfit > 0 ? 'text-green-500' : 'text-red-500'}`}>Net Profit (USD)</p>
                                <div className={`text-5xl font-black tracking-tighter ${results.totalProfit > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {formatCurrency(results.totalProfit, 'USD')}
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-muted-foreground mb-1">Profit per Delivered</p>
                                <p className={`text-xl font-bold ${results.totalProfit > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {formatCurrency(results.profitPerDelivered, 'USD')}
                                </p>
                            </div>
                        </div>
                    </div>

                  </div>
                )}
              </CardContent>
            </Card>
        </div>
      </div>

      {/* Footer: CPD & CPA Breakdown */}
      {results && (
        <Card className="border-muted/30 shadow-lg bg-card/80 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-8 duration-700">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-muted/20">
            <div>
               <CardTitle className="text-amber-500 font-bold uppercase text-sm tracking-wider">Metrics Breakdown</CardTitle>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/20 px-3 py-1 rounded-full border border-muted/20">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Live Conversion
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent border-muted/20">
                    <TableHead className="font-bold text-xs uppercase tracking-wider pl-6">Metric</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Formula</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-right pr-6">Value Analysis</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="border-muted/20 hover:bg-muted/5 transition-colors">
                    <TableCell className="py-5 pl-6">
                      <div className="font-bold text-sm">CPD</div>
                      <div className="text-muted-foreground text-[10px] uppercase tracking-wide mt-0.5">Cost per Delivered</div>
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground py-5 text-xs">
                      <span className="bg-muted/30 px-2 py-1 rounded border border-muted/30">
                        {inputs.productCost} + {inputs.serviceFee}
                      </span>
                    </TableCell>
                    <TableCell className="text-right py-5 pr-6">
                       <div className="font-bold text-lg">{formatCurrency(results.cpd, 'USD')}</div>
                       <div className="text-muted-foreground text-[10px] font-mono mt-0.5">{formatKES(results.cpd)}</div>
                    </TableCell>
                  </TableRow>
                  
                  <TableRow className="border-muted/20 hover:bg-muted/5 transition-colors">
                    <TableCell className="py-5 pl-6">
                      <div className="font-bold text-sm">CPA</div>
                      <div className="text-muted-foreground text-[10px] uppercase tracking-wide mt-0.5">Ads per Order</div>
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground py-5 text-xs">
                      <span className="bg-muted/30 px-2 py-1 rounded border border-muted/30">
                        {inputs.adsCost} ÷ {inputs.totalOrders}
                      </span>
                    </TableCell>
                    <TableCell className="text-right py-5 pr-6">
                       <div className="font-bold text-lg">{formatCurrency(results.cpa, 'USD')}</div>
                       <div className="text-muted-foreground text-[10px] font-mono mt-0.5">{formatKES(results.cpa)}</div>
                    </TableCell>
                  </TableRow>

                  <TableRow className="border-muted/20 hover:bg-muted/5 transition-colors">
                    <TableCell className="py-5 pl-6">
                      <div className="font-bold text-sm">CPA (Delivered)</div>
                      <div className="text-muted-foreground text-[10px] uppercase tracking-wide mt-0.5">Ads per Delivered</div>
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground py-5 text-xs">
                      <span className="bg-muted/30 px-2 py-1 rounded border border-muted/30">
                        {inputs.adsCost} ÷ {Math.round(results.deliveredOrders)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right py-5 pr-6">
                       <div className="font-bold text-lg">{formatCurrency(results.cpaDelivered, 'USD')}</div>
                       <div className="text-muted-foreground text-[10px] font-mono mt-0.5">{formatKES(results.cpaDelivered)}</div>
                    </TableCell>
                  </TableRow>

                  <TableRow className="bg-amber-500/5 hover:bg-amber-500/10 border-0 transition-colors">
                    <TableCell className="py-6 pl-6">
                      <div className="font-bold text-amber-500 text-sm">Total Delivery Cost</div>
                      <div className="text-amber-500/70 text-[10px] uppercase tracking-wide mt-0.5">Real Cost per Delivered</div>
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground py-6 text-xs">
                      <span className="bg-background/50 px-2 py-1 rounded border border-muted/30 text-amber-500/80">
                         CPD + CPA(delivered)
                      </span>
                    </TableCell>
                    <TableCell className="text-right py-6 pr-6">
                       <div className="font-black text-xl text-amber-500">{formatCurrency(results.tdc, 'USD')}</div>
                       <div className="text-amber-500/70 text-[10px] font-mono mt-0.5">{formatKES(results.tdc)}</div>
                    </TableCell>
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