import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useStore, Product } from "@/lib/store";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle, GripHorizontal, Save, Eye, Download, FileSpreadsheet, FileImage, FileType, Search, Filter, Calendar, BookmarkPlus, X, Pencil } from "lucide-react";
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

function DebouncedInput({ value: externalValue, onChange, ...props }: { value: string | number; onChange: (val: string) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'>) {
  const [localValue, setLocalValue] = useState(String(externalValue || ''));
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFocusedRef = useRef(false);

  useEffect(() => {
    if (!isFocusedRef.current) {
      setLocalValue(String(externalValue || ''));
    }
  }, [externalValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalValue(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onChange(val);
    }, 600);
  };

  const handleFocus = () => { isFocusedRef.current = true; };
  const handleBlur = () => {
    isFocusedRef.current = false;
    if (timerRef.current) clearTimeout(timerRef.current);
    onChange(localValue);
  };

  return <input {...props} value={localValue} onChange={handleChange} onFocus={handleFocus} onBlur={handleBlur} />;
}

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
  { id: 'quantityDelivery', label: 'Qty Delivery', align: 'right', width: 'w-[120px]', editable: true },
  { id: 'deliveryRate', label: 'Del. Rate (%)', align: 'right', width: 'w-[100px]' },
  { id: 'deliveryRatePerLead', label: 'Del. Rate/Lead', align: 'right', width: 'w-[120px]' },
  { id: 'revenue', label: 'Revenue', align: 'right', width: 'w-[140px]', editable: true },
  { id: 'ads', label: 'Ads', align: 'right', width: 'w-[140px]', editable: true },
  { id: 'serviceFees', label: 'Service Fees', align: 'right', width: 'w-[140px]', editable: true },
  { id: 'productFees', label: 'Prod. Fees', align: 'right', width: 'w-[140px]' },
  { id: 'profit', label: 'Profit', align: 'right', width: 'w-[140px]' },
  { id: 'margin', label: 'Margin', align: 'right', width: 'w-[100px]' },
  { id: 'actions', label: '', align: 'right', width: 'w-[110px]' },
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
      <div className="flex items-center gap-2 justify-end">
         {column.align === 'left' && <span>{column.label}</span>}
         <GripHorizontal className="w-4 h-4 text-muted-foreground/30 group-hover:text-muted-foreground/60" />
         {column.align !== 'left' && <span>{column.label}</span>}
      </div>
    </TableHead>
  );
}

