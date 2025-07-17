import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, BookOpen, Calendar, FileText } from "lucide-react";

const Students = () => {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <User className="w-7 h-7 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold">Student Portal</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Welcome to the Navgurukul Student Portal
          </p>
        </div>

        {/* Main Content */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Application Status Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">Application Status</CardTitle>
              </div>
              <CardDescription>
                Check the status of your admission application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                View Status
              </Button>
            </CardContent>
          </Card>

          {/* Course Information Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">Course Information</CardTitle>
              </div>
              <CardDescription>
                Learn about our programs and curriculum
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                Explore Courses
              </Button>
            </CardContent>
          </Card>

          {/* Schedule Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">Important Dates</CardTitle>
              </div>
              <CardDescription>
                View important deadlines and events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                View Calendar
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Information Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>About Navgurukul</CardTitle>
            <CardDescription>
              Empowering students through technology education
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Navgurukul is a non-profit organization that provides free residential 
                coding education to students from underserved communities. Our mission 
                is to bridge the digital divide and create opportunities for all.
              </p>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="font-semibold text-primary">Free Education</div>
                  <div className="text-muted-foreground">No cost for students</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="font-semibold text-primary">Residential Program</div>
                  <div className="text-muted-foreground">Live and learn together</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="font-semibold text-primary">Job Ready</div>
                  <div className="text-muted-foreground">Industry-focused curriculum</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Students; 