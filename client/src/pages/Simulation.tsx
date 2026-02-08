import { useState } from "react";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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
    costPerLead: 1,
    adsCost: 180,
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
    const numVal = value === '' ? 0 : parseFloat(value);
    setInputs(prev => {
      const next = { ...prev, [field]: numVal };
      if (field === 'costPerLead') {
        next.adsCost = parseFloat((numVal * prev.totalOrders).toFixed(2));
      } else if (field === 'adsCost') {
        next.costPerLead = prev.totalOrders > 0 ? parseFloat((numVal / prev.totalOrders).toFixed(4)) : 0;
      } else if (field === 'totalOrders') {
        next.adsCost = parseFloat((prev.costPerLead * numVal).toFixed(2));
      }
      return next;
    });
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
      costPerLead: 0,
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
    // If we're capturing the whole page or a large area, we might want to target a specific wrapper
    // that includes everything: Inputs, Results, and the Breakdown table.
    // Currently ref is on the grid, which includes Inputs and Results.
    // The breakdown table is OUTSIDE that grid.
    
    // Let's target the parent container. Since we can't easily move the ref to the top-level div 
    // without refactoring the whole component return, let's just use document.getElementById 
    // or wrap the content we want in a new div with an ID.
    
    const element = document.getElementById('simulation-content');
    if (!element) return;

    try {
      // Temporarily expand height or handle scrolling if needed, but for now just capture
      const dataUrl = await toPng(element, { cacheBust: true, backgroundColor: '#000000' }); // assuming dark mode or set appropriate bg
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`cod-simulation-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.pdf`);
      toast({ title: "PDF Downloaded", description: "Your full report is ready." });
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
    <div className="space-y-8 max-w-7xl mx-auto pb-10" id="simulation-content">
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
              <CardContent className="space-y-6 pt-6 flex-1" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); calculate(); } }}>
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
                    <Label htmlFor="costPerLead" className="text-foreground font-medium text-xs uppercase tracking-wide">Cost per Lead (USD)</Label>
                    <Input 
                      id="costPerLead" 
                      type="number" 
                      step="0.01"
                      value={inputs.costPerLead || ''}
                      onChange={(e) => handleInputChange('costPerLead', e.target.value)}
                      placeholder="0"
                      className="bg-muted/30 border-muted-foreground/20 h-10 focus-visible:ring-blue-500/50"
                      data-testid="input-cost-per-lead"
                    />
                    <p className="text-[10px] text-muted-foreground font-mono">
                      {inputs.totalOrders > 0 ? `${inputs.costPerLead} × ${inputs.totalOrders} orders` : 'Set total orders first'}
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
                      data-testid="input-ads-cost"
                    />
                    <p className="text-[10px] text-blue-500/70 font-mono">
                      Auto-calculated from CPL × Orders
                    </p>
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
        <div className="lg:col-span-7 h-full">
            <Card className="border-muted/30 shadow-lg bg-card/80 backdrop-blur-sm h-full">
              <CardHeader className="pb-4 border-b border-muted/20">
                <CardTitle className="text-blue-500 font-bold uppercase text-sm tracking-wider flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" /> Results
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {!results ? (
                  <div className="h-[400px] flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-muted/40 rounded-xl bg-muted/5">
                    <Calculator className="w-10 h-10 opacity-30 mb-3" />
                    <p className="font-medium">Ready to Simulate</p>
                    <p className="text-sm opacity-60 mt-1">Enter your metrics and press Enter</p>
                  </div>
                ) : (
                  <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">

                    {/* Profit Hero */}
                    <div className={`p-5 rounded-2xl border-2 ${results.totalProfit > 0 ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                      <p className={`text-[11px] font-bold uppercase tracking-widest mb-2 ${results.totalProfit > 0 ? 'text-green-500' : 'text-red-500'}`}>Net Profit</p>
                      <div className="flex items-end justify-between gap-4">
                        <div className={`text-5xl font-black tracking-tight tabular-nums ${results.totalProfit > 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {formatCurrency(results.totalProfit, 'USD')}
                        </div>
                        <div className="text-right pb-1">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Per Delivered</p>
                          <p className={`text-2xl font-bold tabular-nums ${results.totalProfit > 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {formatCurrency(results.profitPerDelivered, 'USD')}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Orders Row */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-muted/30 bg-muted/5 p-4">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-2">Confirmed Orders</p>
                        <div className="flex items-baseline gap-2">
                          <Input
                            type="number"
                            value={results.confirmedOrders || ''}
                            min={0}
                            max={inputs.totalOrders}
                            onChange={(e) => {
                              let val = parseFloat(e.target.value) || 0;
                              if (val > inputs.totalOrders) val = inputs.totalOrders;
                              if (val < 0) val = 0;
                              const newRate = inputs.totalOrders > 0 ? parseFloat(((val / inputs.totalOrders) * 100).toFixed(2)) : 0;
                              const newDelivered = (val * inputs.deliveryRate) / 100;
                              setInputs(prev => ({ ...prev, confirmationRate: newRate }));
                              setResults(prev => prev ? { ...prev, confirmedOrders: val, deliveredOrders: newDelivered } : prev);
                            }}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); calculate(); } }}
                            className="text-3xl font-black tabular-nums bg-transparent border-none p-0 h-auto w-24 focus-visible:ring-0 focus-visible:ring-offset-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            data-testid="input-confirmed-orders"
                          />
                          <span className="text-xs text-muted-foreground font-mono bg-muted/30 px-2 py-0.5 rounded-full">{inputs.confirmationRate}%</span>
                        </div>
                      </div>
                      <div className="rounded-xl border border-muted/30 bg-muted/5 p-4">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-2">Delivered Orders</p>
                        <div className="flex items-baseline gap-2">
                          <Input
                            type="number"
                            value={results.deliveredOrders || ''}
                            min={0}
                            max={results.confirmedOrders}
                            onChange={(e) => {
                              let val = parseFloat(e.target.value) || 0;
                              if (val > results.confirmedOrders) val = results.confirmedOrders;
                              if (val < 0) val = 0;
                              const newRate = results.confirmedOrders > 0 ? parseFloat(((val / results.confirmedOrders) * 100).toFixed(2)) : 0;
                              setInputs(prev => ({ ...prev, deliveryRate: newRate }));
                              setResults(prev => prev ? { ...prev, deliveredOrders: val } : prev);
                            }}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); calculate(); } }}
                            className="text-3xl font-black tabular-nums bg-transparent border-none p-0 h-auto w-24 focus-visible:ring-0 focus-visible:ring-offset-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            data-testid="input-delivered-orders"
                          />
                          <span className="text-xs text-muted-foreground font-mono bg-muted/30 px-2 py-0.5 rounded-full">{inputs.deliveryRate}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Revenue & Costs */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-muted/30 bg-muted/5 p-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Revenue</p>
                          <TrendingUp className="w-3.5 h-3.5 text-green-500/60" />
                        </div>
                        <p className="text-2xl font-black tabular-nums text-foreground">{formatCurrency(results.totalRevenue, 'USD')}</p>
                      </div>
                      <div className="rounded-xl border border-muted/30 bg-muted/5 p-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Costs</p>
                          <TrendingDown className="w-3.5 h-3.5 text-red-500/60" />
                        </div>
                        <p className="text-2xl font-black tabular-nums text-red-400">-{formatCurrency(results.totalCosts, 'USD')}</p>
                      </div>
                    </div>

                    {/* CPD / CPA / CPAD */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-xl border-2 border-blue-500/20 bg-blue-500/5 p-4 text-center">
                        <p className="text-[10px] text-blue-400 uppercase tracking-widest font-bold mb-1">CPD</p>
                        <p className="text-2xl font-black tabular-nums text-blue-500">{formatCurrency(results.tdc, 'USD')}</p>
                        <p className="text-[9px] text-muted-foreground mt-1">Total Delivery Cost</p>
                      </div>
                      <div className="rounded-xl border border-muted/30 bg-muted/5 p-4 text-center">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">CPA</p>
                        <p className="text-2xl font-black tabular-nums">{formatCurrency(results.cpa, 'USD')}</p>
                        <p className="text-[9px] text-muted-foreground mt-1">Ads / Order</p>
                      </div>
                      <div className="rounded-xl border border-muted/30 bg-muted/5 p-4 text-center">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">CPAD</p>
                        <p className="text-2xl font-black tabular-nums">{formatCurrency(results.cpaDelivered, 'USD')}</p>
                        <p className="text-[9px] text-muted-foreground mt-1">Ads / Delivered</p>
                      </div>
                    </div>

                  </div>
                )}
              </CardContent>
            </Card>
        </div>
      </div>

      {/* Simulation History */}
      <Card className="border-muted/30 shadow-lg bg-card/80 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-muted/20">
          <div>
            <CardTitle className="text-blue-500 font-bold uppercase text-sm tracking-wider flex items-center gap-2">
              <History className="w-4 h-4" /> Simulation History
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Your previously saved simulations.</p>
          </div>
          <Badge variant="outline" className="text-xs font-mono">
            {simulations?.length || 0} saved
          </Badge>
        </CardHeader>
        <CardContent className="pt-4">
          {!simulations?.length ? (
            <div className="text-center py-10 text-muted-foreground">
              <History className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">No saved simulations yet.</p>
              <p className="text-sm opacity-60 mt-1">Calculate and save a simulation to see it here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {simulations.map((sim) => (
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}