
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Database, User, Calendar, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PlaceholderPanelProps {
  onInsertPlaceholder: (placeholder: string) => void;
}

const getDataSourceIcon = (dataSource: string) => {
  switch (dataSource) {
    case 'admission_dashboard':
      return <Database className="h-3 w-3" />;
    case 'user_input':
      return <User className="h-3 w-3" />;
    case 'system_generated':
      return <Calendar className="h-3 w-3" />;
    default:
      return <FileText className="h-3 w-3" />;
  }
};

const getDataSourceColor = (dataSource: string) => {
  switch (dataSource) {
    case 'admission_dashboard':
      return 'bg-blue-100 text-blue-800';
    case 'user_input':
      return 'bg-green-100 text-green-800';
    case 'system_generated':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const PlaceholderPanel = ({ onInsertPlaceholder }: PlaceholderPanelProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const { data: placeholders, isLoading } = useQuery({
    queryKey: ['offer-placeholders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('offer_placeholders')
        .select('*')
        .eq('is_active', true)
        .order('display_name');
      
      if (error) throw error;
      return data;
    }
  });

  const filteredPlaceholders = placeholders?.filter(placeholder =>
    placeholder.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    placeholder.placeholder_key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    placeholder.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInsertPlaceholder = (placeholderKey: string, displayName: string) => {
    onInsertPlaceholder(placeholderKey);
    toast({
      title: "Placeholder Inserted",
      description: `Added {{${placeholderKey}}} to the template`
    });
  };

  // Group placeholders by data source
  const groupedPlaceholders = filteredPlaceholders?.reduce((acc, placeholder) => {
    const source = placeholder.data_source;
    if (!acc[source]) {
      acc[source] = [];
    }
    acc[source].push(placeholder);
    return acc;
  }, {} as Record<string, typeof placeholders>);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Placeholders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading placeholders...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Insert Placeholders
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search placeholders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 text-sm"
          />
        </div>

        <div className="text-xs text-muted-foreground">
          Click any placeholder below to insert it into your template. Placeholders will be replaced with actual data when sending offers.
        </div>

        <ScrollArea className="h-[400px]">
          <div className="space-y-3">
            {groupedPlaceholders && Object.entries(groupedPlaceholders).map(([dataSource, sourcePlaceholders]) => (
              <div key={dataSource} className="space-y-2">
                <div className="flex items-center gap-2">
                  {getDataSourceIcon(dataSource)}
                  <span className="text-xs font-medium capitalize">
                    {dataSource.replace('_', ' ')}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {sourcePlaceholders?.length}
                  </Badge>
                </div>
                
                <div className="space-y-1 pl-4">
                  {sourcePlaceholders?.map((placeholder) => (
                    <div key={placeholder.id} className="group">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-left h-auto p-2 hover:bg-muted/50"
                        onClick={() => handleInsertPlaceholder(placeholder.placeholder_key, placeholder.display_name)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium truncate">
                              {placeholder.display_name}
                            </span>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getDataSourceColor(placeholder.data_source)}`}
                            >
                              {getDataSourceIcon(placeholder.data_source)}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground font-mono truncate">
                            {`{{${placeholder.placeholder_key}}}`}
                          </div>
                          {placeholder.description && (
                            <div className="text-xs text-muted-foreground mt-1 leading-tight">
                              {placeholder.description}
                            </div>
                          )}
                        </div>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="pt-2 border-t">
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="font-medium">Tip:</div>
            <div>• Placeholders appear as {"{{PLACEHOLDER_NAME}}"}</div>
            <div>• They'll be replaced with real data when sending</div>
            <div>• You can also type placeholders manually</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
