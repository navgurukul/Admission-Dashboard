import { AdmissionsSidebar } from "@/components/AdmissionsSidebar";
import { Calendar, Clock, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const mockSchedule = [
  {
    time: "09:00 AM",
    slots: [
      { interviewer: "Dr. Sarah Johnson", applicant: "Priya Sharma", type: "Learning Round" },
      { interviewer: "Prof. Michael Chen", applicant: null, type: "Available" }
    ]
  },
  {
    time: "10:00 AM",
    slots: [
      { interviewer: "Dr. Sarah Johnson", applicant: null, type: "Available" },
      { interviewer: "Prof. Michael Chen", applicant: "Rajesh Kumar", type: "Cultural Fit" }
    ]
  },
  {
    time: "11:00 AM",
    slots: [
      { interviewer: "Dr. Sarah Johnson", applicant: "Anjali Patel", type: "Learning Round" },
      { interviewer: "Prof. Michael Chen", applicant: null, type: "Available" }
    ]
  },
  {
    time: "02:00 PM",
    slots: [
      { interviewer: "Dr. Sarah Johnson", applicant: null, type: "Available" },
      { interviewer: "Prof. Michael Chen", applicant: "Vikram Singh", type: "Cultural Fit" }
    ]
  }
];

const Schedule = () => {
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
                  <p className="text-2xl font-bold text-foreground">6</p>
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
                  <p className="text-2xl font-bold text-foreground">4</p>
                </div>
                <div className="w-12 h-12 bg-status-pending/10 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-status-pending" />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-soft border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Active Interviewers</p>
                  <p className="text-2xl font-bold text-foreground">2</p>
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
              <div className="space-y-4">
                {mockSchedule.map((timeSlot, index) => (
                  <div key={index} className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-5 h-5 text-muted-foreground" />
                        <span className="font-medium text-foreground">{timeSlot.time}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {timeSlot.slots.map((slot, slotIndex) => (
                        <div 
                          key={slotIndex}
                          className={`p-3 rounded-lg border-2 border-dashed ${
                            slot.applicant 
                              ? 'border-status-active bg-status-active/5' 
                              : 'border-muted bg-muted/30'
                          }`}
                        >
                          <p className="font-medium text-foreground text-sm mb-1">{slot.interviewer}</p>
                          {slot.applicant ? (
                            <div>
                              <p className="text-sm text-foreground">{slot.applicant}</p>
                              <p className="text-xs text-muted-foreground">{slot.type}</p>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">Available for booking</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Schedule;