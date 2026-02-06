import { useState } from "react";
import { useStore, Country } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const countrySchema = z.object({
  name: z.string().min(1, "Name is required"),
  currency: z.string().min(1, "Currency is required").default("USD"),
  defaultShipping: z.coerce.number().min(0).default(0),
  defaultCod: z.coerce.number().min(0).default(0),
  defaultReturn: z.coerce.number().min(0).default(0),
});

export default function Countries() {
  const { countries, addCountry, updateCountry, deleteCountry } = useStore();
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<z.infer<typeof countrySchema>>({
    resolver: zodResolver(countrySchema),
    defaultValues: {
      name: "",
      currency: "USD",
      defaultShipping: 0,
      defaultCod: 0,
      defaultReturn: 0,
    },
  });

  const onSubmit = (data: z.infer<typeof countrySchema>) => {
    if (editingId) {
      updateCountry(editingId, data);
      toast({ title: "Country updated", description: `${data.name} has been updated.` });
    } else {
      addCountry(data);
      toast({ title: "Country added", description: `${data.name} has been added.` });
    }
    setIsOpen(false);
    setEditingId(null);
    form.reset();
  };

  const handleEdit = (country: Country) => {
    setEditingId(country.id);
    form.reset({
      name: country.name,
      currency: country.currency,
      defaultShipping: country.defaultShipping,
      defaultCod: country.defaultCod,
      defaultReturn: country.defaultReturn,
    });
    setIsOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this country?")) {
      deleteCountry(id);
      toast({ title: "Country deleted" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Countries</h2>
          <p className="text-muted-foreground">Manage shipping destinations and default fees.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) {
            setEditingId(null);
            form.reset({
              name: "",
              currency: "USD",
              defaultShipping: 0,
              defaultCod: 0,
              defaultReturn: 0,
            });
          }
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" /> Add Country
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Country" : "Add New Country"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. United States" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency Code</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. USD" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="defaultShipping"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Def. Shipping</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="defaultCod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Def. COD Fee</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="defaultReturn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Def. Return</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingId ? "Save Changes" : "Create Country"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {countries.map((country) => (
          <Card key={country.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">
                {country.name}
              </CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-4">{country.currency}</div>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Default Shipping:</span>
                  <span className="font-medium text-foreground">{country.defaultShipping}</span>
                </div>
                <div className="flex justify-between">
                  <span>Default COD:</span>
                  <span className="font-medium text-foreground">{country.defaultCod}</span>
                </div>
                <div className="flex justify-between">
                  <span>Default Return:</span>
                  <span className="font-medium text-foreground">{country.defaultReturn}</span>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(country)}>
                  <Pencil className="w-4 h-4 mr-2" /> Edit
                </Button>
                <Button variant="destructive" size="sm" className="flex-1" onClick={() => handleDelete(country.id)}>
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {countries.length === 0 && (
          <div className="col-span-full text-center py-12 border-2 border-dashed rounded-lg text-muted-foreground">
            No countries added yet. Click "Add Country" to get started.
          </div>
        )}
      </div>
    </div>
  );
}
