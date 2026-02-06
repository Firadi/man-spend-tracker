import { useState, useMemo } from "react";
import { useStore, Product } from "@/lib/store";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, GripHorizontal } from "lucide-react";
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
  { id: 'revenue', label: 'Revenue', align: 'right', width: 'w-[140px]', editable: true },
  { id: 'ads', label: 'Ads', align: 'right', width: 'w-[140px]', editable: true },
  { id: 'serviceFees', label: 'Service Fees', align: 'right', width: 'w-[140px]', editable: true },
  { id: 'productFees', label: 'Prod. Fees', align: 'right', width: 'w-[140px]', editable: true },
  { id: 'deliveredOrders', label: 'Delivered Order', align: 'right', width: 'w-[140px]', editable: true },
  { id: 'profit', label: 'Profit', align: 'right', width: 'w-[140px]' },
];

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
  const { countries, products, analysis, updateAnalysis, columnOrder, setColumnOrder } = useStore();
  const [selectedCountryId, setSelectedCountryId] = useState<string>(countries[0]?.id || "");
  const [showDrafts, setShowDrafts] = useState(false);

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
      const delivered = getAnalysisValue(productId, 'deliveredOrders');
      const feePerOrder = activeCountry.defaultShipping + activeCountry.defaultCod + activeCountry.defaultReturn;
      return delivered * feePerOrder;
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
      id: p.id,
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
    if (row.deliveredOrders > 0) return acc + row.deliveredOrders;
    if (row.product.price > 0) return acc + (row.revenue / row.product.price);
    return acc;
  }, 0);

  const globalMargin = totals.revenue > 0 ? (totals.profit / totals.revenue) * 100 : 0;

  // Render Cell Helper
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
      default:
        // Editable fields
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
                    <TableRow key={row.product.id}>
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
    </div>
  );
}
