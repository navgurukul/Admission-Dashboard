
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";

interface PlaceholderPanelProps {
  onInsertPlaceholder: (placeholder: string) => void;
}

export const PlaceholderPanel = ({ onInsertPlaceholder }: PlaceholderPanelProps) => {
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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading placeholders...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle className="text-lg">Available Placeholders</CardTitle>
        <p className="text-sm text-muted-foreground">
          Click to insert into your template
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {placeholders?.map((placeholder) => (
            <div
              key={placeholder.id}
              className="p-2 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => onInsertPlaceholder(placeholder.placeholder_key)}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm">{placeholder.display_name}</span>
                <Badge variant="outline" className="text-xs">
                  {placeholder.placeholder_key}
                </Badge>
              </div>
              {placeholder.description && (
                <p className="text-xs text-muted-foreground">
                  {placeholder.description}
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
