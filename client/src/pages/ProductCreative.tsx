import { useState, useRef } from "react";
import { useStore, Product } from "@/lib/store";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
    ArrowLeft,
    Upload,
    Download,
    Trash2,
    ImagePlus,
    Play,
    Video,
    Plus,
    X,
    FileArchive,
    CheckSquare,
    Square,
} from "lucide-react";
import JSZip from "jszip";

const isVideoFile = (path: string) => {
    const ext = path.split(".").pop()?.toLowerCase() || "";
    return ["mp4", "webm", "mov", "avi", "mkv", "ogg"].includes(ext);
};

const isMediaFile = (name: string) => {
    const ext = name.split(".").pop()?.toLowerCase() || "";
    return [
        "jpg",
        "jpeg",
        "png",
        "gif",
        "webp",
        "bmp",
        "svg",
        "mp4",
        "webm",
        "mov",
        "avi",
        "mkv",
        "ogg",
    ].includes(ext);
};

const getMimeType = (name: string) => {
    const ext = name.split(".").pop()?.toLowerCase() || "";
    const mimeMap: Record<string, string> = {
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        gif: "image/gif",
        webp: "image/webp",
        bmp: "image/bmp",
        svg: "image/svg+xml",
        mp4: "video/mp4",
        webm: "video/webm",
        mov: "video/quicktime",
        avi: "video/x-msvideo",
        mkv: "video/x-matroska",
        ogg: "video/ogg",
    };
    return mimeMap[ext] || "application/octet-stream";
};