export default function Analyse() {
  const { countries, products, analysis, updateAnalysis, columnOrder, setColumnOrder, updateCountry, dailyAdsTotals, fetchDailyAdsTotals, editingSnapshot, setEditingSnapshot } = useStore();
  const [selectedCountryId, setSelectedCountryId] = useState<string>(countries[0]?.id || "");
  const [showDrafts, setShowDrafts] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [profitFilter, setProfitFilter] = useState<'all' | 'profitable' | 'loss'>('all');
  const [viewProduct, setViewProduct] = useState<any | null>(null);
  const [dateStartFilter, setDateStartFilter] = useState("");
  const [dateEndFilter, setDateEndFilter] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [periodName, setPeriodName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (editingSnapshot) {
      setSelectedCountryId(editingSnapshot.countryId);
      setPeriodName(editingSnapshot.periodName);
      
      for (const row of editingSnapshot.snapshotData) {
        updateAnalysis(editingSnapshot.countryId, row.productId, {
          totalOrders: row.totalOrders,
          ordersConfirmed: row.ordersConfirmed,
          deliveredOrders: row.deliveredOrders,
          revenue: row.revenue,
          ads: row.ads,
          serviceFees: row.serviceFees,
          quantityDelivery: row.quantityDelivery,
          productFees: row.productFees,
        });
      }
    }
  }, []);

  const handleDateFilter = useCallback(() => {
    if (dateStartFilter && dateEndFilter) {
      fetchDailyAdsTotals(dateStartFilter, dateEndFilter);
    } else {
      fetchDailyAdsTotals();
    }
  }, [dateStartFilter, dateEndFilter, fetchDailyAdsTotals]);

  useEffect(() => {
    handleDateFilter();
  }, [handleDateFilter]);

  const handleClearDateFilter = () => {
    setDateStartFilter("");
    setDateEndFilter("");
  };

  const handleSaveSnapshot = async () => {
    if (!periodName.trim() || !activeCountry) return;
    setIsSaving(true);
    try {
      const snapshotData = rows.map(row => ({
        productId: row.product.id,
        productName: row.product.name,
        productSku: row.product.sku,
        totalOrders: row.totalOrders,
        ordersConfirmed: row.ordersConfirmed,
        confirmationRate: row.confirmationRate,
        deliveredOrders: row.deliveredOrders,
        deliveryRate: row.deliveryRate,
        deliveryRatePerLead: row.deliveryRatePerLead,
        revenue: row.revenue,
        ads: row.ads,
        serviceFees: row.serviceFees,
        quantityDelivery: row.quantityDelivery,
        productFees: row.productFees,
        profit: row.profit,
        margin: row.margin,
      }));

      if (editingSnapshot) {
        await apiRequest("DELETE", `/api/analysis-snapshots/${editingSnapshot.id}`);
        await apiRequest("POST", "/api/analysis-snapshots", {
          id: editingSnapshot.id,
          periodName: periodName.trim(),
          countryId: activeCountry.id,
          countryName: activeCountry.name,
          currency: activeCountry.currency,
          snapshotData,
          totalOrders: totals.totalOrders,
          ordersConfirmed: totals.ordersConfirmed,
          deliveredOrders: totals.deliveredOrders,
          totalRevenue: totals.revenue,
          totalAds: totals.ads,
          totalServiceFees: totals.serviceFees,
          totalProductFees: totals.productFees,
          profit: totals.profit,
          margin: globalMargin,
          createdAt: new Date().toISOString(),
        });
        toast({ title: "Updated!", description: `Analysis "${periodName.trim()}" updated.` });
        setEditingSnapshot(null);
      } else {
        const id = crypto.randomUUID();
        await apiRequest("POST", "/api/analysis-snapshots", {
          id,
          periodName: periodName.trim(),
          countryId: activeCountry.id,
          countryName: activeCountry.name,
          currency: activeCountry.currency,
          snapshotData,
          totalOrders: totals.totalOrders,
          ordersConfirmed: totals.ordersConfirmed,
          deliveredOrders: totals.deliveredOrders,
          totalRevenue: totals.revenue,
          totalAds: totals.ads,
          totalServiceFees: totals.serviceFees,
          totalProductFees: totals.productFees,
          profit: totals.profit,
          margin: globalMargin,
          createdAt: new Date().toISOString(),
        });
        toast({ title: "Saved!", description: `Analysis saved as "${periodName.trim()}".` });
      }
      setPeriodName("");
      setShowSaveDialog(false);
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Could not save analysis data.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

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
      'Qty Delivery': row.quantityDelivery,
      'Product Fees': row.productFees,
      'Profit': row.profit,
      'Margin': `${row.margin.toFixed(1)}%`
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
      'Qty Delivery': totals.quantityDelivery,
      'Product Fees': totals.productFees,
      'Profit': totals.profit,
      'Margin': `${globalMargin.toFixed(1)}%`
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
      { wch: 12 }, // Margin
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
  // If the persisted columnOrder is missing any of the current ALL_COLUMNS (newly added ones),
  // reset it to the default order to ensure users see the new columns in the correct logical order.
  useEffect(() => {
    const defaultIds = ALL_COLUMNS.map(c => c.id);
    const currentIds = columnOrder || [];
    const missingIds = defaultIds.filter(id => !currentIds.includes(id));
    
    if (missingIds.length > 0) {
      setColumnOrder(defaultIds);
    }
  }, [columnOrder, setColumnOrder]);

  // Initialize column order if empty (legacy support)
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

  // Fallback to first country if selected is invalid
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

  const getAnalysisValue = (productId: string, field: 'revenue' | 'ads' | 'serviceFees' | 'productFees' | 'quantityDelivery' | 'deliveredOrders' | 'totalOrders' | 'ordersConfirmed'): number => {
    if (!activeCountryId) return 0;

    if (field === 'ads') {
      const dailyTotal = dailyAdsTotals[productId];
      if (dailyTotal !== undefined && dailyTotal > 0) return dailyTotal;
    }

    if (field === 'serviceFees' && activeCountry) {
      const manualValue = analysis[activeCountryId]?.[productId]?.[field];
      if (manualValue !== undefined && manualValue > 0) return manualValue;
      const delivered = getAnalysisValue(productId, 'deliveredOrders');
      const feePerOrder = activeCountry.defaultShipping + activeCountry.defaultCod + activeCountry.defaultReturn;
      return delivered * feePerOrder;
    }

    const override = analysis[activeCountryId]?.[productId]?.[field];
    if (override !== undefined) return override;
    return 0;
  };

  const handleUpdate = (productId: string, field: 'revenue' | 'ads' | 'serviceFees' | 'productFees' | 'quantityDelivery' | 'deliveredOrders' | 'totalOrders' | 'ordersConfirmed', value: string) => {
    if (!activeCountryId) return;
    const numValue = parseFloat(value) || 0;
    updateAnalysis(activeCountryId, productId, { [field]: numValue });
  };

  // Calculations
  const calculatedRows = filteredProducts.map(p => {
    const revenue = getAnalysisValue(p.id, 'revenue');
    const ads = getAnalysisValue(p.id, 'ads');
    const serviceFees = getAnalysisValue(p.id, 'serviceFees');
    const quantityDelivery = getAnalysisValue(p.id, 'quantityDelivery');
    const productFees = quantityDelivery > 0 ? quantityDelivery * (p.cost || 0) : getAnalysisValue(p.id, 'productFees');
    const deliveredOrders = getAnalysisValue(p.id, 'deliveredOrders');
    
    // New Fields
    const totalOrders = getAnalysisValue(p.id, 'totalOrders');
    const ordersConfirmed = getAnalysisValue(p.id, 'ordersConfirmed');

    // Calculated Fields
    const confirmationRate = totalOrders > 0 ? (ordersConfirmed / totalOrders) * 100 : 0;
    const deliveryRate = ordersConfirmed > 0 ? (deliveredOrders / ordersConfirmed) * 100 : 0;
    // Assuming Delivery Rate per Lead is Delivered / Total Orders
    const deliveryRatePerLead = totalOrders > 0 ? (deliveredOrders / totalOrders) * 100 : 0;

    const profit = revenue - ads - serviceFees - productFees;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
    
    return {
      id: p.id,
      product: p,
      revenue,
      ads,
      serviceFees,
      quantityDelivery,
      productFees,
      deliveredOrders,
      totalOrders,
      ordersConfirmed,
      confirmationRate,
      deliveryRate,
      deliveryRatePerLead,
      profit,
      margin
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
    revenue: acc.revenue + row.revenue,
    ads: acc.ads + row.ads,
    serviceFees: acc.serviceFees + row.serviceFees,
    quantityDelivery: acc.quantityDelivery + row.quantityDelivery,
    productFees: acc.productFees + row.productFees,
    deliveredOrders: acc.deliveredOrders + row.deliveredOrders,
    totalOrders: acc.totalOrders + row.totalOrders,
    ordersConfirmed: acc.ordersConfirmed + row.ordersConfirmed,
    profit: acc.profit + row.profit,
  }), { revenue: 0, ads: 0, serviceFees: 0, quantityDelivery: 0, productFees: 0, deliveredOrders: 0, totalOrders: 0, ordersConfirmed: 0, profit: 0 });

  // Calculate Global Rates
  const globalConfirmationRate = totals.totalOrders > 0 ? (totals.ordersConfirmed / totals.totalOrders) * 100 : 0;
  const globalDeliveryRate = totals.ordersConfirmed > 0 ? (totals.deliveredOrders / totals.ordersConfirmed) * 100 : 0;
  const globalDeliveryRatePerLead = totals.totalOrders > 0 ? (totals.deliveredOrders / totals.totalOrders) * 100 : 0;

  // CPA Calculation: ADS / TOTAL ORDER (as requested)
  const globalCPA = totals.totalOrders > 0 ? totals.ads / totals.totalOrders : 0;
  // CPAD: Ads / Delivered Orders
  const globalCPAD = totals.deliveredOrders > 0 ? totals.ads / totals.deliveredOrders : 0;
  // CPD: Total Costs (Ads + Service Fees + Product Fees) / Delivered Orders
  const globalCPD = totals.deliveredOrders > 0 ? (totals.ads + totals.serviceFees + totals.productFees) / totals.deliveredOrders : 0;
  
  // Also updating the "Est. Orders" card to just show Delivered Orders for clarity, 
  // or should it remain "Est. Orders" (calculated)?
  // User asked for "CPA=ADS/DELIVERD ORDER". 
  // I will keep totalOrders logic for "Est. Orders" card as it might be useful for users who haven't entered delivered orders yet,
  // but I'll make sure CPA uses strictly delivered orders.
  
  // Previous calculation for totalOrders (kept for the Card display if needed, or we can switch to delivered only)
  // Given the request is specific to CPA, I will leave totalOrders as is for the "Est. Orders" card 
  // unless "Est. Orders" is also expected to be strictly delivered orders now.
  // The user didn't explicitly ask to change "Est. Orders", just CPA.
  
  const totalOrders = rows.reduce((acc, row) => {
    if (row.deliveredOrders > 0) return acc + row.deliveredOrders;
    if (row.product.price > 0) return acc + (row.revenue / row.product.price);
    return acc;
  }, 0);

  const globalMargin = totals.revenue > 0 ? (totals.profit / totals.revenue) * 100 : 0;

  const handleDownloadProduct = (row: any) => {
    try {
      const pdf = new jsPDF();
      
      // Header
      pdf.setFontSize(18);
      pdf.setTextColor(40, 40, 40);
      pdf.text("Product Analysis Report", 20, 20);
      
      // Product Info
      pdf.setFontSize(14);
      pdf.text(row.product.name, 20, 35);
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`SKU: ${row.product.sku}`, 20, 40);
      
      // Date
      pdf.text(`Date: ${new Date().toLocaleDateString()}`, 150, 20);
      
      // Divider
      pdf.setDrawColor(200, 200, 200);
      pdf.line(20, 45, 190, 45);
      
      // Metrics
      let y = 60;
      const addMetric = (label: string, value: string) => {
        pdf.setTextColor(60, 60, 60);
        pdf.text(label, 20, y);
        pdf.setTextColor(0, 0, 0);
        pdf.text(value, 120, y);
        y += 10;
      };

      addMetric("Total Orders", formatNumber(row.totalOrders));
      addMetric("Confirmed Orders", formatNumber(row.ordersConfirmed));
      addMetric("Confirmation Rate", `${row.confirmationRate.toFixed(1)}%`);
      addMetric("Delivered Orders", formatNumber(row.deliveredOrders));
      addMetric("Delivery Rate", `${row.deliveryRate.toFixed(1)}%`);
      
      y += 5; // Extra spacing
      
      addMetric("Revenue", formatCurrency(row.revenue, activeCountry?.currency || 'USD'));
      addMetric("Ads Cost", formatCurrency(row.ads, activeCountry?.currency || 'USD'));
      addMetric("Service Fees", formatCurrency(row.serviceFees, activeCountry?.currency || 'USD'));
      addMetric("Qty Delivery", formatNumber(row.quantityDelivery));
      addMetric("Product Fees", formatCurrency(row.productFees, activeCountry?.currency || 'USD'));
      
      y += 5;
      
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      addMetric("Net Profit", formatCurrency(row.profit, activeCountry?.currency || 'USD'));
      addMetric("Margin", `${row.margin.toFixed(1)}%`);
      
      pdf.save(`product-${row.product.sku.replace(/\s+/g, '-')}.pdf`);
      toast({ title: "Product Report Downloaded", description: `Report for ${row.product.name} saved.` });
    } catch (error) {
       console.error(error);
       toast({ title: "Error", description: "Could not generate report.", variant: "destructive" });
    }
  };

  // Render Cell Helper
  const renderCell = (row: any, columnId: string) => {
    switch (columnId) {
      case 'product':
        return (
          <TableCell key={columnId}>
            <div className="font-medium flex items-center gap-2">
              {row.product.name}
            </div>
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
      case 'margin':
        return (
          <TableCell key={columnId} className="text-right font-mono font-medium">
             <span className={row.margin > 0 ? 'text-green-600' : row.margin < 0 ? 'text-red-600' : 'text-muted-foreground'}>
               {row.margin.toFixed(1)}%
             </span>
          </TableCell>
        );
      case 'actions':
        return (
          <TableCell key={columnId} className="text-right p-1">
             <div className="flex items-center justify-end gap-1">
               <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewProduct(row)}>
                 <Eye className="h-4 w-4 text-muted-foreground" />
               </Button>
               <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownloadProduct(row)}>
                 <Download className="h-4 w-4 text-muted-foreground" />
               </Button>
               <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toast({ title: "Saved", description: "Changes saved successfully." })}>
                 <Save className="h-4 w-4 text-muted-foreground" />
               </Button>
             </div>
          </TableCell>
        );
      case 'productFees':
        return (
          <TableCell key={columnId} className="text-right font-mono font-bold text-base px-2">
            {formatNumber(row.productFees)}
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
      default:
        // Editable fields
        return (
          <TableCell key={columnId} className="p-0">
            <DebouncedInput 
              type="number" 
              className="w-full h-10 text-right font-bold text-base bg-transparent border-none shadow-none focus-visible:ring-0 rounded-none px-2 text-foreground [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none flex ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              value={row[columnId] || ''}
              onChange={(val) => handleUpdate(row.product.id, columnId as any, val)}
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
       case 'margin':
         return (
           <TableCell key={columnId} className="text-right font-mono font-bold">
             <span className={globalMargin > 0 ? 'text-green-600' : globalMargin < 0 ? 'text-red-600' : ''}>
               {globalMargin.toFixed(1)}%
             </span>
           </TableCell>
         );
       case 'actions':
          return <TableCell key={columnId}></TableCell>;
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
      {editingSnapshot && (
        <div className="flex items-center justify-between gap-4 p-3 bg-blue-50 border border-blue-200 rounded-lg" data-testid="editing-banner">
          <div className="flex items-center gap-2">
            <Pencil className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">
              Editing: <strong>{editingSnapshot.periodName}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="default" className="h-8 gap-1" onClick={() => setShowSaveDialog(true)} data-testid="button-update-snapshot">
              <Save className="h-3.5 w-3.5" />
              Update
            </Button>
            <Button size="sm" variant="ghost" className="h-8 gap-1 text-muted-foreground" onClick={() => setEditingSnapshot(null)} data-testid="button-cancel-edit">
              <X className="h-3.5 w-3.5" />
              Cancel
            </Button>
          </div>
        </div>
      )}

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
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Select Country" />
              </SelectTrigger>
              <SelectContent>
                {countries.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    <div className="flex items-center gap-2">
                      {c.code && (
                        <img 
                          src={`https://flagcdn.com/w20/${c.code.toLowerCase()}.png`} 
                          alt={c.code}
                          className="h-3 w-auto rounded-sm object-cover border"
                        />
                      )}
                      <span>{c.name} ({c.currency})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="default" size="sm" className="h-9 gap-1" onClick={() => setShowSaveDialog(true)} data-testid="button-save-snapshot">
              <BookmarkPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Save Data</span>
            </Button>

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
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
             <Filter className="h-4 w-4 text-muted-foreground hidden sm:block" />
             <Select value={profitFilter} onValueChange={(val: any) => setProfitFilter(val)}>
               <SelectTrigger className="w-[180px]">
                 <SelectValue placeholder="Profitability" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="all">All Profitability</SelectItem>
                 <SelectItem value="profitable">Profitable Only</SelectItem>
                 <SelectItem value="loss">Loss Only</SelectItem>
               </SelectContent>
             </Select>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto ml-auto">
            <Calendar className="h-4 w-4 text-muted-foreground hidden sm:block" />
            <Input
              type="date"
              className="w-[150px] h-9"
              value={dateStartFilter}
              onChange={(e) => setDateStartFilter(e.target.value)}
              data-testid="input-date-start"
            />
            <span className="text-muted-foreground text-sm">to</span>
            <Input
              type="date"
              className="w-[150px] h-9"
              value={dateEndFilter}
              onChange={(e) => setDateEndFilter(e.target.value)}
              data-testid="input-date-end"
            />
            {(dateStartFilter || dateEndFilter) && (
              <Button variant="ghost" size="sm" className="h-9 px-2 text-muted-foreground" onClick={handleClearDateFilter} data-testid="button-clear-date-filter">
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      {activeCountry && (
        <Card className="bg-muted/30">
          <CardContent className="p-4">
             <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                <div className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                   Default Fees ({activeCountry.currency}):
                </div>
                <div className="flex flex-wrap gap-4 w-full">
                   <div className="flex items-center gap-2">
                      <Label htmlFor="shipping" className="text-xs">Shipping</Label>
                      <Input 
                        id="shipping"
                        type="number" 
                        className="w-20 h-8" 
                        value={activeCountry.defaultShipping}
                        onChange={(e) => handleCountryUpdate('defaultShipping', e.target.value)}
                      />
                   </div>
                   <div className="flex items-center gap-2">
                      <Label htmlFor="cod" className="text-xs">COD</Label>
                      <Input 
                        id="cod"
                        type="number" 
                        className="w-20 h-8" 
                        value={activeCountry.defaultCod}
                        onChange={(e) => handleCountryUpdate('defaultCod', e.target.value)}
                      />
                   </div>
                   <div className="flex items-center gap-2">
                      <Label htmlFor="return" className="text-xs">Return</Label>
                      <Input 
                        id="return"
                        type="number" 
                        className="w-20 h-8" 
                        value={activeCountry.defaultReturn}
                        onChange={(e) => handleCountryUpdate('defaultReturn', e.target.value)}
                      />
                   </div>
                   <div className="flex items-center gap-2 ml-auto text-xs text-muted-foreground border-l pl-4">
                      <span>Total per Order: {formatCurrency(activeCountry.defaultShipping + activeCountry.defaultCod + activeCountry.defaultReturn, activeCountry.currency)}</span>
                   </div>
                </div>
             </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         {/* Row 1 */}
         <Card className="p-4">
           <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
           <p className="text-2xl font-bold">{formatCurrency(totals.revenue, activeCountry.currency)}</p>
         </Card>
         <Card className="p-4">
           <p className="text-sm font-medium text-muted-foreground">Total Service Fees</p>
           <p className="text-2xl font-bold">{formatCurrency(totals.serviceFees, activeCountry.currency)}</p>
         </Card>
         <Card className="p-4">
           <p className="text-sm font-medium text-muted-foreground">Total Ads</p>
           <p className="text-2xl font-bold">{formatCurrency(totals.ads, activeCountry.currency)}</p>
         </Card>
         <Card className="p-4">
           <p className="text-sm font-medium text-muted-foreground">Total Product Fees</p>
           <p className="text-2xl font-bold">{formatCurrency(totals.productFees, activeCountry.currency)}</p>
         </Card>

         {/* Row 2 */}
         <Card className="p-4">
           <p className="text-sm font-medium text-muted-foreground">CPA</p>
           <p className="text-2xl font-bold">
             {totals.totalOrders > 0 ? formatCurrency(globalCPA, activeCountry.currency) : '-'}
           </p>
         </Card>
         <Card className="p-4">
           <p className="text-sm font-medium text-muted-foreground">CPAD</p>
           <p className="text-2xl font-bold">
             {totals.deliveredOrders > 0 ? formatCurrency(globalCPAD, activeCountry.currency) : '-'}
           </p>
         </Card>
         <Card className="p-4">
           <p className="text-sm font-medium text-muted-foreground">CPD</p>
           <p className="text-2xl font-bold">
             {totals.deliveredOrders > 0 ? formatCurrency(globalCPD, activeCountry.currency) : '-'}
           </p>
         </Card>
         <Card className="p-4 bg-primary/5 border-primary/10">
           <p className="text-sm font-medium text-muted-foreground">Total Profit</p>
           <div className="flex items-baseline gap-2">
             <p className={`text-2xl font-bold ${totals.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
               {formatCurrency(totals.profit, activeCountry.currency)}
             </p>
             <span className={`text-sm font-medium ${globalMargin > 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
               ({globalMargin.toFixed(1)}%)
             </span>
           </div>
         </Card>
      </div>

      <div id="analyse-table-container" className="border rounded-md bg-card overflow-hidden">
        <DndContext 
          sensors={sensors} 
          collisionDetection={closestCenter} 
          onDragEnd={handleDragEnd}
        >
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <SortableContext items={currentColumnOrder} strategy={horizontalListSortingStrategy}>
                    {currentColumnOrder.map(colId => {
                      const column = ALL_COLUMNS.find(c => c.id === colId);
                      if (!column) return null;
                      return <SortableHeader key={colId} id={colId} column={column} />;
                    })}
                  </SortableContext>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={currentColumnOrder.length} className="h-24 text-center text-muted-foreground">
                       No products assigned to this country (or no active products).
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => (
                    <TableRow 
                      key={row.product.id}
                      className={row.profit < 0 ? "bg-red-50 hover:bg-red-50/90" : ""}
                    >
                       {currentColumnOrder.map(colId => renderCell(row, colId))}
                    </TableRow>
                  ))
                )}
                {rows.length > 0 && (
                  <TableRow className="bg-muted/30 font-bold border-t-2">
                     {currentColumnOrder.map(colId => renderTotalCell(colId))}
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </DndContext>
      </div>

      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSnapshot ? "Update Analysis Data" : "Save Analysis Data"}</DialogTitle>
            <DialogDescription>
              {editingSnapshot
                ? `Update the analysis data for "${editingSnapshot.periodName}".`
                : `Save the current analysis data for ${activeCountry?.name} as a period snapshot. You can view it later in the History page.`
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="period-name">Period Name</Label>
              <Input
                id="period-name"
                placeholder="e.g. January 2026, Week 1, Q1..."
                value={periodName}
                onChange={(e) => setPeriodName(e.target.value)}
                className="mt-1"
                data-testid="input-period-name"
              />
            </div>
            {dateStartFilter && dateEndFilter && (
              <p className="text-sm text-muted-foreground">
                Date filter active: {dateStartFilter} to {dateEndFilter}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowSaveDialog(false)} data-testid="button-cancel-save">
                Cancel
              </Button>
              <Button onClick={handleSaveSnapshot} disabled={!periodName.trim() || isSaving} data-testid="button-confirm-save">
                {isSaving ? (editingSnapshot ? "Updating..." : "Saving...") : (editingSnapshot ? "Update" : "Save")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewProduct} onOpenChange={(open) => !open && setViewProduct(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Product Analysis Details</DialogTitle>
            <DialogDescription>
              Detailed breakdown for {viewProduct?.product.name}
            </DialogDescription>
          </DialogHeader>
          
          {viewProduct && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Product</Label>
                  <div className="font-medium">{viewProduct.product.name}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">SKU</Label>
                  <div className="font-mono">{viewProduct.product.sku}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Country</Label>
                  <div>{activeCountry?.name} ({activeCountry?.currency})</div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <Card className="bg-muted/30">
                    <CardHeader className="p-4 pb-2">
                       <CardTitle className="text-sm font-medium text-muted-foreground">CPA</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                       <div className="text-2xl font-bold">
                         {viewProduct.totalOrders > 0 
                           ? formatCurrency(viewProduct.ads / viewProduct.totalOrders, activeCountry?.currency || 'USD')
                           : '-'}
                       </div>
                       <p className="text-xs text-muted-foreground">Ads / Total Orders</p>
                    </CardContent>
                 </Card>
                 <Card className="bg-muted/30">
                    <CardHeader className="p-4 pb-2">
                       <CardTitle className="text-sm font-medium text-muted-foreground">CPAD</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                       <div className="text-2xl font-bold">
                         {viewProduct.deliveredOrders > 0 
                           ? formatCurrency(viewProduct.ads / viewProduct.deliveredOrders, activeCountry?.currency || 'USD')
                           : '-'}
                       </div>
                       <p className="text-xs text-muted-foreground">Ads / Delivered Orders</p>
                    </CardContent>
                 </Card>
                 <Card className="bg-muted/30">
                    <CardHeader className="p-4 pb-2">
                       <CardTitle className="text-sm font-medium text-muted-foreground">CPD</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                       <div className="text-2xl font-bold">
                         {viewProduct.deliveredOrders > 0 
                           ? formatCurrency((viewProduct.ads + viewProduct.serviceFees + viewProduct.productFees) / viewProduct.deliveredOrders, activeCountry?.currency || 'USD')
                           : '-'}
                       </div>
                       <p className="text-xs text-muted-foreground">Total Costs / Delivered</p>
                    </CardContent>
                 </Card>
                 <Card className="bg-muted/30">
                    <CardHeader className="p-4 pb-2">
                       <CardTitle className="text-sm font-medium text-muted-foreground">Profit</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                       <div className={`text-2xl font-bold ${viewProduct.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                         {formatCurrency(viewProduct.profit, activeCountry?.currency || 'USD')}
                       </div>
                    </CardContent>
                 </Card>
              </div>

              <div className="border rounded-md overflow-hidden">
                <Table>
                   <TableBody>
                     <TableRow>
                        <TableCell className="font-medium">Total Orders</TableCell>
                        <TableCell className="text-right">{formatNumber(viewProduct.totalOrders)}</TableCell>
                     </TableRow>
                     <TableRow>
                        <TableCell className="font-medium">Orders Confirmed</TableCell>
                        <TableCell className="text-right">{formatNumber(viewProduct.ordersConfirmed)}</TableCell>
                     </TableRow>
                     <TableRow>
                        <TableCell className="font-medium">Delivered Orders</TableCell>
                        <TableCell className="text-right">{formatNumber(viewProduct.deliveredOrders)}</TableCell>
                     </TableRow>
                     <TableRow className="border-t-2">
                        <TableCell className="font-medium">Revenue</TableCell>
                        <TableCell className="text-right">{formatCurrency(viewProduct.revenue, activeCountry?.currency || 'USD')}</TableCell>
                     </TableRow>
                     <TableRow>
                        <TableCell className="font-medium text-muted-foreground pl-6">- Ads</TableCell>
                        <TableCell className="text-right text-muted-foreground">{formatCurrency(viewProduct.ads, activeCountry?.currency || 'USD')}</TableCell>
                     </TableRow>
                     <TableRow>
                        <TableCell className="font-medium text-muted-foreground pl-6">- Service Fees</TableCell>
                        <TableCell className="text-right text-muted-foreground">{formatCurrency(viewProduct.serviceFees, activeCountry?.currency || 'USD')}</TableCell>
                     </TableRow>
                     <TableRow>
                        <TableCell className="font-medium text-muted-foreground pl-6">- Product Fees ({formatNumber(viewProduct.quantityDelivery)} x {formatCurrency(viewProduct.product?.cost || 0, activeCountry?.currency || 'USD')})</TableCell>
                        <TableCell className="text-right text-muted-foreground">{formatCurrency(viewProduct.productFees, activeCountry?.currency || 'USD')}</TableCell>
                     </TableRow>
                     <TableRow className="font-bold bg-muted/50">
                        <TableCell>Net Profit</TableCell>
                        <TableCell className={`text-right ${viewProduct.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(viewProduct.profit, activeCountry?.currency || 'USD')}
                        </TableCell>
                     </TableRow>
                   </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
