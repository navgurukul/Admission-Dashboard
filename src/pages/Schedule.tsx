
import { useState, useEffect } from "react";
import { AdmissionsSidebar } from "@/components/AdmissionsSidebar";
import { Calendar, Clock, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddSlotsModal } from "@/components/AddSlotsModal";
import { supabase } from "@/integrations/supabase/client";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { useToast } from "@/components/ui/use-toast";

type ScheduleData = {
  id: string;
  name: string | null;
  unique_number: string | null;
  date_of_testing: string | null;
  lr_status: string | null;
  cfr_status: string | null;
  lr_comments: string | null;
};

const Schedule = () => {
  const [scheduleData, setScheduleData] = useState<ScheduleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddSlotsModalOpen, setIsAddSlotsModalOpen] = useState(false);
  const { toast } = useToast();
  const { user: googleUser } = useGoogleAuth();

  useEffect(() => {
    fetchScheduleData();
  }, []);

  const fetchScheduleData = async () => {
    try {
      setLoading(true);
      
      if (!googleUser) {
        setScheduleData([]);
        return;
      }

      // Fetch scheduled interviews (applicants with testing dates)
      const { data, error } = await supabase
        .from('admission_dashboard')
        .select('id, name, unique_number, date_of_testing, lr_status, cfr_status, lr_comments')
        .not('date_of_testing', 'is', null)
        .order('date_of_testing', { ascending: true });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log(`Successfully fetched ${data?.length || 0} scheduled interviews`);
      setScheduleData(data || []);
    } catch (error) {
      console.error('Error fetching schedule data:', error);
      toast({
        title: "Error",
        description: "Failed to load schedule data",
        variant: "destructive",
      });
      setScheduleData([]);
    } finally {
      setLoading(false);
    }
  };

  const todaySchedule = scheduleData.filter(item => {
    if (!item.date_of_testing) return false;
    const testDate = new Date(item.date_of_testing);
    const today = new Date();
    return testDate.toDateString() === today.toDateString();
  });

  const upcomingSchedule = scheduleData.filter(item => {
    if (!item.date_of_testing) return false;
    const testDate = new Date(item.date_of_testing);
    const today = new Date();
    return testDate > today;
  });

  // Separate available slots from actual applicant interviews
  const availableSlots = todaySchedule.filter(item => 
    item.name === 'Interview Slot' && item.lr_status?.includes('Available Slot')
  );

  const actualInterviews = todaySchedule.filter(item => 
    item.name !== 'Interview Slot' || !item.lr_status?.includes('Available Slot')
  );

  return (
    <div className="min-h-screen bg-background">
      <AdmissionsSidebar />
      
      <main className="md:ml-64 overflow-auto h-screen">
        <div className="p-4 md:p-8 pt-16 md:pt-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Interview Schedule
            </h1>
            <p className="text-muted-foreground">
              Manage interview slots and availability
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-card rounded-xl p-6 shadow-soft border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Today's Interviews</p>
                  <p className="text-2xl font-bold text-foreground">{actualInterviews.length}</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-soft border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Available Slots</p>
                  <p className="text-2xl font-bold text-foreground">{availableSlots.length}</p>
                </div>
                <div className="w-12 h-12 bg-status-pending/10 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-status-pending" />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-soft border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Scheduled</p>
                  <p className="text-2xl font-bold text-foreground">{scheduleData.length}</p>
                </div>
                <div className="w-12 h-12 bg-status-active/10 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-status-active" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl shadow-soft border border-border">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">Today's Schedule</h2>
                <Button 
                  className="bg-gradient-primary hover:bg-primary/90 text-white"
                  onClick={() => setIsAddSlotsModalOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Slots
                </Button>
              </div>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="text-center text-muted-foreground">Loading schedule...</div>
              ) : (
                <div className="space-y-6">
                  {/* Available Slots Section */}
                  {availableSlots.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-foreground mb-3">Available Slots</h3>
                      <div className="space-y-3">
                        {availableSlots.map((slot) => (
                          <div key={slot.id} className="border border-status-pending/20 bg-status-pending/5 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-status-pending/10 rounded-full flex items-center justify-center">
                                  <Clock className="w-4 h-4 text-status-pending" />
                                </div>
                                <div>
                                  <p className="font-medium text-foreground">
                                    {slot.lr_status?.replace('Available Slot: ', '')}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {slot.lr_comments || 'No interviewer assigned'}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-status-pending font-medium">Available</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actual Interviews Section */}
                  {actualInterviews.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-foreground mb-3">Scheduled Interviews</h3>
                      <div className="space-y-3">
                        {actualInterviews.map((item) => (
                          <div key={item.id} className="border border-border rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                  <span className="text-primary text-sm font-medium">
                                    {item.name ? item.name.split(' ').map(n => n[0]).join('') : 'N/A'}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium text-foreground">{item.name || 'N/A'}</p>
                                  <p className="text-sm text-muted-foreground">{item.unique_number || 'No ID'}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-foreground">
                                  {item.date_of_testing ? new Date(item.date_of_testing).toLocaleDateString() : 'No date'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {item.lr_status || item.cfr_status || 'Status pending'}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty State */}
                  {actualInterviews.length === 0 && availableSlots.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                      <p className="text-lg mb-2">No interviews or slots scheduled for today</p>
                      <p className="text-sm">Click "Add Slots" to create available interview slots</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <AddSlotsModal
        isOpen={isAddSlotsModalOpen}
        onClose={() => setIsAddSlotsModalOpen(false)}
        onSuccess={fetchScheduleData}
      />
    </div>
  );
};

export default Schedule;
