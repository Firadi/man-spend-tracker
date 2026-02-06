import { useState, useMemo, useEffect } from "react";
import { useStore, Product, SelectedAdSet } from "@/lib/store";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle, GripHorizontal, Save, Eye, Download, FileSpreadsheet, FileImage, FileType, Search, Filter, Facebook, X, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import * as XLSX from 'xlsx';
import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Column {
  id: string;
  label: string;
  align: 'left' | 'right' | 'center';
  width?: string;
  editable?: boolean;
}

const ALL_COLUMNS: Column[] = [
  { id: 'product', label: 'Product', align: 'left', width: 'min-w-[200px]' },
  { id: 'totalOrders', label: 'Total Orders', align: 'right', width: 'w-[120px]', editable: true },
  { id: 'ordersConfirmed', label: 'Ord. Confirmed', align: 'right', width: 'w-[120px]', editable: true },
  { id: 'confirmationRate', label: 'Conf. Rate (%)', align: 'right', width: 'w-[100px]' },
  { id: 'deliveredOrders', label: 'Delivered Order', align: 'right', width: 'w-[140px]', editable: true },
  { id: 'deliveryRate', label: 'Del. Rate (%)', align: 'right', width: 'w-[100px]' },
  { id: 'deliveryRatePerLead', label: 'Del. Rate/Lead', align: 'right', width: 'w-[120px]' },
  { id: 'revenue', label: 'Revenue', align: 'right', width: 'w-[140px]', editable: true },
  { id: 'ads', label: 'Ads', align: 'right', width: 'w-[140px]', editable: true },
  { id: 'serviceFees', label: 'Service Fees', align: 'right', width: 'w-[140px]', editable: true },
  { id: 'productFees', label: 'Prod. Fees', align: 'right', width: 'w-[140px]', editable: true },
  { id: 'profit', label: 'Profit', align: 'right', width: 'w-[140px]' },
  { id: 'facebookLink', label: 'FB Link', align: 'center', width: 'w-[80px]' },
];

function CircularProgress({ value, size = 40, strokeWidth = 3 }: { value: number, size?: number, strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = Math.min(100, Math.max(0, value));
  const offset = circumference - (progress / 100) * circumference;
  
  const isGood = value >= 50;
  const colorClass = isGood ? "text-green-500" : "text-red-500";
  const bgClass = isGood ? "text-green-100" : "text-red-100";

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          className={bgClass}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={colorClass}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-[10px] font-medium">{Math.round(value)}%</span>
    </div>
  );
}

function SortableHeader({ id, column }: { id: string, column: Column }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 'auto',
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <TableHead 
      ref={setNodeRef} 
      style={style} 
      className={`${column.width} text-${column.align} ${id === 'profit' ? 'font-bold' : ''} bg-background group cursor-move select-none`}
      {...attributes} 
      {...listeners}
    >
      <div className={`flex items-center gap-2 ${column.align === 'center' ? 'justify-center' : 'justify-end'} ${column.align === 'left' ? 'justify-start' : ''}`}>
         {column.align === 'left' && <span>{column.label}</span>}
         {column.align !== 'left' && column.align !== 'center' && <GripHorizontal className="w-4 h-4 text-muted-foreground/30 group-hover:text-muted-foreground/60" />}
         {column.align !== 'left' && <span>{column.label}</span>}
         {column.align === 'center' && <GripHorizontal className="w-4 h-4 text-muted-foreground/30 group-hover:text-muted-foreground/60 ml-2" />}
      </div>
    </TableHead>
  );
}

