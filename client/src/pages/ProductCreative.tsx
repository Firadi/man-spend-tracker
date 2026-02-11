import { useState, useRef } from "react";
import { useStore, Product } from "@/lib/store";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, Download, Trash2, ImagePlus, Play, Video, Plus, X } from "lucide-react";

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
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const product = products.find(p => p.id === params?.id);

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-muted-foreground">Product not found</p>
        <Button variant="outline" onClick={() => navigate("/products")} data-testid="button-back-products">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Products
        </Button>
      </div>
    );
  }

  const creatives = (product.creatives && product.creatives.length > 0) ? product.creatives : (product.image ? [product.image] : []);

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

  const handleUploadMultiple = async (files: FileList) => {
    setUploading(true);
    try {
      const newPaths: string[] = [];
      for (const file of Array.from(files)) {
        const objectPath = await uploadCreativeFile(file);
        newPaths.push(objectPath);
      }
      const updated = [...creatives, ...newPaths];
      await updateProduct(product.id, { creatives: updated, image: updated[0] || undefined });
      toast({ title: `${newPaths.length} creative(s) uploaded` });
    } catch (err) {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDownload = async (path: string, index: number) => {
    try {
      const response = await fetch(path);
      const blob = await response.blob();
      const ext = path.split('.').pop() || 'jpg';
      const filename = `${product.sku || product.name}_creative_${index + 1}.${ext}`;
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

  const handleRemove = async (index: number) => {
    const updated = creatives.filter((_, i) => i !== index);
    await updateProduct(product.id, { creatives: updated, image: updated[0] || undefined });
    if (selectedIndex === index) setSelectedIndex(null);
    else if (selectedIndex !== null && selectedIndex > index) setSelectedIndex(selectedIndex - 1);
    toast({ title: "Creative removed" });
  };

  const selectedCreative = selectedIndex !== null ? creatives[selectedIndex] : null;
  const isSelectedVideo = selectedCreative ? isVideoFile(selectedCreative) : false;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/products")} data-testid="button-back-products">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight">Creatives</h2>
          <p className="text-muted-foreground">{product.name} {product.sku ? `(${product.sku})` : ''}</p>
        </div>
        <label className={uploading ? 'pointer-events-none' : ''}>
          <Button variant="default" className="gap-2" asChild>
            <span>
              <Plus className="w-4 h-4" />
              {uploading ? 'Uploading...' : 'Add Creatives'}
            </span>
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) handleUploadMultiple(e.target.files);
            }}
            data-testid="input-creative-upload"
          />
        </label>
      </div>

      {selectedCreative && (
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1">
                {isSelectedVideo ? <><Video className="w-3 h-3" /> Video</> : <><ImagePlus className="w-3 h-3" /> Image</>}
              </Badge>
              <span className="text-sm text-muted-foreground">Creative {selectedIndex! + 1} of {creatives.length}</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1" onClick={() => handleDownload(selectedCreative, selectedIndex!)}>
                <Download className="w-4 h-4" /> Download
              </Button>
              <Button variant="destructive" size="sm" className="gap-1" onClick={() => handleRemove(selectedIndex!)}>
                <Trash2 className="w-4 h-4" /> Remove
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedIndex(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="rounded-lg overflow-hidden border bg-muted/30 flex items-center justify-center">
            {isSelectedVideo ? (
              <video
                src={selectedCreative}
                className="w-full max-h-[500px] object-contain"
                controls
                playsInline
                data-testid="creative-preview-video"
              />
            ) : (
              <img
                src={selectedCreative}
                alt={`Creative ${selectedIndex! + 1}`}
                className="w-full max-h-[500px] object-contain"
                data-testid="creative-preview-image"
              />
            )}
          </div>
        </div>
      )}

      {creatives.length === 0 ? (
        <label className={`block cursor-pointer ${uploading ? 'pointer-events-none' : ''}`}>
          <div className="flex flex-col items-center justify-center h-[300px] border-2 border-dashed rounded-xl bg-muted/20 text-muted-foreground hover:bg-muted/30 transition-colors">
            <Upload className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm font-medium">No creatives uploaded yet</p>
            <p className="text-xs mt-1 opacity-70">Click to upload images or videos</p>
          </div>
          <input
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) handleUploadMultiple(e.target.files);
            }}
          />
        </label>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {creatives.map((path, index) => {
            const isVideo = isVideoFile(path);
            const isSelected = selectedIndex === index;
            return (
              <div
                key={`${path}-${index}`}
                className={`group relative rounded-lg overflow-hidden border-2 cursor-pointer transition-all hover:shadow-md ${isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'}`}
                onClick={() => setSelectedIndex(isSelected ? null : index)}
                data-testid={`creative-item-${index}`}
              >
                <div className="aspect-square bg-muted/30 flex items-center justify-center">
                  {isVideo ? (
                    <div className="relative w-full h-full">
                      <video
                        src={path}
                        className="w-full h-full object-cover"
                        muted
                        preload="metadata"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                          <Play className="w-5 h-5 text-black ml-0.5" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={path}
                      alt={`Creative ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button
                    className="w-7 h-7 rounded-full bg-white/90 shadow flex items-center justify-center hover:bg-white"
                    onClick={(e) => { e.stopPropagation(); handleDownload(path, index); }}
                    data-testid={`button-download-creative-${index}`}
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    className="w-7 h-7 rounded-full bg-red-500/90 shadow flex items-center justify-center hover:bg-red-500 text-white"
                    onClick={(e) => { e.stopPropagation(); handleRemove(index); }}
                    data-testid={`button-remove-creative-${index}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="absolute bottom-1 left-1">
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 opacity-80">
                    {isVideo ? 'VID' : 'IMG'}
                  </Badge>
                </div>
              </div>
            );
          })}

          <label className={`cursor-pointer ${uploading ? 'pointer-events-none opacity-50' : ''}`}>
            <div className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <Plus className="w-8 h-8" />
              <span className="text-xs font-medium">{uploading ? 'Uploading...' : 'Add More'}</span>
            </div>
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) handleUploadMultiple(e.target.files);
              }}
            />
          </label>
        </div>
      )}
    </div>
  );
}
