import { useState } from "react";
import { useStore, Product } from "@/lib/store";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, Download, Trash2, ImagePlus, Play, Video } from "lucide-react";

const isVideoFile = (path: string) => {
  const ext = path.split('.').pop()?.toLowerCase() || '';
  return ['mp4', 'webm', 'mov', 'avi', 'mkv', 'ogg'].includes(ext);
};


export default function ProductCreative() {
  const [, params] = useRoute("/products/:id/creative");
  const [, navigate] = useLocation();
  const { products, updateProduct } = useStore();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const product = products.find(p => p.id === params?.id);

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-muted-foreground">Product not found</p>
        <Button variant="outline" onClick={() => navigate("/products")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Products
        </Button>
      </div>
    );
  }

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

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const objectPath = await uploadCreativeFile(file);
      updateProduct(product.id, { image: objectPath });
      toast({ title: "Creative uploaded successfully" });
    } catch (err) {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async () => {
    if (!product.image) return;
    try {
      const response = await fetch(product.image);
      const blob = await response.blob();
      const ext = product.image.split('.').pop() || 'jpg';
      const filename = `${product.sku || product.name}_creative.${ext}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      toast({ title: "Download failed", variant: "destructive" });
    }
  };

  const handleRemove = () => {
    updateProduct(product.id, { image: "" });
    toast({ title: "Creative removed" });
  };

  const hasCreative = !!product.image;
  const isVideo = hasCreative && isVideoFile(product.image!);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/products")} data-testid="button-back-products">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Creative</h2>
          <p className="text-muted-foreground">{product.name} {product.sku ? `(${product.sku})` : ''}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Preview</h3>
            {hasCreative && (
              <Badge variant="secondary" className="gap-1">
                {isVideo ? <><Video className="w-3 h-3" /> Video</> : <><ImagePlus className="w-3 h-3" /> Image</>}
              </Badge>
            )}
          </div>

          {hasCreative ? (
            <div className="relative rounded-lg overflow-hidden border bg-muted/30">
              {isVideo ? (
                <video
                  src={product.image}
                  className="w-full max-h-[400px] object-contain"
                  controls
                  playsInline
                  data-testid="creative-page-video"
                />
              ) : (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full max-h-[400px] object-contain"
                  data-testid="creative-page-image"
                />
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[300px] border-2 border-dashed rounded-lg bg-muted/20 text-muted-foreground">
              <ImagePlus className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm font-medium">No creative uploaded yet</p>
              <p className="text-xs mt-1 opacity-70">Upload an image or video</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-6 space-y-4">
            <h3 className="text-lg font-semibold">Actions</h3>

            <label className={`block ${uploading ? 'pointer-events-none' : ''}`}>
              <Button variant="default" className="w-full gap-2 h-12 text-base" asChild>
                <span>
                  <Upload className="w-5 h-5" />
                  {uploading ? 'Uploading...' : hasCreative ? 'Change Creative' : 'Upload Creative'}
                </span>
              </Button>
              <input
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleUpload(f);
                }}
                data-testid="input-creative-page-upload"
              />
            </label>

            {hasCreative && (
              <>
                <Button
                  variant="outline"
                  className="w-full gap-2 h-12 text-base"
                  onClick={handleDownload}
                  data-testid="button-creative-page-download"
                >
                  <Download className="w-5 h-5" /> Export Creative
                </Button>

                <Button
                  variant="destructive"
                  className="w-full gap-2 h-12 text-base"
                  onClick={handleRemove}
                  data-testid="button-creative-page-remove"
                >
                  <Trash2 className="w-5 h-5" /> Remove Creative
                </Button>
              </>
            )}
          </div>

          <div className="rounded-xl border bg-card p-6 space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Product Info</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium">{product.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">SKU</span>
                <span className="font-mono">{product.sku || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={product.status === 'Active' ? 'default' : 'secondary'}>{product.status}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cost</span>
                <span className="font-mono">{product.cost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Price</span>
                <span className="font-mono">{product.price.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