export default function ProductCreative() {
    const [, params] = useRoute("/products/:id/creative");
    const [, navigate] = useLocation();
    const { products, updateProduct } = useStore();
    const { toast } = useToast();
    const [uploading, setUploading] = useState(false);
    const [importingZip, setImportingZip] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [previewIndex, setPreviewIndex] = useState<number | null>(null);
    const [selectedIndices, setSelectedIndices] = useState<Set<number>>(
        new Set(),
    );
    const [selectMode, setSelectMode] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const zipInputRef = useRef<HTMLInputElement>(null);

    const product = products.find((p) => p.id === params?.id);

    if (!product) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <p className="text-muted-foreground">Product not found</p>
                <Button
                    variant="outline"
                    onClick={() => navigate("/products")}
                    data-testid="button-back-products"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Products
                </Button>
            </div>
        );
    }

    const creatives =
        product.creatives && product.creatives.length > 0
            ? product.creatives
            : product.image
              ? [product.image]
              : [];

    const uploadCreativeFile = async (file: File): Promise<string> => {
        const res = await fetch("/api/uploads/request-url", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: file.name,
                size: file.size,
                contentType: file.type,
            }),
        });
        if (!res.ok) throw new Error("Failed to get upload URL");
        const { uploadURL, objectPath } = await res.json();
        const uploadRes = await fetch(uploadURL, {
            method: "PUT",
            body: file,
        });
        if (!uploadRes.ok) {
            const errorText = await uploadRes.text();
            console.error("S3 upload error:", errorText);
            throw new Error("Upload failed");
        }
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
            await updateProduct(product.id, {
                creatives: updated,
                image: updated[0] || undefined,
            });
            toast({ title: `${newPaths.length} creative(s) uploaded` });
        } catch (err) {
            toast({ title: "Upload failed", variant: "destructive" });
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleImportZip = async (file: File) => {
        setImportingZip(true);
        try {
            const zip = await JSZip.loadAsync(file);
            const mediaFiles: { name: string; blob: Blob }[] = [];

            for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
                if (zipEntry.dir) continue;
                const pathSegments = relativePath.split("/");
                if (
                    pathSegments.some(
                        (seg) => seg.startsWith(".") || seg.startsWith("__"),
                    )
                )
                    continue;
                const fileName = pathSegments.pop() || relativePath;
                if (!isMediaFile(fileName)) continue;
                const blob = await zipEntry.async("blob");
                mediaFiles.push({ name: fileName, blob });
            }

            if (mediaFiles.length === 0) {
                toast({
                    title: "No images or videos found in ZIP",
                    variant: "destructive",
                });
                return;
            }

            const newPaths: string[] = [];
            for (const { name, blob } of mediaFiles) {
                const mimeType = getMimeType(name);
                const fileObj = new File([blob], name, { type: mimeType });
                const objectPath = await uploadCreativeFile(fileObj);
                newPaths.push(objectPath);
            }

            const updated = [...creatives, ...newPaths];
            await updateProduct(product.id, {
                creatives: updated,
                image: updated[0] || undefined,
            });
            toast({
                title: `${newPaths.length} creative(s) imported from ZIP`,
            });
        } catch (err) {
            toast({ title: "ZIP import failed", variant: "destructive" });
        } finally {
            setImportingZip(false);
            if (zipInputRef.current) zipInputRef.current.value = "";
        }
    };

    const handleExportSelected = async () => {
        if (selectedIndices.size === 0) {
            toast({
                title: "Select creatives to export",
                variant: "destructive",
            });
            return;
        }
        setExporting(true);
        try {
            const zip = new JSZip();
            const indices = Array.from(selectedIndices).sort((a, b) => a - b);

            for (const idx of indices) {
                const path = creatives[idx];
                if (!path) continue;
                const response = await fetch(path);
                const blob = await response.blob();
                const cleanPath = path.split("?")[0];
                const ext = cleanPath.split(".").pop() || "jpg";
                const fileName = `${product.sku || product.name}_creative_${idx + 1}.${ext}`;
                zip.file(fileName, blob);
            }

            const content = await zip.generateAsync({ type: "blob" });
            const url = URL.createObjectURL(content);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${product.sku || product.name}_creatives.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast({ title: `${indices.length} creative(s) exported as ZIP` });
        } catch (err) {
            toast({ title: "Export failed", variant: "destructive" });
        } finally {
            setExporting(false);
        }
    };

    const handleDownload = async (path: string, index: number) => {
        try {
            const response = await fetch(path);
            const blob = await response.blob();
            const ext = path.split(".").pop() || "jpg";
            const filename = `${product.sku || product.name}_creative_${index + 1}.${ext}`;
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
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
        await updateProduct(product.id, {
            creatives: updated,
            image: updated[0] || undefined,
        });
        if (previewIndex === index) setPreviewIndex(null);
        else if (previewIndex !== null && previewIndex > index)
            setPreviewIndex(previewIndex - 1);
        setSelectedIndices((prev) => {
            const next = new Set<number>();
            prev.forEach((i) => {
                if (i < index) next.add(i);
                else if (i > index) next.add(i - 1);
            });
            return next;
        });
        toast({ title: "Creative removed" });
    };

    const toggleSelect = (index: number) => {
        setSelectedIndices((prev) => {
            const next = new Set(prev);
            if (next.has(index)) next.delete(index);
            else next.add(index);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIndices.size === creatives.length) {
            setSelectedIndices(new Set());
        } else {
            setSelectedIndices(new Set(creatives.map((_, i) => i)));
        }
    };

    const previewCreative =
        previewIndex !== null ? creatives[previewIndex] : null;
    const isPreviewVideo = previewCreative
        ? isVideoFile(previewCreative)
        : false;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 flex-wrap">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate("/products")}
                    data-testid="button-back-products"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold tracking-tight">
                        Creatives
                    </h2>
                    <p className="text-muted-foreground truncate">
                        {product.name} {product.sku ? `(${product.sku})` : ""}
                    </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    {creatives.length > 0 && (
                        <Button
                            variant={selectMode ? "default" : "outline"}
                            size="sm"
                            className="gap-1.5"
                            onClick={() => {
                                if (!selectMode) setPreviewIndex(null);
                                else setSelectedIndices(new Set());
                                setSelectMode(!selectMode);
                            }}
                            data-testid="button-toggle-select"
                        >
                            <CheckSquare className="w-4 h-4" />
                            {selectMode ? "Cancel" : "Select"}
                        </Button>
                    )}

                    {selectMode && selectedIndices.size > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5"
                            onClick={handleExportSelected}
                            disabled={exporting}
                            data-testid="button-export-selected"
                        >
                            <Download className="w-4 h-4" />
                            {exporting
                                ? "Exporting..."
                                : `Export (${selectedIndices.size})`}
                        </Button>
                    )}

                    <label
                        className={importingZip ? "pointer-events-none" : ""}
                    >
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5"
                            asChild
                        >
                            <span>
                                <FileArchive className="w-4 h-4" />
                                {importingZip ? "Importing..." : "Import ZIP"}
                            </span>
                        </Button>
                        <input
                            ref={zipInputRef}
                            type="file"
                            accept=".zip"
                            className="hidden"
                            onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleImportZip(f);
                            }}
                            data-testid="input-import-zip"
                        />
                    </label>

                    <label className={uploading ? "pointer-events-none" : ""}>
                        <Button
                            variant="default"
                            size="sm"
                            className="gap-1.5"
                            asChild
                        >
                            <span>
                                <Plus className="w-4 h-4" />
                                {uploading ? "Uploading..." : "Add Creatives"}
                            </span>
                        </Button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,video/*"
                            multiple
                            className="hidden"
                            onChange={(e) => {
                                if (e.target.files && e.target.files.length > 0)
                                    handleUploadMultiple(e.target.files);
                            }}
                            data-testid="input-creative-upload"
                        />
                    </label>
                </div>
            </div>

            {selectMode && creatives.length > 0 && (
                <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-muted/50 border">
                    <Checkbox
                        checked={selectedIndices.size === creatives.length}
                        onCheckedChange={toggleSelectAll}
                        data-testid="checkbox-select-all"
                    />
                    <span className="text-sm text-muted-foreground">
                        {selectedIndices.size === 0
                            ? "Select all"
                            : `${selectedIndices.size} of ${creatives.length} selected`}
                    </span>
                </div>
            )}

            {previewCreative && !selectMode && (
                <div className="rounded-xl border bg-card p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="gap-1">
                                {isPreviewVideo ? (
                                    <>
                                        <Video className="w-3 h-3" /> Video
                                    </>
                                ) : (
                                    <>
                                        <ImagePlus className="w-3 h-3" /> Image
                                    </>
                                )}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                                Creative {previewIndex! + 1} of{" "}
                                {creatives.length}
                            </span>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-1"
                                onClick={() =>
                                    handleDownload(
                                        previewCreative,
                                        previewIndex!,
                                    )
                                }
                                data-testid="button-preview-download"
                            >
                                <Download className="w-4 h-4" /> Download
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                className="gap-1"
                                onClick={() => handleRemove(previewIndex!)}
                                data-testid="button-preview-remove"
                            >
                                <Trash2 className="w-4 h-4" /> Remove
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setPreviewIndex(null)}
                                data-testid="button-preview-close"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                    <div className="rounded-lg overflow-hidden border bg-muted/30 flex items-center justify-center">
                        {isPreviewVideo ? (
                            <video
                                src={previewCreative}
                                className="w-full max-h-[500px] object-contain"
                                controls
                                playsInline
                                data-testid="creative-preview-video"
                            />
                        ) : (
                            <img
                                src={previewCreative}
                                alt={`Creative ${previewIndex! + 1}`}
                                className="w-full max-h-[500px] object-contain"
                                data-testid="creative-preview-image"
                            />
                        )}
                    </div>
                </div>
            )}

            {creatives.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[300px] border-2 border-dashed rounded-xl bg-muted/20 text-muted-foreground">
                    <Upload className="w-12 h-12 mb-3 opacity-30" />
                    <p className="text-sm font-medium">
                        No creatives uploaded yet
                    </p>
                    <p className="text-xs mt-1 opacity-70">
                        Use "Add Creatives" or "Import ZIP" to get started
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {creatives.map((path, index) => {
                        const isVideo = isVideoFile(path);
                        const isPreviewing =
                            previewIndex === index && !selectMode;
                        const isChecked = selectedIndices.has(index);
                        return (
                            <div
                                key={`${path}-${index}`}
                                className={`group relative rounded-lg overflow-hidden border-2 cursor-pointer transition-all hover:shadow-md ${
                                    isPreviewing
                                        ? "border-primary ring-2 ring-primary/20"
                                        : isChecked
                                          ? "border-blue-500 ring-2 ring-blue-500/20"
                                          : "border-border hover:border-primary/50"
                                }`}
                                onClick={() => {
                                    if (selectMode) {
                                        toggleSelect(index);
                                    } else {
                                        setPreviewIndex(
                                            isPreviewing ? null : index,
                                        );
                                    }
                                }}
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

                                {selectMode && (
                                    <div className="absolute top-1.5 left-1.5 z-10">
                                        <div
                                            className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${isChecked ? "bg-blue-500 border-blue-500" : "bg-white/90 border-gray-400"}`}
                                        >
                                            {isChecked && (
                                                <svg
                                                    className="w-4 h-4 text-white"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="3"
                                                >
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {!selectMode && (
                                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                        <button
                                            className="w-7 h-7 rounded-full bg-white/90 shadow flex items-center justify-center hover:bg-white"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDownload(path, index);
                                            }}
                                            data-testid={`button-download-creative-${index}`}
                                        >
                                            <Download className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            className="w-7 h-7 rounded-full bg-red-500/90 shadow flex items-center justify-center hover:bg-red-500 text-white"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemove(index);
                                            }}
                                            data-testid={`button-remove-creative-${index}`}
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                )}

                                <div className="absolute bottom-1 left-1">
                                    <Badge
                                        variant="secondary"
                                        className="text-[10px] px-1.5 py-0.5 opacity-80"
                                    >
                                        {isVideo ? "VID" : "IMG"}
                                    </Badge>
                                </div>
                            </div>
                        );
                    })}

                    {!selectMode && (
                        <label
                            className={`cursor-pointer ${uploading ? "pointer-events-none opacity-50" : ""}`}
                        >
                            <div className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                                <Plus className="w-8 h-8" />
                                <span className="text-xs font-medium">
                                    {uploading ? "Uploading..." : "Add More"}
                                </span>
                            </div>
                            <input
                                type="file"
                                accept="image/*,video/*"
                                multiple
                                className="hidden"
                                onChange={(e) => {
                                    if (
                                        e.target.files &&
                                        e.target.files.length > 0
                                    )
                                        handleUploadMultiple(e.target.files);
                                }}
                            />
                        </label>
                    )}
                </div>
            )}
        </div>
    );
}
