import React from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { ArrowLeft, BookOpen, Lightbulb, Calendar, Users, CheckCircle, Info } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';

export default function DocsClassesPage({ onNavigate }) {
  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => onNavigate && onNavigate('classes')}
          className="gap-2 mb-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Classes
        </Button>
        
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
            <BookOpen className="h-8 w-8" />
          </div>
          <div className="flex-1">
            <h1>Classes Documentation</h1>
            <p className="text-muted-foreground mt-2">
              Complete guide to managing classes, availability, and class-related features
            </p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Quick Start */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            Quick Start
          </CardTitle>
          <CardDescription>
            Get started with classes in 3 simple steps
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Badge className="h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0">1</Badge>
            <div>
              <h4>Create a Class</h4>
              <p className="text-muted-foreground text-sm mt-1">
                Click the "+ Add Class" button to create a new class. Enter the class name and a short name (abbreviation).
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Badge className="h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0">2</Badge>
            <div>
              <h4>Set Availability</h4>
              <p className="text-muted-foreground text-sm mt-1">
                Configure which days and periods the class is available for lessons. This controls when lessons can be scheduled.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Badge className="h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0">3</Badge>
            <div>
              <h4>Assign a Teacher (Optional)</h4>
              <p className="text-muted-foreground text-sm mt-1">
                Optionally assign a class teacher to streamline lesson creation and organization.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features Overview */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Class Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-500" />
              Class Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h4>Name</h4>
              <p className="text-sm text-muted-foreground">
                Full name of the class (e.g., "Grade 10 Mathematics Advanced")
              </p>
            </div>
            <Separator />
            <div>
              <h4>Short Name</h4>
              <p className="text-sm text-muted-foreground">
                Abbreviated version for easy reference (e.g., "10-MA")
              </p>
            </div>
            <Separator />
            <div>
              <h4>Teacher of Class</h4>
              <p className="text-sm text-muted-foreground">
                Default teacher assigned to this class. Helps with lesson planning and organization.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Availability */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-500" />
              Availability Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h4>What is Availability?</h4>
              <p className="text-sm text-muted-foreground">
                Availability defines the time slots when lessons can be scheduled for this class.
              </p>
            </div>
            <Separator />
            <div>
              <h4>How to Set It</h4>
              <p className="text-sm text-muted-foreground">
                Click on the periods count to expand the grid. Toggle individual periods or use the quick actions to select all/none.
              </p>
            </div>
            <Separator />
            <div>
              <h4>Apply to Others</h4>
              <p className="text-sm text-muted-foreground">
                After editing availability, you can apply the same settings to multiple classes at once.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-purple-500" />
            Advanced Features
          </CardTitle>
          <CardDescription>
            Power features to boost your productivity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Clone */}
          <div className="border-l-4 border-blue-500 pl-4">
            <h4>Clone Class</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Quickly duplicate an existing class with all its settings. The cloned class will have the same availability and teacher, with "(Copy)" appended to the name.
            </p>
          </div>

          {/* Batch Creation */}
          <div className="border-l-4 border-purple-500 pl-4">
            <h4>Batch Class Creation</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Create multiple classes at once by grade level. Select how many classes you need for each grade, and the system will automatically generate them with sequential naming (A, B, C, etc.).
            </p>
          </div>

          {/* Import/Export */}
          <div className="border-l-4 border-green-500 pl-4">
            <h4>Import/Export</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Export your class list to Excel for sharing or backup. Import classes from a spreadsheet to quickly set up your school's structure.
            </p>
          </div>

          {/* Search & Filter */}
          <div className="border-l-4 border-amber-500 pl-4">
            <h4>Search & Filter</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Use the search box to quickly find classes by name or short name. Perfect for schools with many classes.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tips & Best Practices */}
      <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            Tips & Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-3">
            <span className="text-xl">💡</span>
            <p className="text-sm">
              <strong>Use consistent naming:</strong> Stick to a naming pattern like "Grade-Subject" or "Year-Subject" to keep things organized.
            </p>
          </div>
          <div className="flex gap-3">
            <span className="text-xl">🎯</span>
            <p className="text-sm">
              <strong>Set realistic availability:</strong> Don't forget to exclude break times and lunch periods from class availability.
            </p>
          </div>
          <div className="flex gap-3">
            <span className="text-xl">⚡</span>
            <p className="text-sm">
              <strong>Use batch operations:</strong> For schools with parallel classes, use the batch creation feature to save time.
            </p>
          </div>
          <div className="flex gap-3">
            <span className="text-xl">🔄</span>
            <p className="text-sm">
              <strong>Regular backups:</strong> Export your class list regularly to keep a backup of your school's structure.
            </p>
          </div>
          <div className="flex gap-3">
            <span className="text-xl">👥</span>
            <p className="text-sm">
              <strong>Assign class teachers:</strong> Even if optional, assigning class teachers helps with organization and reporting.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="mb-1">Q: What's the difference between a class and a subject?</h4>
            <p className="text-sm text-muted-foreground pl-4">
              A: A class is a group of students (e.g., "Grade 10A"), while a subject is what's being taught (e.g., "Mathematics"). You assign subjects to classes when creating lessons.
            </p>
          </div>
          <Separator />
          <div>
            <h4 className="mb-1">Q: Can I change availability after creating lessons?</h4>
            <p className="text-sm text-muted-foreground pl-4">
              A: Yes, but be careful! Changing availability won't automatically move existing lessons. You may need to reschedule conflicting lessons manually.
            </p>
          </div>
          <Separator />
          <div>
            <h4 className="mb-1">Q: What happens if I delete a class?</h4>
            <p className="text-sm text-muted-foreground pl-4">
              A: Deleting a class will also remove all associated lessons and timetable entries. Make sure to export a backup before deleting important classes.
            </p>
          </div>
          <Separator />
          <div>
            <h4 className="mb-1">Q: Can different classes have different schedules?</h4>
            <p className="text-sm text-muted-foreground pl-4">
              A: Absolutely! Each class can have its own unique availability pattern to accommodate different schedules.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="flex justify-center pt-4">
        <Button
          onClick={() => onNavigate && onNavigate('classes')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Classes
        </Button>
      </div>
    </div>
  );
}
