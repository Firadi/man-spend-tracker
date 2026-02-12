import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useStore, Product } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Upload, Pencil, Trash2, Globe, ImagePlus, Play, X, Search, Package, CheckCircle, Image } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useUpload } from "@/hooks/use-upload";
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

const isVideoFile = (path: string) => {
  const ext = path.split('.').pop()?.toLowerCase() || '';
  return ['mp4', 'webm', 'mov', 'avi', 'mkv', 'ogg'].includes(ext);
};

const productSchema = z.object({
  sku: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  status: z.enum(["Draft", "Active"]),
  cost: z.coerce.number().min(0).default(0),
  price: z.coerce.number().min(0).default(0),
  countryIds: z.array(z.string()).default([]),
});

export default function Products() {
  const { products, countries, addProduct, addProducts, updateProduct, deleteProduct, deleteProducts } = useStore();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  
  // Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isAssignCountryOpen, setIsAssignCountryOpen] = useState(false);

  // Filters
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [productSearch, setProductSearch] = useState<string>("");

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
      countryIds: [],
    },
  });

  // Import State
  const [pasteContent, setPasteContent] = useState("");
  const [importPreview, setImportPreview] = useState<any[]>([]);

  const filteredProducts = useMemo(() => {
    let result = products;
    if (countryFilter === "unassigned") result = result.filter(p => !p.countryIds || p.countryIds.length === 0);
    else if (countryFilter !== "all") result = result.filter(p => p.countryIds && p.countryIds.includes(countryFilter));
    if (statusFilter === "active") result = result.filter(p => p.status === "Active");
    else if (statusFilter === "draft") result = result.filter(p => p.status === "Draft");
    if (productSearch.trim()) {
      const q = productSearch.toLowerCase().trim();
      result = result.filter(p => p.name.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q)));
    }
    return [...result].sort((a, b) => {
      if (a.status === "Active" && b.status !== "Active") return -1;
      if (a.status !== "Active" && b.status === "Active") return 1;
      return 0;
    });
  }, [products, countryFilter, statusFilter, productSearch]);

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
    setEditCreativeUrl(product.image || null);
    form.reset({
      sku: product.sku,
      name: product.name,
      status: product.status,
      cost: product.cost,
      price: product.price,
      countryIds: product.countryIds || [],
    });
    setIsAddOpen(true);
  };

  const onSubmit = (data: z.infer<typeof productSchema>) => {
    if (editingId) {
      updateProduct(editingId, { ...data, sku: data.sku || "", countryIds: data.countryIds, image: editCreativeUrl || undefined });
      toast({ title: "Product updated" });
    } else {
      const assignCountryIds = data.countryIds.length > 0 ? data.countryIds : (countryFilter !== "all" && countryFilter !== "unassigned" ? [countryFilter] : []);
      addProduct({ ...data, sku: data.sku || "", countryIds: assignCountryIds, image: editCreativeUrl || undefined, creatives: [] });
      toast({ title: "Product added" });
    }
    setIsAddOpen(false);
    setEditingId(null);
    setEditCreativeUrl(null);
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

  const [editCreativeUrl, setEditCreativeUrl] = useState<string | null>(null);
  const [editCreativeUploading, setEditCreativeUploading] = useState(false);

  const uploadCreativeFile = async (file: File): Promise<string> => {
    const res = await fetch("/api/uploads/request-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
    });
    if (!res.ok) throw new Error("Failed to get upload URL");
    const { uploadURL, objectPath } = await res.json();
    const uploadRes = await fetch(uploadURL, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
    if (!uploadRes.ok) throw new Error("Upload failed");
    return objectPath;
  };

  const handleDialogCreativeUpload = async (file: File) => {
    setEditCreativeUploading(true);
    try {
      const objectPath = await uploadCreativeFile(file);
      setEditCreativeUrl(objectPath);
      toast({ title: "Creative uploaded" });
    } catch (err) {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setEditCreativeUploading(false);
    }
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
      countryIds: assignCountryIds,
      creatives: []
    }));
    addProducts(newProducts);
    setIsImportOpen(false);
    setImportPreview([]);
    setPasteContent("");
    const msg = countryName ? `Imported ${newProducts.length} products → ${countryName}` : `Imported ${newProducts.length} products`;
    toast({ title: msg });
  };

  const totalProducts = filteredProducts.length;
  const activeProducts = filteredProducts.filter(p => p.status === "Active").length;
  const totalCreatives = filteredProducts.reduce((sum, p) => {
    const count = (p.creatives && p.creatives.length > 0) ? p.creatives.length : (p.image ? 1 : 0);
    return sum + count;
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Products</h2>
            <p className="text-muted-foreground">Manage your product catalog.</p>
          </div>
          <div className="flex items-center gap-2">
            {(productSearch || statusFilter !== "all" || countryFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground"
                onClick={() => { setProductSearch(""); setStatusFilter("all"); setCountryFilter("all"); }}
                data-testid="button-reset-filters"
              >
                <X className="w-3.5 h-3.5" />
                All
              </Button>
            )}

            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-[180px] pl-8"
                data-testid="input-product-search"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]" data-testid="select-status-filter">
                <CheckCircle className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>

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
                setEditCreativeUrl(null);
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
                    <div className="space-y-2">
                      <Label>Creative (Image / Video)</Label>
                      <div className="flex items-center gap-4">
                        {editCreativeUrl ? (
                          <div className="relative group/preview">
                            {isVideoFile(editCreativeUrl) ? (
                              <>
                                <video
                                  src={editCreativeUrl}
                                  className="w-20 h-20 rounded-lg object-cover border"
                                  muted
                                  playsInline
                                  onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
                                  onMouseLeave={(e) => { const v = e.target as HTMLVideoElement; v.pause(); v.currentTime = 0; }}
                                  data-testid="preview-creative-video"
                                />
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                  <div className="bg-black/60 rounded-full p-1">
                                    <Play className="w-4 h-4 text-white fill-white" />
                                  </div>
                                </div>
                              </>
                            ) : (
                              <img
                                src={editCreativeUrl}
                                alt="Creative"
                                className="w-20 h-20 rounded-lg object-cover border"
                                data-testid="preview-creative-image"
                              />
                            )}
                            <button
                              type="button"
                              onClick={() => setEditCreativeUrl(null)}
                              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5"
                              data-testid="button-remove-creative"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : null}
                        <label className={`flex-1 flex flex-col items-center justify-center h-20 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors ${editCreativeUploading ? 'animate-pulse pointer-events-none' : ''}`}>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <ImagePlus className="w-5 h-5" />
                            <span className="text-sm">{editCreativeUploading ? 'Uploading...' : editCreativeUrl ? 'Change' : 'Upload image or video'}</span>
                          </div>
                          <input
                            type="file"
                            accept="image/*,video/*"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleDialogCreativeUpload(f);
                            }}
                            data-testid="input-dialog-creative-upload"
                          />
                        </label>
                      </div>
                    </div>
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
                    {countries.length > 0 && (
                      <FormField
                        control={form.control}
                        name="countryIds"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Countries</FormLabel>
                            <div className="border rounded-md p-3 space-y-2 max-h-[150px] overflow-y-auto">
                              {countries.map(c => {
                                const isChecked = field.value?.includes(c.id) || false;
                                return (
                                  <div key={c.id} className="flex items-center gap-2">
                                    <Checkbox
                                      checked={isChecked}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          field.onChange([...(field.value || []), c.id]);
                                        } else {
                                          field.onChange((field.value || []).filter((id: string) => id !== c.id));
                                        }
                                      }}
                                      data-testid={`checkbox-country-${c.id}`}
                                    />
                                    <label className="text-sm flex items-center gap-2 cursor-pointer">
                                      {c.code && (
                                        <img
                                          src={`https://flagcdn.com/w20/${c.code.toLowerCase()}.png`}
                                          alt={c.code}
                                          className="h-3 w-auto rounded-sm border"
                                        />
                                      )}
                                      {c.name} ({c.currency})
                                    </label>
                                  </div>
                                );
                              })}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    <Button type="submit" className="w-full">
                      {editingId ? "Save Changes" : "Create Product"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Card data-testid="stat-total-products">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Package className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalProducts}</p>
                <p className="text-xs text-muted-foreground">Total Products</p>
              </div>
            </CardContent>
          </Card>
          <Card data-testid="stat-active-products">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeProducts}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </CardContent>
          </Card>
          <Card data-testid="stat-with-creatives">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Image className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalCreatives}</p>
                <p className="text-xs text-muted-foreground">Total Creatives</p>
              </div>
            </CardContent>
          </Card>
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
              <TableHead className="w-[70px] text-center">Creative</TableHead>
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
                 <TableCell colSpan={8} className="h-24 text-center">
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
                  <TableCell className="text-center">
                    {(() => {
                      const thumb = product.creatives?.[0] || product.image;
                      const count = product.creatives?.length || 0;
                      if (thumb) {
                        return (
                          <div className="flex items-center justify-center">
                            <div
                              className="relative group/img cursor-pointer"
                              onClick={() => navigate(`/products/${product.id}/creative`)}
                            >
                              {isVideoFile(thumb) ? (
                                <>
                                  <video
                                    src={thumb}
                                    className="w-10 h-10 rounded object-cover border"
                                    muted
                                    playsInline
                                    data-testid={`video-creative-${product.id}`}
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="bg-black/60 rounded-full p-0.5">
                                      <Play className="w-3 h-3 text-white fill-white" />
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <img
                                  src={thumb}
                                  alt={product.name}
                                  className="w-10 h-10 rounded object-cover border"
                                  data-testid={`img-creative-${product.id}`}
                                />
                              )}
                              {count > 1 && (
                                <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                                  {count}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div className="flex items-center justify-center">
                          <div
                            className="w-10 h-10 rounded border-2 border-dashed border-muted-foreground/30 flex items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
                            onClick={() => navigate(`/products/${product.id}/creative`)}
                          >
                            <ImagePlus className="w-4 h-4 text-muted-foreground/50" />
                          </div>
                        </div>
                      );
                    })()}
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
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => navigate(`/products/${product.id}/creative`)}
                        data-testid={`button-creative-manage-${product.id}`}
                      >
                        <ImagePlus className="w-4 h-4" />
                      </Button>
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
