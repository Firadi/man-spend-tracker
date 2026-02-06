import { useState } from "react";
import { useStore, Product } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Plus, Upload, Pencil, Trash2, FileSpreadsheet, Clipboard } from "lucide-react";
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

// Schema for adding/editing a single product
const productSchema = z.object({
  sku: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  status: z.enum(["Draft", "Active"]),
  cost: z.coerce.number().min(0).default(0),
  price: z.coerce.number().min(0).default(0),
});

export default function Products() {
  const { products, addProduct, addProducts, updateProduct, deleteProduct } = useStore();
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  
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
      addProduct({ ...data, sku: data.sku || "" });
      toast({ title: "Product added" });
    }
    setIsAddOpen(false);
    setEditingId(null);
    form.reset();
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this product?")) {
      deleteProduct(id);
    }
  };

  const toggleStatus = (product: Product) => {
    updateProduct(product.id, { status: product.status === "Active" ? "Draft" : "Active" });
  };

  // Import Logic
  const handleParse = (content: string, type: 'csv' | 'paste') => {
    Papa.parse(content, {
      header: true,
      skipEmptyLines: true,
      complete: (results: Papa.ParseResult<any>) => {
        let items = results.data;
        
        // If no headers detected or headers seem wrong, try headerless parse
        const headers = results.meta.fields || [];
        const hasNameHeader = headers.some(h => /name|product/i.test(h));
        
        if (!hasNameHeader || type === 'paste') {
           // Re-parse without headers for paste or failed header detection
           Papa.parse(content, {
             header: false,
             skipEmptyLines: true,
             complete: (res: Papa.ParseResult<any>) => {
                const rows = res.data as string[][];
                
                // Heuristic: If row 0 looks like header, skip it.
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
           // Header based mapping
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
    const newProducts = importPreview.map(p => ({
      sku: p.sku,
      name: p.name,
      status: 'Draft' as const,
      cost: 0,
      price: 0
    }));
    addProducts(newProducts);
    setIsImportOpen(false);
    setImportPreview([]);
    setPasteContent("");
    toast({ title: `Imported ${newProducts.length} products` });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Products</h2>
          <p className="text-muted-foreground">Manage your product catalog.</p>
        </div>
        <div className="flex gap-2">
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
                  Copy/paste from Excel or upload a CSV. We'll try to auto-detect SKU and Name.
                  Defaults: Draft, Cost 0, Price 0.
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
                        <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                        <p className="text-xs text-muted-foreground">CSV (MAX. 10MB)</p>
                      </div>
                      <Input id="dropzone-file" type="file" className="hidden" accept=".csv" onChange={handleFileUpload} />
                    </Label>
                  </div>
                </TabsContent>
              </Tabs>

              {importPreview.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Preview ({importPreview.length} items)</h4>
                  <div className="max-h-[200px] overflow-auto border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>SKU</TableHead>
                          <TableHead>Name</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {importPreview.slice(0, 10).map((item, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-mono text-xs">{item.sku || '-'}</TableCell>
                            <TableCell>{item.name}</TableCell>
                          </TableRow>
                        ))}
                        {importPreview.length > 10 && (
                          <TableRow>
                            <TableCell colSpan={2} className="text-center text-muted-foreground">
                              ...and {importPreview.length - 10} more
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
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

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">SKU</TableHead>
              <TableHead>Product Name</TableHead>
              <TableHead className="text-right">Cost</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="w-[100px] text-center">Status</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
               <TableRow>
                 <TableCell colSpan={6} className="h-24 text-center">
                   No products found.
                 </TableCell>
               </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id} className="group">
                  <TableCell className="font-mono text-xs text-muted-foreground">{product.sku || '-'}</TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
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
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(product.id)}>
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
