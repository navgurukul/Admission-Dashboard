
import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Check, Plus, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface TagSelectorProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
}

export function TagSelector({ selectedTags, onTagsChange }: TagSelectorProps) {
  const [availableTags, setAvailableTags] = useState([]);
  const [open, setOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');

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

  const createNewTag = async () => {
    if (!newTagName.trim()) return;
    
    const slug = newTagName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    const { data, error } = await supabase
      .from('question_tags')
      .insert([{
        slug,
        display_name: newTagName.trim()
      }])
      .select()
      .single();

    if (!error && data) {
      setAvailableTags([...availableTags, data]);
      onTagsChange([...selectedTags, data.slug]);
      setNewTagName('');
      setOpen(false);
    }
  };

  const toggleTag = (tagSlug: string) => {
    if (selectedTags.includes(tagSlug)) {
      onTagsChange(selectedTags.filter(t => t !== tagSlug));
    } else {
      onTagsChange([...selectedTags, tagSlug]);
    }
  };

  const removeTag = (tagSlug: string) => {
    onTagsChange(selectedTags.filter(t => t !== tagSlug));
  };

  const getTagDisplayName = (slug: string) => {
    const tag = availableTags.find(t => t.slug === slug);
    return tag?.display_name || slug;
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {selectedTags.map(tagSlug => (
          <Badge key={tagSlug} variant="secondary" className="flex items-center gap-1">
            {getTagDisplayName(tagSlug)}
            <button
              type="button"
              onClick={() => removeTag(tagSlug)}
              className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8">
            <Plus className="w-4 h-4 mr-1" />
            Add Tag
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start">
          <Command>
            <CommandInput placeholder="Search tags..." />
            <CommandEmpty>
              <div className="p-2">
                <Input
                  placeholder="Create new tag..."
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      createNewTag();
                    }
                  }}
                />
                <Button
                  size="sm"
                  onClick={createNewTag}
                  className="w-full mt-2"
                  disabled={!newTagName.trim()}
                >
                  Create "{newTagName}"
                </Button>
              </div>
            </CommandEmpty>
            <CommandGroup>
              {availableTags.map((tag) => (
                <CommandItem
                  key={tag.slug}
                  onSelect={() => toggleTag(tag.slug)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedTags.includes(tag.slug) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {tag.display_name}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
