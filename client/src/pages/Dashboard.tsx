import { useStore } from "@/lib/store";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo } from "react";
import { ArrowUpRight, ArrowDownRight, DollarSign, TrendingUp, ShoppingCart, CreditCard } from "lucide-react";

export default function Dashboard() {
  const { countries, analysis } = useStore();
  const [selectedCountryId, setSelectedCountryId] = useState<string>("all");

  const stats = useMemo(() => {
    let totalRevenue = 0;
    let totalAds = 0;
    let totalFees = 0;
    let totalProfit = 0;

    // Iterate through all countries or selected country
    const countriesToProcess = selectedCountryId === "all" 
      ? countries 
      : countries.filter(c => c.id === selectedCountryId);

    countriesToProcess.forEach(country => {
      const countryData = analysis[country.id] || {};
      Object.values(countryData).forEach(prodStats => {
        totalRevenue += prodStats.revenue || 0;
        totalAds += prodStats.ads || 0;
        totalFees += (prodStats.serviceFees || 0) + (prodStats.productFees || 0);
        // Profit calculation handled below
      });
    });

    totalProfit = totalRevenue - totalAds - totalFees;
    
    // Currency display logic: if "all", show generic symbol or USD, else show specific
    const displayCurrency = selectedCountryId === "all" ? "USD" : countries.find(c => c.id === selectedCountryId)?.currency || "USD";

    return { totalRevenue, totalAds, totalFees, totalProfit, displayCurrency };
  }, [selectedCountryId, countries, analysis]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">Overview of your e-commerce performance.</p>
        </div>
        <Select value={selectedCountryId} onValueChange={setSelectedCountryId}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Countries" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Countries</SelectItem>
            {countries.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue, stats.displayCurrency)}</div>
            <p className="text-xs text-muted-foreground mt-1">
               Across all products
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ads Spend</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalAds, stats.displayCurrency)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Marketing investment
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fees</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalFees, stats.displayCurrency)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Service & Product fees
            </p>
          </CardContent>
        </Card>
        
        <Card className={`hover:shadow-md transition-shadow border-l-4 ${stats.totalProfit >= 0 ? 'border-l-green-500' : 'border-l-red-500'}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            {stats.totalProfit >= 0 ? (
               <ArrowUpRight className="h-4 w-4 text-green-500" />
            ) : (
               <ArrowDownRight className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(stats.totalProfit, stats.displayCurrency)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Net earnings
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Placeholder for future charts or detailed breakdown */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-md bg-muted/20">
              Activity Chart Placeholder
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
           <CardHeader>
            <CardTitle>Top Countries</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
               {countries.slice(0, 5).map(c => (
                 <div key={c.id} className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-primary" />
                     <span className="text-sm font-medium">{c.name}</span>
                   </div>
                   <span className="text-sm text-muted-foreground">{c.currency}</span>
                 </div>
               ))}
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
