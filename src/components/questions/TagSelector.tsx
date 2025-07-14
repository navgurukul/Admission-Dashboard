
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { X, Plus, Tag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TagSelectorProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
}

export function TagSelector({ selectedTags = [], onTagsChange }: TagSelectorProps) {
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [loading, setLoading] = useState(false);

  // Ensure selectedTags is always an array
  const safeTags = Array.isArray(selectedTags) ? selectedTags : [];

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('question_tags')
        .select('slug, display_name')
        .order('display_name');

      if (error) throw error;

      const tagSlugs = data?.map(tag => tag.slug) || [];
      setAvailableTags(tagSlugs);
    } catch (error) {
      console.error('Error fetching tags:', error);
      setAvailableTags([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTagSelect = (tagSlug: string) => {
    if (!safeTags.includes(tagSlug)) {
      onTagsChange([...safeTags, tagSlug]);
    }
    setOpen(false);
  };

  const handleTagRemove = (tagSlug: string) => {
    onTagsChange(safeTags.filter(tag => tag !== tagSlug));
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    try {
      const slug = newTagName.toLowerCase().replace(/\s+/g, '-');
      
      const { error } = await supabase
        .from('question_tags')
        .insert([{
          slug,
          display_name: newTagName.trim()
        }]);

      if (error) throw error;

      setAvailableTags(prev => [...prev, slug]);
      handleTagSelect(slug);
      setNewTagName('');
    } catch (error) {
      console.error('Error creating tag:', error);
    }
  };

  const filteredTags = availableTags.filter(tag => 
    !safeTags.includes(tag)
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {safeTags.map((tag) => (
          <Badge key={tag} variant="secondary" className="flex items-center gap-1">
            <Tag className="w-3 h-3" />
            {tag}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-auto p-0 w-4 h-4 hover:bg-transparent"
              onClick={() => handleTagRemove(tag)}
            >
              <X className="w-3 h-3" />
            </Button>
          </Badge>
        ))}
      </div>

      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Tag
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            <Command>
              <CommandInput placeholder="Search tags..." />
              <CommandList>
                <CommandEmpty>No tags found.</CommandEmpty>
                <CommandGroup>
                  {filteredTags.map((tag) => (
                    <CommandItem
                      key={tag}
                      value={tag}
                      onSelect={() => handleTagSelect(tag)}
                    >
                      <Tag className="w-4 h-4 mr-2" />
                      {tag}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
            
            <div className="p-3 border-t">
              <div className="flex gap-2">
                <Input
                  placeholder="New tag name"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCreateTag();
                    }
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCreateTag}
                  disabled={!newTagName.trim()}
                >
                  Create
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
