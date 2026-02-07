import { useState, useMemo } from "react";
import { useStore, Product } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Upload, Pencil, Trash2, FileSpreadsheet, Clipboard, Check, Filter, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Papa from "papaparse";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Schema for adding/editing a single product
const productSchema = z.object({
  sku: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  status: z.enum(["Draft", "Active"]),
  cost: z.coerce.number().min(0).default(0),
  price: z.coerce.number().min(0).default(0),
});

export default function Products() {
  const { products, countries, addProduct, addProducts, updateProduct, deleteProduct, deleteProducts } = useStore();
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  
  // Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isAssignCountryOpen, setIsAssignCountryOpen] = useState(false);

  // Country Filter
  const [countryFilter, setCountryFilter] = useState<string>("all");

  // Delete Dialog State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [idsToDelete, setIdsToDelete] = useState<string[]>([]);

  // Single Product Form
  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      sku: "",
      name: "",
      status: "Draft",
      cost: 0,
      price: 0,
    },
  });

  // Import State
  const [pasteContent, setPasteContent] = useState("");
  const [importPreview, setImportPreview] = useState<any[]>([]);

  const filteredProducts = useMemo(() => {
    if (countryFilter === "all") return products;
    if (countryFilter === "unassigned") return products.filter(p => !p.countryIds || p.countryIds.length === 0);
    return products.filter(p => p.countryIds && p.countryIds.includes(countryFilter));
  }, [products, countryFilter]);

  // Bulk Selection Handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredProducts.map(p => p.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) next.add(id);
    else next.delete(id);
    setSelectedIds(next);
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    form.reset({
      sku: product.sku,
      name: product.name,
      status: product.status,
      cost: product.cost,
      price: product.price,
    });
    setIsAddOpen(true);
  };

  const onSubmit = (data: z.infer<typeof productSchema>) => {
    if (editingId) {
      updateProduct(editingId, { ...data, sku: data.sku || "" });
      toast({ title: "Product updated" });
    } else {
      const assignCountryIds = countryFilter !== "all" && countryFilter !== "unassigned" ? [countryFilter] : [];
      addProduct({ ...data, sku: data.sku || "", countryIds: assignCountryIds });
      toast({ title: "Product added" });
    }
    setIsAddOpen(false);
    setEditingId(null);
    form.reset();
  };

  // Delete Handler
  const confirmDelete = (id: string) => {
    setIdsToDelete([id]);
    setDeleteDialogOpen(true);
  };

  const confirmBulkDelete = () => {
    setIdsToDelete(Array.from(selectedIds));
    setDeleteDialogOpen(true);
  };

  const executeDelete = () => {
    if (idsToDelete.length === 1) {
      deleteProduct(idsToDelete[0]);
      toast({ title: "Product deleted" });
    } else if (idsToDelete.length > 1) {
      deleteProducts(idsToDelete);
      toast({ title: `Deleted ${idsToDelete.length} products` });
    }
    setIdsToDelete([]);
    setDeleteDialogOpen(false);
    setSelectedIds(new Set()); // Clear selection if it was a bulk delete
  };

  const toggleStatus = (product: Product) => {
    updateProduct(product.id, { status: product.status === "Active" ? "Draft" : "Active" });
  };

  // Bulk Actions
  const bulkSetStatus = (status: 'Active' | 'Draft') => {
    selectedIds.forEach(id => updateProduct(id, { status }));
    toast({ title: `Updated ${selectedIds.size} products to ${status}` });
    setSelectedIds(new Set());
  };

  // Country Assignment Dialog Content
  const [selectedCountryIdsForAssignment, setSelectedCountryIdsForAssignment] = useState<Set<string>>(new Set());
  
  const openAssignDialog = () => {
     setIsAssignCountryOpen(true);
     setSelectedCountryIdsForAssignment(new Set());
  };

  const commitCountryAssignment = () => {
     const newCountryIds = Array.from(selectedCountryIdsForAssignment);
     selectedIds.forEach(id => {
       const product = products.find(p => p.id === id);
       if (product) {
         // Merge logic: ensure unique
         const current = new Set(product.countryIds || []);
         newCountryIds.forEach(cid => current.add(cid));
         updateProduct(id, { countryIds: Array.from(current) });
       }
     });
     toast({ title: `Assigned ${selectedIds.size} products to ${newCountryIds.length} countries` });
     setIsAssignCountryOpen(false);
     setSelectedIds(new Set());
  };

  // Import Logic
  const handleParse = (content: string, type: 'csv' | 'paste') => {
    Papa.parse(content, {
      header: true,
      skipEmptyLines: true,
      complete: (results: Papa.ParseResult<any>) => {
        let items = results.data;
        const headers = results.meta.fields || [];
        const hasNameHeader = headers.some(h => /name|product/i.test(h));
        
        if (!hasNameHeader || type === 'paste') {
           Papa.parse(content, {
             header: false,
             skipEmptyLines: true,
             complete: (res: Papa.ParseResult<any>) => {
                const rows = res.data as string[][];
                let startIdx = 0;
                if (rows.length > 0 && /name|product|sku/i.test(rows[0].join(''))) {
                   startIdx = 1;
                }
                const mapped = rows.slice(startIdx).map((row: string[]) => {
                   const sku = row[0] || "";
                   const name = row[1] || row[0] || "Unknown Product"; 
                   if (row.length === 1) return { sku: "", name: row[0] };
                   return { sku, name };
                }).filter(p => p.name); 
                setImportPreview(mapped);
             }
           });
        } else {
           const mapped = items.map((row: any) => {
             const keys = Object.keys(row);
             const nameKey = keys.find((k: string) => /name|product/i.test(k));
             const skuKey = keys.find((k: string) => /sku|code|id/i.test(k));
             return {
               sku: skuKey ? row[skuKey] : "",
               name: nameKey ? row[nameKey] : "Unknown",
             };
           }).filter((p: any) => p.name && p.name !== "Unknown");
           setImportPreview(mapped);
        }
      }
    });
  };

  const handlePasteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPasteContent(e.target.value);
    handleParse(e.target.value, 'paste');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results: Papa.ParseResult<any>) => {
           const items = results.data;
           const mapped = items.map((row: any) => {
             const keys = Object.keys(row);
             const nameKey = keys.find((k: string) => /name|product/i.test(k));
             const skuKey = keys.find((k: string) => /sku|code|id/i.test(k));
             return {
               sku: skuKey ? row[skuKey] : "",
               name: nameKey ? row[nameKey] : (Object.values(row)[1] || Object.values(row)[0]),
             };
           }).filter((p: any) => p.name);
           setImportPreview(mapped);
        }
      });
    }
  };

  const commitImport = () => {
    const assignCountryIds = countryFilter !== "all" && countryFilter !== "unassigned" ? [countryFilter] : [];
    const countryName = assignCountryIds.length > 0 ? countries.find(c => c.id === assignCountryIds[0])?.name : null;
    const newProducts = importPreview.map(p => ({
      sku: p.sku,
      name: p.name,
      status: 'Draft' as const,
      cost: 0,
      price: 0,
      countryIds: assignCountryIds
    }));
    addProducts(newProducts);
    setIsImportOpen(false);
    setImportPreview([]);
    setPasteContent("");
    const msg = countryName ? `Imported ${newProducts.length} products → ${countryName}` : `Imported ${newProducts.length} products`;
    toast({ title: msg });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Products</h2>
            <p className="text-muted-foreground">Manage your product catalog.</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger className="w-[180px]" data-testid="select-country-filter">
                <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="All Countries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {countries.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Upload className="w-4 h-4" /> Import
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Import Products</DialogTitle>
                  <DialogDescription>
                    Copy/paste from Excel or upload a CSV. Defaults: Draft, Cost 0, Price 0.
                    {countryFilter !== "all" && countryFilter !== "unassigned" && (
                      <span className="block mt-1 font-medium text-primary">
                        Products will be assigned to: {countries.find(c => c.id === countryFilter)?.name}
                      </span>
                    )}
                  </DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="paste">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="paste">Paste Data</TabsTrigger>
                    <TabsTrigger value="upload">Upload CSV</TabsTrigger>
                  </TabsList>
                  <TabsContent value="paste" className="space-y-4">
                    <Textarea 
                      placeholder="Paste your spreadsheet data here..." 
                      className="min-h-[200px] font-mono text-xs"
                      value={pasteContent}
                      onChange={handlePasteChange}
                    />
                  </TabsContent>
                  <TabsContent value="upload" className="space-y-4">
                    <div className="flex items-center justify-center w-full">
                      <Label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                          <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span></p>
                          <p className="text-xs text-muted-foreground">CSV (MAX. 10MB)</p>
                        </div>
                        <Input id="dropzone-file" type="file" className="hidden" accept=".csv" onChange={handleFileUpload} />
                      </Label>
                    </div>
                  </TabsContent>
                </Tabs>
                {importPreview.length > 0 && (
                  <div className="mt-4">
                    <Button onClick={commitImport} className="w-full mt-4">
                      Import {importPreview.length} Products
                    </Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            <Dialog open={isAddOpen} onOpenChange={(open) => {
              setIsAddOpen(open);
              if (!open) {
                setEditingId(null);
                form.reset();
              }
            }}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" /> Add Product
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingId ? "Edit Product" : "Add Product"}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="sku"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SKU</FormLabel>
                          <FormControl>
                            <Input placeholder="OPTIONAL-SKU" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Product Name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Active Status</FormLabel>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value === "Active"}
                              onCheckedChange={(c) => field.onChange(c ? "Active" : "Draft")}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="cost"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cost</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      {editingId ? "Save Changes" : "Create Product"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Bulk Actions Toolbar */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md animate-in slide-in-from-top-2">
            <span className="text-sm font-medium px-2">{selectedIds.size} selected</span>
            <div className="h-4 w-px bg-border mx-2" />
            <Button size="sm" variant="outline" onClick={() => bulkSetStatus('Active')}>Set Active</Button>
            <Button size="sm" variant="outline" onClick={() => bulkSetStatus('Draft')}>Set Draft</Button>
            <Button size="sm" variant="outline" onClick={openAssignDialog}>Assign Countries</Button>
            <Button size="sm" variant="destructive" onClick={confirmBulkDelete} className="ml-auto">Delete Selected</Button>
          </div>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected {idsToDelete.length} product{idsToDelete.length > 1 ? 's' : ''}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isAssignCountryOpen} onOpenChange={setIsAssignCountryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Countries</DialogTitle>
            <DialogDescription>
              Select countries to assign to the selected {selectedIds.size} products.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[200px] border rounded-md p-4">
             <div className="space-y-2">
                {countries.map(c => (
                  <div key={c.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`country-${c.id}`} 
                      checked={selectedCountryIdsForAssignment.has(c.id)}
                      onCheckedChange={(checked) => {
                         const next = new Set(selectedCountryIdsForAssignment);
                         if (checked) next.add(c.id);
                         else next.delete(c.id);
                         setSelectedCountryIdsForAssignment(next);
                      }}
                    />
                    <Label htmlFor={`country-${c.id}`}>{c.name}</Label>
                  </div>
                ))}
             </div>
          </ScrollArea>
          <DialogFooter>
             <Button onClick={commitCountryAssignment}>Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox 
                  checked={filteredProducts.length > 0 && selectedIds.size === filteredProducts.length}
                  onCheckedChange={(c) => handleSelectAll(!!c)}
                />
              </TableHead>
              <TableHead className="w-[120px]">SKU</TableHead>
              <TableHead>Product Name</TableHead>
              <TableHead className="text-right">Cost</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="w-[100px] text-center">Status</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
               <TableRow>
                 <TableCell colSpan={7} className="h-24 text-center">
                   No products found.
                 </TableCell>
               </TableRow>
            ) : (
              filteredProducts.map((product) => (
                <TableRow key={product.id} className="group">
                  <TableCell>
                    <Checkbox 
                      checked={selectedIds.has(product.id)}
                      onCheckedChange={(c) => handleSelectRow(product.id, !!c)}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{product.sku || '-'}</TableCell>
                  <TableCell className="font-medium">
                    <div>{product.name}</div>
                    {product.countryIds && product.countryIds.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {product.countryIds.map(cid => {
                           const c = countries.find(co => co.id === cid);
                           return c ? (
                             <Badge key={cid} variant="outline" className="text-[10px] px-1 py-0 h-4">
                               {c.name.substring(0, 2).toUpperCase()}
                             </Badge>
                           ) : null;
                        })}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono">{product.cost.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-mono">{product.price.toFixed(2)}</TableCell>
                  <TableCell className="text-center">
                    <Badge 
                      variant={product.status === 'Active' ? 'default' : 'secondary'}
                      className="cursor-pointer"
                      onClick={() => toggleStatus(product)}
                    >
                      {product.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(product)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => confirmDelete(product.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
