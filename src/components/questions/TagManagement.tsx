
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Tag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export function TagManagement() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTag, setEditingTag] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(null);
  const [formData, setFormData] = useState({
    slug: '',
    display_name: '',
    description: ''
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('question_tags')
        .select('*')
        .order('display_name');

      if (error) throw error;

      setTags(data || []);
    } catch (error) {
      console.error('Error fetching tags:', error);
      toast({
        title: "Error",
        description: "Failed to fetch tags",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (displayName) => {
    return displayName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  };

  const handleCreateTag = async () => {
    try {
      const slug = generateSlug(formData.display_name);
      
      const { error } = await supabase
        .from('question_tags')
        .insert([{
          slug,
          display_name: formData.display_name,
          description: formData.description || null
        }]);

      if (error) throw error;

      toast({
        title: "Tag Created",
        description: "The tag has been created successfully"
      });

      setShowCreateDialog(false);
      setFormData({ slug: '', display_name: '', description: '' });
      fetchTags();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to create tag",
        variant: "destructive"
      });
    }
  };

  const handleEditTag = async () => {
    try {
      const { error } = await supabase
        .from('question_tags')
        .update({
          display_name: formData.display_name,
          description: formData.description || null
        })
        .eq('id', editingTag.id);

      if (error) throw error;

      toast({
        title: "Tag Updated",
        description: "The tag has been updated successfully"
      });

      setEditingTag(null);
      setFormData({ slug: '', display_name: '', description: '' });
      fetchTags();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to update tag",
        variant: "destructive"
      });
    }
  };

  const handleDeleteTag = async (tagId) => {
    try {
      // Check if tag is used in any questions
      const { data: questionsWithTag } = await supabase
        .from('questions')
        .select('id')
        .contains('tags', [tags.find(t => t.id === tagId)?.slug]);

      if (questionsWithTag && questionsWithTag.length > 0) {
        toast({
          title: "Cannot Delete Tag",
          description: `This tag is used in ${questionsWithTag.length} question(s). Remove it from all questions first.`,
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('question_tags')
        .delete()
        .eq('id', tagId);

      if (error) throw error;

      toast({
        title: "Tag Deleted",
        description: "The tag has been deleted successfully"
      });

      setShowDeleteDialog(null);
      fetchTags();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete tag",
        variant: "destructive"
      });
    }
  };

  const openEditDialog = (tag) => {
    setEditingTag(tag);
    setFormData({
      slug: tag.slug,
      display_name: tag.display_name,
      description: tag.description || ''
    });
  };

  const openCreateDialog = () => {
    setShowCreateDialog(true);
    setFormData({ slug: '', display_name: '', description: '' });
  };

  if (loading) {
    return <div>Loading tags...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Question Tags</h3>
          <p className="text-sm text-muted-foreground">
            Manage topic tags used to categorize questions
          </p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Create Tag
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Tag</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="display_name">Display Name *</Label>
                <Input
                  id="display_name"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  placeholder="e.g., HTML Basics"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this topic..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTag} disabled={!formData.display_name.trim()}>
                  Create Tag
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tags.map((tag) => (
          <Card key={tag.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{tag.display_name}</h4>
                  <p className="text-xs text-muted-foreground">
                    slug: {tag.slug}
                  </p>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(tag)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDeleteDialog(tag)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {tag.description && (
                <p className="text-sm text-muted-foreground mb-2">
                  {tag.description}
                </p>
              )}
              
              <p className="text-xs text-muted-foreground">
                Created: {format(new Date(tag.created_at), 'MMM dd, yyyy')}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingTag} onOpenChange={() => setEditingTag(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tag</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit_display_name">Display Name *</Label>
              <Input
                id="edit_display_name"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit_description">Description</Label>
              <Textarea
                id="edit_description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingTag(null)}>
                Cancel
              </Button>
              <Button onClick={handleEditTag} disabled={!formData.display_name.trim()}>
                Update Tag
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!showDeleteDialog} onOpenChange={() => setShowDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tag</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the tag "{showDeleteDialog?.display_name}"? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => handleDeleteTag(showDeleteDialog.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {tags.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Tag className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No tags created yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create your first tag to start organizing questions
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
