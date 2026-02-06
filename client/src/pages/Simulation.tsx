import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { RotateCcw, Calculator, DollarSign } from "lucide-react";
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">COD Simulator (USD)</h2>
          <p className="text-muted-foreground mt-1">
            Confirmation % + Delivery % + Profit, with USD→KES hints (1 USD = 130 KES).
          </p>
        </div>
        <Badge variant="outline" className="text-sm px-4 py-1.5 h-auto bg-muted/20 border-yellow-500/20 text-yellow-500 gap-2">
          <span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" />
          Currency: USD ($)
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Inputs */}
        <Card className="border-muted/30 shadow-md bg-card/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-amber-500 font-bold uppercase text-sm tracking-wider">Inputs</CardTitle>
            <p className="text-sm text-muted-foreground">Delivered rate is calculated from Confirmed.</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="totalOrders" className="text-muted-foreground">Total Orders</Label>
                <Input 
                  id="totalOrders" 
                  type="number" 
                  value={inputs.totalOrders || ''}
                  onChange={(e) => handleInputChange('totalOrders', e.target.value)}
                  placeholder="0"
                  className="bg-muted/30 border-muted-foreground/20 h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmationRate" className="text-muted-foreground">Confirmation Rate (%)</Label>
                <Input 
                  id="confirmationRate" 
                  type="number" 
                  value={inputs.confirmationRate || ''}
                  onChange={(e) => handleInputChange('confirmationRate', e.target.value)}
                  placeholder="0"
                  className="bg-muted/30 border-muted-foreground/20 h-10"
                />
                <p className="text-[10px] text-muted-foreground italic">
                  Confirmed = Total × Confirmation %
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deliveryRate" className="text-muted-foreground">Delivery Rate (%)</Label>
                <Input 
                  id="deliveryRate" 
                  type="number" 
                  value={inputs.deliveryRate || ''}
                  onChange={(e) => handleInputChange('deliveryRate', e.target.value)}
                  placeholder="0"
                  className="bg-muted/30 border-muted-foreground/20 h-10"
                />
                <p className="text-[10px] text-muted-foreground italic">
                  Delivered = Confirmed × Delivery %
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sellingPrice" className="text-muted-foreground">Selling Price per Delivered Order (USD)</Label>
                <Input 
                  id="sellingPrice" 
                  type="number" 
                  value={inputs.sellingPrice || ''}
                  onChange={(e) => handleInputChange('sellingPrice', e.target.value)}
                  placeholder="0"
                  className="bg-muted/30 border-muted-foreground/20 h-10"
                />
                <p className="text-[10px] text-muted-foreground">
                  {formatKES(inputs.sellingPrice)}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="productCost" className="text-muted-foreground">Product Cost per Delivered Order (USD)</Label>
                <Input 
                  id="productCost" 
                  type="number" 
                  value={inputs.productCost || ''}
                  onChange={(e) => handleInputChange('productCost', e.target.value)}
                  placeholder="0"
                  className="bg-muted/30 border-muted-foreground/20 h-10"
                />
                <p className="text-[10px] text-muted-foreground">
                  {formatKES(inputs.productCost)}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="serviceFee" className="text-muted-foreground">Service Fee per Delivered Order (USD)</Label>
                <Input 
                  id="serviceFee" 
                  type="number" 
                  value={inputs.serviceFee || ''}
                  onChange={(e) => handleInputChange('serviceFee', e.target.value)}
                  placeholder="0"
                  className="bg-muted/30 border-muted-foreground/20 h-10"
                />
                <p className="text-[10px] text-muted-foreground italic">
                  Default set to 5.7
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adsCost" className="text-muted-foreground">Ads Cost (Total) (USD)</Label>
                <Input 
                  id="adsCost" 
                  type="number" 
                  value={inputs.adsCost || ''}
                  onChange={(e) => handleInputChange('adsCost', e.target.value)}
                  placeholder="0"
                  className="bg-muted/30 border-muted-foreground/20 h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="otherCost" className="text-muted-foreground">Other Cost (Total) (USD)</Label>
                <Input 
                  id="otherCost" 
                  type="number" 
                  value={inputs.otherCost || ''}
                  onChange={(e) => handleInputChange('otherCost', e.target.value)}
                  placeholder="0"
                  className="bg-muted/30 border-muted-foreground/20 h-10"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button onClick={calculate} className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold w-32">
                Calculate
              </Button>
              <Button onClick={reset} variant="ghost" className="w-32 hover:bg-muted/50">
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Results */}
        <Card className="border-muted/30 shadow-md bg-card/50 h-full">
          <CardHeader className="pb-4">
            <CardTitle className="text-amber-500 font-bold uppercase text-sm tracking-wider">Results</CardTitle>
            <p className="text-sm text-muted-foreground">Profit blocks turn green when profitable.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {!results ? (
              <div className="h-64 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-muted rounded-lg bg-muted/5">
                <Calculator className="w-10 h-10 mb-4 opacity-50" />
                <p>Click Calculate to see results</p>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in duration-300">
                
                {/* Result Row */}
                <div className="flex justify-between items-center p-4 rounded-lg bg-muted/20 border border-muted/20">
                  <div>
                    <p className="text-muted-foreground font-medium">Confirmed Orders</p>
                    <p className="text-xs text-muted-foreground/60 italic">total × confirmation %</p>
                  </div>
                  <p className="text-2xl font-bold">{formatNumber(results.confirmedOrders)}</p>
                </div>

                <div className="flex justify-between items-center p-4 rounded-lg bg-muted/20 border border-muted/20">
                  <div>
                    <p className="text-muted-foreground font-medium">Delivered Orders</p>
                    <p className="text-xs text-muted-foreground/60 italic">confirmed × delivery %</p>
                  </div>
                  <p className="text-2xl font-bold">{formatNumber(results.deliveredOrders)}</p>
                </div>

                <div className="flex justify-between items-center p-4 rounded-lg bg-muted/20 border border-muted/20">
                  <div>
                    <p className="text-muted-foreground font-medium">Total Revenue (USD)</p>
                    <p className="text-xs text-muted-foreground/60 italic">delivered × selling price</p>
                  </div>
                  <p className="text-2xl font-bold">{formatCurrency(results.totalRevenue, 'USD')}</p>
                </div>

                <div className="flex justify-between items-center p-4 rounded-lg bg-muted/20 border border-muted/20">
                  <div>
                    <p className="text-muted-foreground font-medium">Total Costs (USD)</p>
                    <p className="text-xs text-muted-foreground/60 italic">product + service + ads + other</p>
                  </div>
                  <p className="text-2xl font-bold">{formatCurrency(results.totalCosts, 'USD')}</p>
                </div>

                <div className="flex justify-between items-center p-4 rounded-lg bg-muted/10 border border-muted/20 mt-6">
                  <div>
                    <p className="text-muted-foreground font-medium">Total Profit (USD)</p>
                    <p className="text-xs text-muted-foreground/60 italic">revenue - costs</p>
                  </div>
                  <div className={`text-3xl font-bold ${results.totalProfit > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatCurrency(results.totalProfit, 'USD')}
                  </div>
                </div>

                <div className="flex justify-between items-center p-4 rounded-lg bg-muted/10 border border-muted/20">
                  <div>
                    <p className="text-muted-foreground font-medium">Profit per Delivered Order (USD)</p>
                    <p className="text-xs text-muted-foreground/60 italic">profit ÷ delivered</p>
                  </div>
                  <div className={`text-3xl font-bold ${results.totalProfit > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatCurrency(results.profitPerDelivered, 'USD')}
                  </div>
                </div>

              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Footer: CPD & CPA Breakdown */}
      {results && (
        <Card className="border-muted/30 shadow-md bg-card/50 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
               <CardTitle className="text-amber-500 font-bold uppercase text-sm tracking-wider">CPD & CPA Breakdown</CardTitle>
               <p className="text-sm text-muted-foreground mt-1">This section is a separate footer-like table. Values update when you click Calculate.</p>
            </div>
            <Badge variant="outline" className="text-sm px-4 py-1.5 h-auto bg-muted/20 border-yellow-500/20 text-muted-foreground gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" />
              USD → KES: 130
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-muted/20 overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/20">
                  <TableRow className="hover:bg-transparent border-muted/20">
                    <TableHead className="font-bold">Metric</TableHead>
                    <TableHead className="font-bold">Formula</TableHead>
                    <TableHead className="font-bold text-right">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="border-muted/20 hover:bg-muted/5">
                    <TableCell className="py-4">
                      <div className="font-medium text-base">CPD</div>
                      <div className="text-muted-foreground text-xs">Cost per Delivered</div>
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground py-4">
                      CPD = {inputs.productCost} + {inputs.serviceFee}
                    </TableCell>
                    <TableCell className="text-right py-4">
                       <div className="font-bold text-lg">{formatCurrency(results.cpd, 'USD')}</div>
                       <div className="text-muted-foreground text-xs font-mono">{formatKES(results.cpd)}</div>
                    </TableCell>
                  </TableRow>
                  
                  <TableRow className="border-muted/20 hover:bg-muted/5">
                    <TableCell className="py-4">
                      <div className="font-medium text-base">CPA</div>
                      <div className="text-muted-foreground text-xs">Ads per Order</div>
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground py-4">
                      CPA = {inputs.adsCost} ÷ {inputs.totalOrders}
                    </TableCell>
                    <TableCell className="text-right py-4">
                       <div className="font-bold text-lg">{formatCurrency(results.cpa, 'USD')}</div>
                       <div className="text-muted-foreground text-xs font-mono">{formatKES(results.cpa)}</div>
                    </TableCell>
                  </TableRow>

                  <TableRow className="border-muted/20 hover:bg-muted/5">
                    <TableCell className="py-4">
                      <div className="font-medium text-base">CPA (Delivered)</div>
                      <div className="text-muted-foreground text-xs">Ads per Delivered</div>
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground py-4">
                      CPA(delivered) = {inputs.adsCost} ÷ {Math.round(results.deliveredOrders)}
                    </TableCell>
                    <TableCell className="text-right py-4">
                       <div className="font-bold text-lg">{formatCurrency(results.cpaDelivered, 'USD')}</div>
                       <div className="text-muted-foreground text-xs font-mono">{formatKES(results.cpaDelivered)}</div>
                    </TableCell>
                  </TableRow>

                  <TableRow className="border-muted/20 bg-muted/10 hover:bg-muted/15">
                    <TableCell className="py-4">
                      <div className="font-medium text-base">Total Delivery Cost</div>
                      <div className="text-muted-foreground text-xs">per Delivered</div>
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground py-4">
                      TDC = CPD + CPA(delivered) = {results.cpd.toFixed(0)} + {results.cpaDelivered.toFixed(1).replace('.', ',')}
                    </TableCell>
                    <TableCell className="text-right py-4">
                       <div className="font-bold text-lg">{formatCurrency(results.tdc, 'USD')}</div>
                       <div className="text-muted-foreground text-xs font-mono">{formatKES(results.tdc)}</div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 text-xs text-muted-foreground">
              Tip: Total Delivery Cost helps you see real cost per delivered order (CPD + ads per delivered).
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}