export default function Analyse() {
  const { 
    countries, 
    products, 
    analysis, 
    updateAnalysis, 
    columnOrder, 
    setColumnOrder, 
    updateCountry,
    productAdsSpend,
    updateProductAdsSpend,
    tempSelectedAdSets,
    setTempSelectedAdSets
  } = useStore();
  
  const [selectedCountryId, setSelectedCountryId] = useState<string>(countries[0]?.id || "");
  const [showDrafts, setShowDrafts] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [profitFilter, setProfitFilter] = useState<'all' | 'profitable' | 'loss'>('all');
  const [viewProduct, setViewProduct] = useState<any | null>(null);
  
  // Facebook Link Modal State
  const [fbLinkModalOpen, setFbLinkModalOpen] = useState(false);
  const [activeLinkingProduct, setActiveLinkingProduct] = useState<Product | null>(null);
  const [stagedLinkedAdSets, setStagedLinkedAdSets] = useState<SelectedAdSet[]>([]);
  const [stagedAdsSpend, setStagedAdsSpend] = useState<number>(0);

  const { toast } = useToast();

  const handleExportExcel = () => {
    if (!activeCountry) return;

    // Prepare data
    const exportData = rows.map(row => ({
      Product: row.product.name,
      SKU: row.product.sku,
      'Total Orders': row.totalOrders,
      'Orders Confirmed': row.ordersConfirmed,
      'Conf. Rate (%)': `${row.confirmationRate.toFixed(1)}%`,
      'Delivered Orders': row.deliveredOrders,
      'Del. Rate (%)': `${row.deliveryRate.toFixed(1)}%`,
      'Del. Rate/Lead (%)': `${row.deliveryRatePerLead.toFixed(1)}%`,
      'Revenue': row.revenue,
      'Ads': row.ads,
      'Service Fees': row.serviceFees,
      'Product Fees': row.productFees,
      'Profit': row.profit
    }));

    // Add totals row
    exportData.push({
      Product: 'TOTALS',
      SKU: '',
      'Total Orders': totals.totalOrders,
      'Orders Confirmed': totals.ordersConfirmed,
      'Conf. Rate (%)': `${globalConfirmationRate.toFixed(1)}%`,
      'Delivered Orders': totals.deliveredOrders,
      'Del. Rate (%)': `${globalDeliveryRate.toFixed(1)}%`,
      'Del. Rate/Lead (%)': `${globalDeliveryRatePerLead.toFixed(1)}%`,
      'Revenue': totals.revenue,
      'Ads': totals.ads,
      'Service Fees': totals.serviceFees,
      'Product Fees': totals.productFees,
      'Profit': totals.profit
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Analysis");
    
    // Auto-width columns roughly
    const wscols = [
      { wch: 30 }, // Product
      { wch: 15 }, // SKU
      { wch: 12 }, // Total Orders
      { wch: 15 }, // Orders Confirmed
      { wch: 15 }, // Conf Rate
      { wch: 15 }, // Delivered
      { wch: 15 }, // Del Rate
      { wch: 15 }, // Del Rate/Lead
      { wch: 12 }, // Revenue
      { wch: 12 }, // Ads
      { wch: 12 }, // Service Fees
      { wch: 12 }, // Prod Fees
      { wch: 12 }, // Profit
    ];
    worksheet['!cols'] = wscols;

    XLSX.writeFile(workbook, `analysis_${activeCountry.name}_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast({ title: "Exported to Excel", description: "File downloaded successfully." });
  };

  const handleExportPDF = async () => {
    const node = document.getElementById('analyse-table-container');
    if (!node) return;

    try {
      const dataUrl = await htmlToImage.toPng(node, { backgroundColor: '#ffffff' });
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [node.scrollWidth + 40, node.scrollHeight + 40] // Custom size to fit table
      });
      
      pdf.addImage(dataUrl, 'PNG', 20, 20, node.scrollWidth, node.scrollHeight);
      pdf.save(`analysis_snapshot_${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast({ title: "Exported to PDF", description: "Snapshot downloaded successfully." });
    } catch (error) {
      console.error('PDF export failed', error);
      toast({ title: "Export Failed", description: "Could not generate PDF snapshot.", variant: "destructive" });
    }
  };

  const handleExportSVG = async () => {
    const node = document.getElementById('analyse-table-container');
    if (!node) return;

    try {
      const dataUrl = await htmlToImage.toSvg(node, { backgroundColor: '#ffffff' });
      const link = document.createElement('a');
      link.download = `analysis_snapshot_${new Date().toISOString().split('T')[0]}.svg`;
      link.href = dataUrl;
      link.click();
      
      toast({ title: "Exported to SVG", description: "Snapshot downloaded successfully." });
    } catch (error) {
      console.error('SVG export failed', error);
      toast({ title: "Export Failed", description: "Could not generate SVG snapshot.", variant: "destructive" });
    }
  };

  // Fix for persisted legacy column order:
  useEffect(() => {
    const defaultIds = ALL_COLUMNS.map(c => c.id);
    const currentIds = columnOrder || [];
    const missingIds = defaultIds.filter(id => !currentIds.includes(id));
    
    if (missingIds.length > 0) {
      setColumnOrder(defaultIds);
    }
  }, [columnOrder, setColumnOrder]);

  const currentColumnOrder = columnOrder && columnOrder.length > 0 ? columnOrder : ALL_COLUMNS.map(c => c.id);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = currentColumnOrder.indexOf(active.id as string);
      const newIndex = currentColumnOrder.indexOf(over?.id as string);
      setColumnOrder(arrayMove(currentColumnOrder, oldIndex, newIndex));
    }
  };

  const activeCountryId = selectedCountryId || countries[0]?.id;
  const activeCountry = countries.find(c => c.id === activeCountryId);

  const handleCountryUpdate = (field: 'defaultShipping' | 'defaultCod' | 'defaultReturn', value: string) => {
    if (!activeCountry) return;
    const numValue = parseFloat(value) || 0;
    updateCountry(activeCountry.id, { [field]: numValue });
  };

  const filteredProducts = products.filter(p => {
    const statusMatch = showDrafts || p.status === 'Active';
    const countryMatch = activeCountryId && p.countryIds && p.countryIds.includes(activeCountryId);
    return statusMatch && countryMatch;
  });

  const getAnalysisValue = (productId: string, field: 'revenue' | 'ads' | 'serviceFees' | 'productFees' | 'deliveredOrders' | 'totalOrders' | 'ordersConfirmed'): number => {
    if (!activeCountryId) return 0;
    
    // Ads special handling: Use productAdsSpend store primarily
    if (field === 'ads') {
      const spendData = productAdsSpend[productId];
      return spendData ? spendData.spend : 0;
    }

    const override = analysis[activeCountryId]?.[productId]?.[field];
    if (override !== undefined) return override;
    
    // Defaults
    if (field === 'serviceFees' && activeCountry) {
      const delivered = getAnalysisValue(productId, 'deliveredOrders');
      const feePerOrder = (activeCountry.defaultShipping || 0) + (activeCountry.defaultCod || 0) + (activeCountry.defaultReturn || 0);
      return delivered * feePerOrder;
    }
    return 0;
  };

  const handleUpdate = (productId: string, field: 'revenue' | 'ads' | 'serviceFees' | 'productFees' | 'deliveredOrders' | 'totalOrders' | 'ordersConfirmed', value: string) => {
    if (!activeCountryId) return;
    const numValue = parseFloat(value) || 0;
    
    // Ads special update: update productAdsSpend store
    if (field === 'ads') {
      updateProductAdsSpend(productId, { 
        spend: numValue, 
        lastUpdated: new Date().toISOString(),
        source: 'manual' 
      });
      return;
    }

    updateAnalysis(activeCountryId, productId, { [field]: numValue });
  };

  // FB Link Handler
  const openFbLinkModal = (product: Product) => {
    const currentData = productAdsSpend[product.id] || { 
      productId: product.id, 
      spend: 0, 
      source: 'manual', 
      linkedAdSets: [],
      lastUpdated: new Date().toISOString()
    };
    
    setActiveLinkingProduct(product);
    setStagedLinkedAdSets([...currentData.linkedAdSets]);
    setStagedAdsSpend(currentData.spend);
    setFbLinkModalOpen(true);
  };

  const handleRemoveStagedAdSet = (adSetId: string) => {
    setStagedLinkedAdSets(prev => prev.filter(as => as.adSetId !== adSetId));
  };

  const handleImportTempSelection = () => {
    const existingIds = new Set(stagedLinkedAdSets.map(as => as.adSetId));
    const newAdSets = tempSelectedAdSets.filter(as => !existingIds.has(as.adSetId));
    
    setStagedLinkedAdSets(prev => [...prev, ...newAdSets]);
    
    toast({
      title: "Ad Sets Imported",
      description: `Added ${newAdSets.length} Ad Sets from selection.`,
    });
  };

  const handleSaveFbLink = () => {
    if (!activeLinkingProduct) return;

    updateProductAdsSpend(activeLinkingProduct.id, {
      spend: stagedAdsSpend,
      linkedAdSets: stagedLinkedAdSets,
      source: stagedLinkedAdSets.length > 0 ? 'facebook' : 'manual',
      lastUpdated: new Date().toISOString()
    });

    setFbLinkModalOpen(false);
    toast({
      title: "Linked Successfully",
      description: "Ad sets and spend data updated.",
    });
  };

  // Calculations
  const calculatedRows = filteredProducts.map(p => {
    const revenue = getAnalysisValue(p.id, 'revenue');
    const ads = getAnalysisValue(p.id, 'ads');
    const serviceFees = getAnalysisValue(p.id, 'serviceFees');
    const productFees = getAnalysisValue(p.id, 'productFees');
    const deliveredOrders = getAnalysisValue(p.id, 'deliveredOrders');
    
    const totalOrders = getAnalysisValue(p.id, 'totalOrders');
    const ordersConfirmed = getAnalysisValue(p.id, 'ordersConfirmed');

    const confirmationRate = totalOrders > 0 ? (ordersConfirmed / totalOrders) * 100 : 0;
    const deliveryRate = ordersConfirmed > 0 ? (deliveredOrders / ordersConfirmed) * 100 : 0;
    const deliveryRatePerLead = totalOrders > 0 ? (deliveredOrders / totalOrders) * 100 : 0;

    const profit = revenue - ads - serviceFees - productFees;
    
    return {
      id: p.id,
      product: p,
      revenue,
      ads,
      serviceFees,
      productFees,
      deliveredOrders,
      totalOrders,
      ordersConfirmed,
      confirmationRate,
      deliveryRate,
      deliveryRatePerLead,
      profit
    };
  });

  const rows = calculatedRows.filter(row => {
    const searchMatch = !searchQuery || 
      row.product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      row.product.sku.toLowerCase().includes(searchQuery.toLowerCase());
    
    let profitMatch = true;
    if (profitFilter === 'profitable') profitMatch = row.profit > 0;
    if (profitFilter === 'loss') profitMatch = row.profit < 0;

    return searchMatch && profitMatch;
  });

  const totals = rows.reduce((acc, row) => ({
    revenue: acc.revenue + (Number(row.revenue) || 0),
    ads: acc.ads + (Number(row.ads) || 0),
    serviceFees: acc.serviceFees + (Number(row.serviceFees) || 0),
    productFees: acc.productFees + (Number(row.productFees) || 0),
    deliveredOrders: acc.deliveredOrders + (Number(row.deliveredOrders) || 0),
    totalOrders: acc.totalOrders + (Number(row.totalOrders) || 0),
    ordersConfirmed: acc.ordersConfirmed + (Number(row.ordersConfirmed) || 0),
    profit: acc.profit + (Number(row.profit) || 0),
  }), { revenue: 0, ads: 0, serviceFees: 0, productFees: 0, deliveredOrders: 0, totalOrders: 0, ordersConfirmed: 0, profit: 0 });

  const globalConfirmationRate = totals.totalOrders > 0 ? (totals.ordersConfirmed / totals.totalOrders) * 100 : 0;
  const globalDeliveryRate = totals.ordersConfirmed > 0 ? (totals.deliveredOrders / totals.ordersConfirmed) * 100 : 0;
  const globalDeliveryRatePerLead = totals.totalOrders > 0 ? (totals.deliveredOrders / totals.totalOrders) * 100 : 0;

  const globalCPA = totals.deliveredOrders > 0 ? totals.ads / totals.deliveredOrders : 0;
  const globalCPAD = globalCPA;
  const globalCPD = totals.deliveredOrders > 0 ? (totals.ads + totals.serviceFees + totals.productFees) / totals.deliveredOrders : 0;
  
  const totalOrders = rows.reduce((acc, row) => {
    if (row.deliveredOrders > 0) return acc + row.deliveredOrders;
    if (row.product.price > 0) return acc + (row.revenue / row.product.price);
    return acc;
  }, 0);

  const globalMargin = totals.revenue > 0 ? (totals.profit / totals.revenue) * 100 : 0;

  const renderCell = (row: any, columnId: string) => {
    switch (columnId) {
      case 'product':
        return (
          <TableCell key={columnId}>
            <div className="font-medium">{row.product.name}</div>
            <div className="text-xs text-muted-foreground font-mono">{row.product.sku}</div>
          </TableCell>
        );
      case 'profit':
        return (
          <TableCell key={columnId} className="text-right font-mono font-medium">
             <span className={row.profit > 0 ? 'text-green-600' : row.profit < 0 ? 'text-red-600' : 'text-muted-foreground'}>
               {formatNumber(row.profit)}
             </span>
          </TableCell>
        );
      case 'confirmationRate':
      case 'deliveryRate':
      case 'deliveryRatePerLead':
        // @ts-ignore
        const rateValue = row[columnId];
        return (
          <TableCell key={columnId} className="text-right p-1">
            <div className="flex justify-end">
              <CircularProgress value={rateValue} />
            </div>
          </TableCell>
        );
      case 'facebookLink':
        const hasLinks = productAdsSpend[row.product.id]?.linkedAdSets?.length > 0;
        return (
          <TableCell key={columnId} className="p-1 text-center">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 hover:bg-blue-50"
              onClick={() => openFbLinkModal(row.product)}
              title="Link Facebook Ad Sets"
            >
              <Facebook className={`w-4 h-4 ${hasLinks ? 'text-blue-600 fill-blue-100' : 'text-muted-foreground'}`} />
            </Button>
          </TableCell>
        );
      default:
        return (
          <TableCell key={columnId} className="p-1">
            <Input 
              type="number" 
              className="text-right h-8 font-mono bg-transparent border-transparent hover:border-input focus:border-ring"
              value={row[columnId] || ''}
              onChange={(e) => handleUpdate(row.product.id, columnId as any, e.target.value)}
              placeholder="0"
            />
          </TableCell>
        );
    }
  };

  const renderTotalCell = (columnId: string) => {
     switch (columnId) {
       case 'product':
         return <TableCell key={columnId}>Totals</TableCell>;
       case 'profit':
         return (
           <TableCell key={columnId} className="text-right font-mono">
             <span className={totals.profit > 0 ? 'text-green-600' : totals.profit < 0 ? 'text-red-600' : ''}>
               {formatCurrency(totals.profit, activeCountry?.currency || 'USD')}
             </span>
           </TableCell>
         );
       case 'confirmationRate':
         return (
            <TableCell key={columnId} className="text-right font-mono">
               <div className="flex justify-end">
                 <CircularProgress value={globalConfirmationRate} />
               </div>
            </TableCell>
         );
       case 'deliveryRate':
         return (
            <TableCell key={columnId} className="text-right font-mono">
               <div className="flex justify-end">
                 <CircularProgress value={globalDeliveryRate} />
               </div>
            </TableCell>
         );
       case 'deliveryRatePerLead':
         return (
            <TableCell key={columnId} className="text-right font-mono">
               <div className="flex justify-end">
                 <CircularProgress value={globalDeliveryRatePerLead} />
               </div>
            </TableCell>
         );
       case 'facebookLink':
         return <TableCell key={columnId}></TableCell>;
       default:
         // @ts-ignore
         const val = totals[columnId];
         return <TableCell key={columnId} className="text-right font-mono">{formatNumber(val)}</TableCell>;
     }
  };

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
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Analyse</h2>
            <p className="text-muted-foreground">Profitability analysis for {activeCountry.name}.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
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

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-1">
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Export</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Export Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleExportExcel}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  <span>Excel (.xlsx)</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportPDF}>
                  <FileImage className="mr-2 h-4 w-4" />
                  <span>PDF Snapshot</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportSVG}>
                  <FileType className="mr-2 h-4 w-4" />
                  <span>SVG Snapshot</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative w-full sm:w-[300px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Filter products..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground ml-auto">
            <Filter className="w-4 h-4" />
            <Select value={profitFilter} onValueChange={(val: any) => setProfitFilter(val)}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder="Profit Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                <SelectItem value="profitable">Profitable Only</SelectItem>
                <SelectItem value="loss">Loss Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {activeCountry && (
        <Card className="bg-muted/30">
          <CardContent className="p-4">
             <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
               <div className="flex flex-col gap-2 p-3 bg-background rounded-md shadow-sm border min-w-[150px]">
                 <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Est. Orders</span>
                 <span className="text-2xl font-bold">{formatNumber(totalOrders)}</span>
               </div>
               
               <div className="h-10 w-px bg-border hidden md:block" />
               
               <div className="flex flex-col gap-2 p-3 bg-background rounded-md shadow-sm border min-w-[150px]">
                 <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Delivered</span>
                 <span className="text-2xl font-bold">{formatNumber(totals.deliveredOrders)}</span>
               </div>
               
               <div className="h-10 w-px bg-border hidden md:block" />
               
               <div className="flex flex-col gap-2 p-3 bg-background rounded-md shadow-sm border min-w-[150px]">
                 <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Revenue</span>
                 <span className="text-2xl font-bold">{formatCurrency(totals.revenue, activeCountry.currency)}</span>
               </div>

               <div className="h-10 w-px bg-border hidden md:block" />

               <div className="flex flex-col gap-2 p-3 bg-background rounded-md shadow-sm border min-w-[150px]">
                 <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">CPA</span>
                 <span className="text-2xl font-bold text-blue-600">{formatCurrency(globalCPA, activeCountry.currency)}</span>
               </div>

               <div className="h-10 w-px bg-border hidden md:block" />

               <div className="flex flex-col gap-2 p-3 bg-background rounded-md shadow-sm border min-w-[150px]">
                 <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Margin</span>
                 <span className={`text-2xl font-bold ${globalMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                   {globalMargin.toFixed(1)}%
                 </span>
               </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pt-4 border-t">
               <div className="space-y-3">
                 <h4 className="text-sm font-medium text-muted-foreground">Default Shipping Fee</h4>
                 <div className="flex items-center gap-2">
                   <span className="text-muted-foreground w-6">{activeCountry.currency}</span>
                   <Input 
                     type="number" 
                     className="max-w-[100px]" 
                     value={activeCountry.defaultShipping}
                     onChange={(e) => handleCountryUpdate('defaultShipping', e.target.value)}
                   />
                 </div>
               </div>
               
               <div className="space-y-3">
                 <h4 className="text-sm font-medium text-muted-foreground">Default COD Fee</h4>
                 <div className="flex items-center gap-2">
                   <span className="text-muted-foreground w-6">{activeCountry.currency}</span>
                   <Input 
                     type="number" 
                     className="max-w-[100px]" 
                     value={activeCountry.defaultCod}
                     onChange={(e) => handleCountryUpdate('defaultCod', e.target.value)}
                   />
                 </div>
               </div>

               <div className="space-y-3">
                 <h4 className="text-sm font-medium text-muted-foreground">Default Return Fee</h4>
                 <div className="flex items-center gap-2">
                   <span className="text-muted-foreground w-6">{activeCountry.currency}</span>
                   <Input 
                     type="number" 
                     className="max-w-[100px]" 
                     value={activeCountry.defaultReturn}
                     onChange={(e) => handleCountryUpdate('defaultReturn', e.target.value)}
                   />
                 </div>
               </div>
             </div>
          </CardContent>
        </Card>
      )}

      {/* Main Analysis Table */}
      <div className="rounded-md border bg-card relative" id="analyse-table-container">
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <SortableContext 
                  items={currentColumnOrder} 
                  strategy={horizontalListSortingStrategy}
                >
                  {currentColumnOrder.map((columnId) => {
                    const column = ALL_COLUMNS.find(c => c.id === columnId);
                    if (!column) return null;
                    return <SortableHeader key={columnId} id={columnId} column={column} />;
                  })}
                </SortableContext>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={currentColumnOrder.length} className="h-24 text-center">
                    No products found.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id}>
                    {currentColumnOrder.map((columnId) => renderCell(row, columnId))}
                  </TableRow>
                ))
              )}
              {/* Totals Row */}
              {rows.length > 0 && (
                <TableRow className="bg-muted/50 font-medium border-t-2">
                  {currentColumnOrder.map((columnId) => renderTotalCell(columnId))}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DndContext>
      </div>

      {/* Facebook Link Modal */}
      <Dialog open={fbLinkModalOpen} onOpenChange={setFbLinkModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Link Facebook Ad Sets</DialogTitle>
            <DialogDescription>
              Connect ad sets to calculate Ads Spend for this product.
            </DialogDescription>
          </DialogHeader>

          {activeLinkingProduct && (
            <div className="space-y-4 py-4">
              {/* Product Info */}
              <div className="p-3 bg-muted rounded-md flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{activeLinkingProduct.name}</p>
                  <p className="text-xs text-muted-foreground">{activeLinkingProduct.sku}</p>
                </div>
                <div className="text-xs px-2 py-1 bg-background border rounded">
                  {activeLinkingProduct.status}
                </div>
              </div>

              {/* Linked Ad Sets List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold uppercase text-muted-foreground">Linked Ad Sets</Label>
                  <Button variant="ghost" size="sm" className="h-6 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={handleImportTempSelection}>
                    <Plus className="w-3 h-3 mr-1" />
                    Import Selection
                  </Button>
                </div>
                
                <div className="border rounded-md min-h-[100px] max-h-[150px] overflow-y-auto p-2 bg-slate-50 space-y-2">
                  {stagedLinkedAdSets.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm">
                      <p>No ad sets linked.</p>
                      {tempSelectedAdSets.length > 0 && (
                        <p className="text-xs mt-1 text-blue-600 cursor-pointer hover:underline" onClick={handleImportTempSelection}>
                          Import {tempSelectedAdSets.length} selected from FB Ads page
                        </p>
                      )}
                    </div>
                  ) : (
                    stagedLinkedAdSets.map((adSet) => (
                      <div key={adSet.adSetId} className="flex items-center justify-between bg-white p-2 rounded border text-sm shadow-sm">
                        <div className="flex flex-col overflow-hidden mr-2">
                           <span className="font-medium truncate">{adSet.adSetName}</span>
                           <span className="text-[10px] text-muted-foreground truncate">{adSet.campaignName}</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-muted-foreground hover:text-red-500 hover:bg-red-50"
                          onClick={() => handleRemoveStagedAdSet(adSet.adSetId)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
                {stagedLinkedAdSets.length === 0 && (
                  <p className="text-xs text-amber-600 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Ad Sets removed — spend remains manual
                  </p>
                )}
              </div>

              {/* Ads Spend Input */}
              <div className="space-y-2 pt-2">
                <Label htmlFor="ads-spend-input">Ads Spend ({activeCountry?.currency || 'USD'})</Label>
                <div className="relative">
                  <Input 
                    id="ads-spend-input"
                    type="number" 
                    value={stagedAdsSpend} 
                    onChange={(e) => setStagedAdsSpend(parseFloat(e.target.value) || 0)}
                    className="pl-8 font-mono"
                  />
                  <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">$</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Update this value manually. It will persist for the product.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setFbLinkModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveFbLink}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
