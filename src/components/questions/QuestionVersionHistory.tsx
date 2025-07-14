
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { History, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface QuestionVersionHistoryProps {
  questionId: string;
}

export function QuestionVersionHistory({ questionId }: QuestionVersionHistoryProps) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState(null);

  useEffect(() => {
    fetchVersionHistory();
  }, [questionId]);

  const fetchVersionHistory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('question_versions')
        .select(`
          *,
          profiles:edited_by(display_name)
        `)
        .eq('question_id', questionId)
        .order('version_number', { ascending: false });

      if (error) throw error;

      setVersions(data || []);
    } catch (error) {
      console.error('Error fetching version history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading version history...</div>;
  }

  if (versions.length === 0) {
    return (
      <div className="text-center py-8">
        <History className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-muted-foreground">No version history available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Version List */}
        <div className="space-y-3">
          <h3 className="font-medium">Version History</h3>
          {versions.map((version) => (
            <Card 
              key={version.id}
              className={`cursor-pointer transition-colors ${
                selectedVersion?.id === version.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedVersion(version)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">
                        Version {version.version_number}
                      </Badge>
                      <Badge className="bg-blue-100 text-blue-800">
                        {version.question_type.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(version.edited_at), 'MMM dd, yyyy HH:mm')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      by {version.profiles?.display_name || 'Unknown User'}
                    </p>
                    {version.change_summary && (
                      <p className="text-sm mt-2">{version.change_summary}</p>
                    )}
                  </div>
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Version Details */}
        <div>
          {selectedVersion && (
            <Card>
              <CardHeader>
                <CardTitle>
                  Version {selectedVersion.version_number} Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Question Text</h4>
                  <div 
                    className="prose prose-sm max-w-none p-3 bg-muted/30 rounded-lg"
                    dangerouslySetInnerHTML={{ __html: selectedVersion.question_text }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-1">Type</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedVersion.question_type.replace('_', ' ')}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Difficulty</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedVersion.difficulty_level}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Points</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedVersion.points}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Language</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedVersion.language}
                    </p>
                  </div>
                </div>

                {selectedVersion.options && (
                  <div>
                    <h4 className="font-medium mb-2">Options</h4>
                    <div className="space-y-2">
                      {selectedVersion.options.map((option, index) => (
                        <div 
                          key={option.id} 
                          className={`p-2 rounded text-sm ${
                            selectedVersion.correct_answer === option.id 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-muted/30'
                          }`}
                        >
                          {option.text}
                          {selectedVersion.correct_answer === option.id && (
                            <Badge variant="outline" className="ml-2">Correct</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedVersion.tags && selectedVersion.tags.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedVersion.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedVersion.explanation && (
                  <div>
                    <h4 className="font-medium mb-2">Explanation</h4>
                    <p className="text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg">
                      {selectedVersion.explanation}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
