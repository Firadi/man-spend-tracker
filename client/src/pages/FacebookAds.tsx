import { useState, useMemo } from "react";
import { useStore, FBAdRow, SelectedAdSet } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Facebook, X, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function FacebookAds() {
  const { fbConnected, setFBConnected, fbAdsTable, tempSelectedAdSets, setTempSelectedAdSets } = useStore();
  const { toast } = useToast();
  
  // Local state for filters
  const [searchQuery, setSearchQuery] = useState("");
  const [campaignFilter, setCampaignFilter] = useState("all");
  const [adSetFilter, setAdSetFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Selection state (local to page until saved, but initializing from store)
  // Spec says: "Selection state must stay consistent across filtered views"
  // We can track selection by AdSet ID
  const [selectedAdSetIds, setSelectedAdSetIds] = useState<Set<string>>(
    new Set(tempSelectedAdSets.map(s => s.adSetId))
  );

  // Derived Data: Unique options for filters
  const campaigns = useMemo(() => Array.from(new Set(fbAdsTable.map(row => row.campaignName))), [fbAdsTable]);
  const adSets = useMemo(() => Array.from(new Set(fbAdsTable.map(row => row.adSetName))), [fbAdsTable]);

  // Filtered Data
  const filteredRows = useMemo(() => {
    return fbAdsTable.filter(row => {
      // Search
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        row.campaignName.toLowerCase().includes(searchLower) ||
        row.adSetName.toLowerCase().includes(searchLower) ||
        row.adName.toLowerCase().includes(searchLower);

      // Filters
      const matchesCampaign = campaignFilter === "all" || row.campaignName === campaignFilter;
      const matchesAdSet = adSetFilter === "all" || row.adSetName === adSetFilter;
      const matchesStatus = statusFilter === "all" || row.status === statusFilter;

      return matchesSearch && matchesCampaign && matchesAdSet && matchesStatus;
    });
  }, [fbAdsTable, searchQuery, campaignFilter, adSetFilter, statusFilter]);

  // Selection Handlers
  const toggleAdSetSelection = (adSetId: string, campaignId: string, campaignName: string, adSetName: string) => {
    const newSelection = new Set(selectedAdSetIds);
    if (newSelection.has(adSetId)) {
      newSelection.delete(adSetId);
    } else {
      newSelection.add(adSetId);
    }
    setSelectedAdSetIds(newSelection);
  };

  const handleClearSelection = () => {
    setSelectedAdSetIds(new Set());
  };

  const handleSaveSelection = () => {
    // Convert selected IDs back to SelectedAdSet objects
    // We need to find the metadata for each selected ID. 
    // We can look it up in the full table.
    const selectionList: SelectedAdSet[] = [];
    const processedIds = new Set<string>();

    fbAdsTable.forEach(row => {
      if (selectedAdSetIds.has(row.adSetId) && !processedIds.has(row.adSetId)) {
        selectionList.push({
          adSetId: row.adSetId,
          adSetName: row.adSetName,
          campaignId: row.campaignId,
          campaignName: row.campaignName
        });
        processedIds.add(row.adSetId);
      }
    });

    setTempSelectedAdSets(selectionList);
    toast({
      title: "Selection Saved",
      description: `${selectionList.length} Ad Sets saved for analysis.`,
    });
  };

  const selectedCount = selectedAdSetIds.size;

  return (
    <div className="space-y-6 pb-20"> {/* pb-20 for sticky bar space */}
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">Facebook Ads</h2>
        <p className="text-muted-foreground">Select Ad Sets to analyze their performance.</p>
      </div>

      {/* 1. Connection Section */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Facebook className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <CardTitle>Connection Status</CardTitle>
                <CardDescription>
                  {fbConnected 
                    ? "Your Facebook Ads account is connected and ready." 
                    : "Connect your Facebook Ads account to import data."}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant={fbConnected ? "default" : "destructive"} className="text-sm px-3 py-1">
                {fbConnected ? "Connected" : "Not Connected"}
              </Badge>
              <Button 
                variant={fbConnected ? "outline" : "default"}
                onClick={() => setFBConnected(!fbConnected)}
              >
                {fbConnected ? "Disconnect" : "Connect Facebook Ads"}
              </Button>
            </div>
          </div>
        </CardHeader>
        {fbConnected && (
          <CardContent>
            <div className="w-full max-w-sm">
              <label className="text-sm font-medium mb-1.5 block">Ad Account</label>
              <Select defaultValue="act_123456789">
                <SelectTrigger>
                  <SelectValue placeholder="Select Ad Account" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="act_123456789">My Store Account (act_123456789)</SelectItem>
                  <SelectItem value="act_987654321">Testing Account (act_987654321)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        )}
      </Card>

      {/* 2. Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-end md:items-center bg-card p-4 rounded-lg border shadow-sm">
        <div className="w-full md:w-1/3 space-y-1.5">
          <label className="text-sm font-medium">Search</label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search campaigns, ad sets, ads..." 
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="w-full md:w-1/4 space-y-1.5">
          <label className="text-sm font-medium">Campaign</label>
          <Select value={campaignFilter} onValueChange={setCampaignFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Campaigns" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Campaigns</SelectItem>
              {campaigns.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-full md:w-1/4 space-y-1.5">
          <label className="text-sm font-medium">Ad Set</label>
          <Select value={adSetFilter} onValueChange={setAdSetFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Ad Sets" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ad Sets</SelectItem>
              {adSets.map(a => (
                <SelectItem key={a} value={a}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-full md:w-1/6 space-y-1.5">
          <label className="text-sm font-medium">Status</label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Paused">Paused</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 3. Main Table */}
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Campaign</TableHead>
              <TableHead>Ad Set</TableHead>
              <TableHead>Ad</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No ads found matching your filters.
                </TableCell>
              </TableRow>
            ) : (
              filteredRows.map((row) => {
                const isSelected = selectedAdSetIds.has(row.adSetId);
                return (
                  <TableRow key={`${row.adSetId}-${row.adId}`} className={isSelected ? "bg-muted/50" : ""}>
                    <TableCell>
                      <Checkbox 
                        checked={isSelected}
                        onCheckedChange={() => toggleAdSetSelection(row.adSetId, row.campaignId, row.campaignName, row.adSetName)}
                        aria-label="Select row"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{row.campaignName}</TableCell>
                    <TableCell>{row.adSetName}</TableCell>
                    <TableCell className="text-muted-foreground">{row.adName}</TableCell>
                    <TableCell>
                      <Badge variant={row.status === 'Active' ? 'default' : 'secondary'} className={row.status === 'Active' ? "bg-green-100 text-green-800 hover:bg-green-100" : "bg-red-100 text-red-800 hover:bg-red-100"}>
                        {row.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* 4. Bulk Selection Bar */}
      {selectedCount > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-[90%] md:w-[600px] bg-foreground text-background rounded-full shadow-xl p-2 px-6 flex items-center justify-between z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
          <span className="font-medium text-sm">
            {selectedCount} Ad Set{selectedCount !== 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-background hover:text-background/80 hover:bg-white/10 h-8"
              onClick={handleClearSelection}
            >
              <X className="w-4 h-4 mr-2" />
              Clear
            </Button>
            <Button 
              size="sm" 
              className="bg-white text-black hover:bg-white/90 h-8 rounded-full px-4"
              onClick={handleSaveSelection}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Selection
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
