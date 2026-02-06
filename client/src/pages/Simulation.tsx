import { useState } from "react";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { RotateCcw, Calculator, DollarSign, TrendingUp, TrendingDown, Package, CheckCircle, Truck, Coins, Save, History, Trash2, ArrowUpRight, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { useRef } from 'react';

export default function Simulation() {
  const { simulations, saveSimulation, deleteSimulation } = useStore();
  const { toast } = useToast();
  const resultsRef = useRef<HTMLDivElement>(null);
  const [simulationName, setSimulationName] = useState("");
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

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

  const handleSave = () => {
    if (!results) return;
    if (!simulationName.trim()) {
      toast({ title: "Name required", description: "Please enter a name for your simulation.", variant: "destructive" });
      return;
    }

    saveSimulation({
      name: simulationName,
      inputs,
      results
    });

    setSimulationName("");
    setIsSaveDialogOpen(false);
    toast({ title: "Simulation Saved", description: "Your simulation has been saved to history." });
  };

  const loadSimulation = (sim: any) => {
    setInputs(sim.inputs);
    // Recalculate results based on loaded inputs to ensure consistency
    // Alternatively, we could just set results directly from history if we trust it
    // But since `calculate` depends on `inputs` state, we might need to manually trigger it or set results state
    setResults(sim.results); 
    setIsHistoryOpen(false);
    toast({ title: "Simulation Loaded", description: `Loaded "${sim.name}"` });
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteSimulation(id);
    toast({ title: "Deleted", description: "Simulation removed from history." });
  };

  const handleDownloadPDF = async () => {
    if (!resultsRef.current) return;

    try {
      const dataUrl = await toPng(resultsRef.current, { cacheBust: true });
      const pdf = new jsPDF();
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`cod-simulation-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.pdf`);
      toast({ title: "PDF Downloaded", description: "Your simulation report is ready." });
    } catch (err) {
      console.error(err);
      toast({ title: "Download Failed", description: "Could not generate PDF.", variant: "destructive" });
    }
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
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent w-fit">COD Simulator</h2>
          <p className="text-muted-foreground mt-1">
            Analyze profitability with real-time currency conversion (1 USD = 130 KES).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2 border-blue-500/20 hover:bg-blue-500/10">
                <History className="w-4 h-4 text-blue-500" />
                History
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>Simulation History</DialogTitle>
                <DialogDescription>View and load your previously saved calculations.</DialogDescription>
              </DialogHeader>
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-4 py-4">
                  {simulations?.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                      <History className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p>No saved simulations yet.</p>
                    </div>
                  ) : (
                    simulations?.map((sim) => (
                      <div 
                        key={sim.id} 
                        className="group flex items-center justify-between p-4 rounded-xl border border-muted/40 bg-card hover:border-blue-500/30 hover:bg-muted/30 transition-all cursor-pointer"
                        onClick={() => loadSimulation(sim)}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-foreground group-hover:text-blue-500 transition-colors">{sim.name}</h4>
                            <Badge variant="secondary" className="text-[10px] font-mono">
                              {format(new Date(sim.date), 'MMM d, HH:mm')}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Package className="w-3 h-3" /> {sim.inputs.totalOrders} Orders
                            </span>
                            <span className={`flex items-center gap-1 font-medium ${sim.results.totalProfit > 0 ? 'text-green-500' : 'text-red-500'}`}>
                              <DollarSign className="w-3 h-3" /> Profit: {formatCurrency(sim.results.totalProfit, 'USD')}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="sm" variant="ghost" className="gap-1 text-xs">
                            Load <ArrowUpRight className="w-3 h-3" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                            onClick={(e) => handleDelete(sim.id, e)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>

          <Badge variant="outline" className="text-sm px-4 py-1.5 h-auto bg-blue-500/10 border-blue-500/30 text-blue-500 gap-2 backdrop-blur-sm">
            <Coins className="w-4 h-4" />
            <span>Currency: USD ($)</span>
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Inputs */}
        <div className="lg:col-span-5 h-full">
            <Card className="border-muted/30 shadow-lg bg-card/80 backdrop-blur-sm h-full flex flex-col">
              <CardHeader className="pb-4 border-b border-muted/20">
                <CardTitle className="text-blue-500 font-bold uppercase text-sm tracking-wider flex items-center gap-2">
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
                          className="bg-muted/30 border-muted-foreground/20 h-10 focus-visible:ring-blue-500/50 pl-9"
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
                          className="bg-muted/30 border-muted-foreground/20 h-10 focus-visible:ring-blue-500/50 pl-9"
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
                          className="bg-muted/30 border-muted-foreground/20 h-10 focus-visible:ring-blue-500/50 pl-9"
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
                          className="bg-muted/30 border-muted-foreground/20 h-10 focus-visible:ring-blue-500/50 pl-9"
                        />
                        <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/50" />
                    </div>
                    <p className="text-[10px] text-blue-500/70 font-mono">
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
                      className="bg-muted/30 border-muted-foreground/20 h-10 focus-visible:ring-blue-500/50"
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
                      className="bg-muted/30 border-muted-foreground/20 h-10 focus-visible:ring-blue-500/50"
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
                      className="bg-muted/30 border-muted-foreground/20 h-10 focus-visible:ring-blue-500/50"
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
                      className="bg-muted/30 border-muted-foreground/20 h-10 focus-visible:ring-blue-500/50"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-6 mt-auto">
                  <Button onClick={calculate} className="bg-blue-600 hover:bg-blue-700 text-white font-bold flex-1 shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02]">
                    Calculate Profit
                  </Button>
                  
                  {results && (
                    <>
                      <Button onClick={handleDownloadPDF} variant="outline" className="flex-none gap-2 hover:bg-blue-500/10 hover:text-blue-500 border-blue-200/20 px-3">
                        <Download className="w-4 h-4" />
                      </Button>
                      
                      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="flex-1 gap-2 hover:bg-blue-500/10 hover:text-blue-500 border-blue-200/20">
                            <Save className="w-4 h-4" />
                            Save Result
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Save Simulation</DialogTitle>
                          <DialogDescription>
                            Give this simulation a name to find it easily later.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                              id="name"
                              value={simulationName}
                              onChange={(e) => setSimulationName(e.target.value)}
                              placeholder="e.g. Q1 T-Shirt Campaign"
                              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>Cancel</Button>
                          <Button onClick={handleSave}>Save</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    </>
                  )}

                  <Button onClick={reset} variant="outline" className="flex-none hover:bg-muted/50 border-muted-foreground/20">
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-7 h-full" ref={resultsRef}>
            <Card className="border-muted/30 shadow-lg bg-card/80 backdrop-blur-sm h-full">
              <CardHeader className="pb-4 border-b border-muted/20">
                <CardTitle className="text-blue-500 font-bold uppercase text-sm tracking-wider flex items-center gap-2">
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
                        <div className="bg-muted/20 rounded-xl p-4 border border-muted/20 relative overflow-hidden group hover:border-blue-500/20 transition-colors">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-bl-full -mr-2 -mt-2 transition-transform group-hover:scale-110" />
                            <p className="text-muted-foreground text-xs uppercase tracking-wider font-medium mb-1">Confirmed Orders</p>
                            <p className="text-3xl font-bold tracking-tight">{formatNumber(results.confirmedOrders)}</p>
                            <p className="text-[10px] text-muted-foreground mt-2 font-mono bg-background/50 w-fit px-1.5 py-0.5 rounded">
                                {inputs.confirmationRate}% Rate
                            </p>
                        </div>
                        <div className="bg-muted/20 rounded-xl p-4 border border-muted/20 relative overflow-hidden group hover:border-blue-500/20 transition-colors">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-bl-full -mr-2 -mt-2 transition-transform group-hover:scale-110" />
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
               <CardTitle className="text-blue-500 font-bold uppercase text-sm tracking-wider">Metrics Breakdown</CardTitle>
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

                  <TableRow className="bg-blue-500/5 hover:bg-blue-500/10 border-0 transition-colors">
                    <TableCell className="py-6 pl-6">
                      <div className="font-bold text-blue-500 text-sm">Total Delivery Cost</div>
                      <div className="text-blue-500/70 text-[10px] uppercase tracking-wide mt-0.5">Real Cost per Delivered</div>
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground py-6 text-xs">
                      <span className="bg-background/50 px-2 py-1 rounded border border-muted/30 text-blue-500/80">
                         CPD + CPA(delivered)
                      </span>
                    </TableCell>
                    <TableCell className="text-right py-6 pr-6">
                       <div className="font-black text-xl text-blue-500">{formatCurrency(results.tdc, 'USD')}</div>
                       <div className="text-blue-500/70 text-[10px] font-mono mt-0.5">{formatKES(results.tdc)}</div>
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