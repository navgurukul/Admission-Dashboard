import { TrendingUp, Users, Clock, CheckCircle } from "lucide-react";

const stats = [
  {
    title: "Total Applicants",
    value: "2,847",
    change: "+12%",
    changeType: "increase" as const,
    icon: Users,
    color: "text-primary",
    bgColor: "bg-primary/10"
  },
  {
    title: "Active Applications", 
    value: "1,245",
    change: "+8%",
    changeType: "increase" as const,
    icon: Clock,
    color: "text-status-pending",
    bgColor: "bg-status-pending/10"
  },
  {
    title: "Interviews Scheduled",
    value: "156",
    change: "+24%", 
    changeType: "increase" as const,
    icon: TrendingUp,
    color: "text-status-prospect",
    bgColor: "bg-status-prospect/10"
  },
  {
    title: "Successfully Onboarded",
    value: "89",
    change: "+16%",
    changeType: "increase" as const,
    icon: CheckCircle,
    color: "text-status-active",
    bgColor: "bg-status-active/10"
  }
];

export function DashboardStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <div key={stat.title} className="bg-card rounded-xl p-6 shadow-soft border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                {stat.title}
              </p>
              <p className="text-2xl font-bold text-foreground">
                {stat.value}
              </p>
              <div className="flex items-center mt-2">
                <span className={`text-xs font-medium ${
                  stat.changeType === 'increase' ? 'text-status-active' : 'text-status-fail'
                }`}>
                  {stat.change}
                </span>
                <span className="text-xs text-muted-foreground ml-1">
                  from last month
                </span>
              </div>
            </div>
            <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}