
import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface QuestionFiltersProps {
  filters: any;
  onFiltersChange: (filters: any) => void;
}

export function QuestionFilters({ filters, onFiltersChange }: QuestionFiltersProps) {
  const [availableTags, setAvailableTags] = useState([]);

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    const { data } = await supabase
      .from('question_tags')
      .select('*')
      .order('display_name');
    
    setAvailableTags(data || []);
  };

  const updateFilter = (key: string, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const addTagFilter = (tagSlug: string) => {
    if (!filters.tags.includes(tagSlug)) {
      updateFilter('tags', [...filters.tags, tagSlug]);
    }
  };

  const removeTagFilter = (tagSlug: string) => {
    updateFilter('tags', filters.tags.filter(t => t !== tagSlug));
  };

  const clearAllFilters = () => {
    onFiltersChange({
      status: 'active',
      difficulty: '',
      language: '',
      tags: [],
      question_type: ''
    });
  };

  const getTagDisplayName = (slug: string) => {
    const tag = availableTags.find(t => t.slug === slug);
    return tag?.display_name || slug;
  };

  return (
    <div className="p-4 bg-muted/30 rounded-lg space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Filters</h3>
        <Button variant="ghost" size="sm" onClick={clearAllFilters}>
          Clear All
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <Label>Status</Label>
          <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Difficulty</Label>
          <Select value={filters.difficulty} onValueChange={(value) => updateFilter('difficulty', value)}>
            <SelectTrigger>
              <SelectValue placeholder="All levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All</SelectItem>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Question Type</Label>
          <Select value={filters.question_type} onValueChange={(value) => updateFilter('question_type', value)}>
            <SelectTrigger>
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All</SelectItem>
              <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
              <SelectItem value="true_false">True/False</SelectItem>
              <SelectItem value="short_answer">Short Answer</SelectItem>
              <SelectItem value="long_answer">Long Answer</SelectItem>
              <SelectItem value="coding">Coding</SelectItem>
              <SelectItem value="fill_in_blank">Fill in Blank</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Language</Label>
          <Select value={filters.language} onValueChange={(value) => updateFilter('language', value)}>
            <SelectTrigger>
              <SelectValue placeholder="All languages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All</SelectItem>
              <SelectItem value="EN">English</SelectItem>
              <SelectItem value="HI">Hindi</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Tags</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {filters.tags.map(tagSlug => (
            <Badge key={tagSlug} variant="secondary" className="flex items-center gap-1">
              {getTagDisplayName(tagSlug)}
              <button
                onClick={() => removeTagFilter(tagSlug)}
                className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
        
        <Select value="" onValueChange={addTagFilter}>
          <SelectTrigger className="mt-2">
            <SelectValue placeholder="Add tag filter..." />
          </SelectTrigger>
          <SelectContent>
            {availableTags
              .filter(tag => !filters.tags.includes(tag.slug))
              .map(tag => (
                <SelectItem key={tag.slug} value={tag.slug}>
                  {tag.display_name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
