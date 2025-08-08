
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Send, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ApplicantCommentsModalProps {
  applicantId: string;
  applicantName: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ApplicantCommentsModal = ({ 
  applicantId, 
  applicantName, 
  isOpen, 
  onClose 
}: ApplicantCommentsModalProps) => {
  const [newComment, setNewComment] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user: googleUser } = useGoogleAuth();

  useEffect(() => {
    const getCurrentUser = async () => {
      if (googleUser) {
        setCurrentUser({
          id: googleUser.id,
          name: googleUser.name || googleUser.email || 'Unknown User'
        });
      }
    };
    getCurrentUser();
  }, [googleUser]);

  const { data: comments, refetch } = useQuery({
    queryKey: ['applicant-comments', applicantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('applicant_comments')
        .select('*')
        .eq('applicant_id', applicantId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: isOpen
  });

  const addCommentMutation = useMutation({
    mutationFn: async (commentText: string) => {
      if (!currentUser) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('applicant_comments')
        .insert({
          applicant_id: applicantId,
          user_id: currentUser.id,
          user_name: currentUser.name,
          comment_text: commentText
        });
      
      if (error) throw error;

      // Add to system logs
      await supabase
        .from('system_logs')
        .insert({
          user_id: currentUser.id,
          user_name: currentUser.name,
          action_type: 'comment_added',
          entity_type: 'applicant',
          entity_id: applicantId,
          description: `Added comment to applicant ${applicantName}`,
          metadata: { comment_text: commentText }
        });
    },
    onSuccess: () => {
      toast({
        title: "Comment Added",
        description: "Your comment has been successfully added"
      });
      setNewComment("");
      refetch();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive"
      });
    }
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from('applicant_comments')
        .delete()
        .eq('id', commentId);
      
      if (error) throw error;

      // Add to system logs
      if (currentUser) {
        await supabase
          .from('system_logs')
          .insert({
            user_id: currentUser.id,
            user_name: currentUser.name,
            action_type: 'comment_deleted',
            entity_type: 'applicant',
            entity_id: applicantId,
            description: `Deleted comment from applicant ${applicantName}`
          });
      }
    },
    onSuccess: () => {
      toast({
        title: "Comment Deleted",
        description: "Comment has been successfully deleted"
      });
      refetch();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete comment",
        variant: "destructive"
      });
    }
  });

  const handleAddComment = () => {
    if (newComment.trim() && currentUser) {
      addCommentMutation.mutate(newComment.trim());
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Comments for {applicantName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto space-y-4">
          {comments?.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No comments yet. Be the first to add one!
            </div>
          ) : (
            comments?.map((comment) => (
              <Card key={comment.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {comment.user_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{comment.user_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(comment.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {currentUser?.id === comment.user_id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteCommentMutation.mutate(comment.id)}
                        disabled={deleteCommentMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{comment.comment_text}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="border-t pt-4 space-y-4">
          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[80px]"
          />
          <div className="flex justify-end">
            <Button 
              onClick={handleAddComment}
              disabled={!newComment.trim() || addCommentMutation.isPending}
            >
              <Send className="h-4 w-4 mr-2" />
              {addCommentMutation.isPending ? 'Adding...' : 'Add Comment'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
