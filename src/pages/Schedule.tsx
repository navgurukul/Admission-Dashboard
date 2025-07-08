
import { useState, useEffect } from "react";
import { AdmissionsSidebar } from "@/components/AdmissionsSidebar";
import { Calendar, Clock, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

type ScheduleData = {
  name: string | null;
  unique_number: string | null;
  date_of_testing: string | null;
  lr_status: string | null;
  cfr_status: string | null;
};

const Schedule = () => {
  const [scheduleData, setScheduleData] = useState<ScheduleData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchScheduleData();
  }, []);

  const fetchScheduleData = async () => {
    try {
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setScheduleData([]);
        return;
      }

      // Fetch scheduled interviews (applicants with testing dates)
      const { data, error } = await supabase
        .from('admission_dashboard')
        .select('name, unique_number, date_of_testing, lr_status, cfr_status')
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

  return (
    <div className="min-h-screen bg-background">
      <AdmissionsSidebar />
      
      <main className="ml-64 overflow-auto h-screen">
        <div className="p-8">
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
                  <p className="text-2xl font-bold text-foreground">{todaySchedule.length}</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-soft border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Upcoming</p>
                  <p className="text-2xl font-bold text-foreground">{upcomingSchedule.length}</p>
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
                <Button className="bg-gradient-primary hover:bg-primary/90 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Time Slot
                </Button>
              </div>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="text-center text-muted-foreground">Loading schedule...</div>
              ) : todaySchedule.length === 0 ? (
                <div className="text-center text-muted-foreground">No interviews scheduled for today</div>
              ) : (
                <div className="space-y-4">
                  {todaySchedule.map((item, index) => (
                    <div key={index} className="border border-border rounded-lg p-4">
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
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Schedule;
