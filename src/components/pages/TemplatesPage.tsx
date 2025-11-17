import React, { useState } from 'react';
import { useTranslation } from '@/i18n/index';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Textarea } from '../ui/textarea';
import { Plus, Pencil, Trash2, Copy, Upload, Download } from 'lucide-react';
import { Badge } from '../ui/badge';
import { toast } from 'sonner@2.0.3';

export default function TemplatesPage() {
  const { t } = useTranslation();
  const [templates, setTemplates] = useState([
    {
      id: 1,
      class: '10-MA',
      subject: 'Mathematics',
      availability: {
        monday: [1, 2, 3, 4],
        tuesday: [1, 2, 3, 4],
        wednesday: [1, 2, 3, 4],
        thursday: [1, 2, 3, 4],
        friday: [1, 2, 3, 4],
      },
    },
    {
      id: 2,
      class: '10-MB',
      subject: 'English',
      availability: {
        monday: [2, 3, 4, 5],
        tuesday: [2, 3, 4, 5],
        wednesday: [2, 3, 4, 5],
        thursday: [2, 3, 4, 5],
        friday: [2, 3, 4, 5],
      },
    },
    {
      id: 3,
      class: '9-A',
      subject: 'Science',
      availability: {
        monday: [1, 2, 3, 4, 5, 6],
        tuesday: [1, 2, 3, 4, 5, 6],
        wednesday: [1, 2, 3, 4, 5, 6],
        thursday: [1, 2, 3, 4, 5, 6],
        friday: [1, 2, 3, 4, 5, 6],
      },
    },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [cloneType, setCloneType] = useState(null); // 'class' or 'subject'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    class: '',
    subject: '',
    availability: {
      monday: [1, 2, 3, 4],
      tuesday: [1, 2, 3, 4],
      wednesday: [1, 2, 3, 4],
      thursday: [1, 2, 3, 4],
      friday: [1, 2, 3, 4],
    },
  });

  const filteredTemplates = React.useMemo(() =>
    templates.filter(
      (template) =>
        template.class.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.subject.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [templates, searchQuery]
  );

  const totalPages = Math.ceil(filteredTemplates.length / itemsPerPage);
  const paginatedTemplates = React.useMemo(() =>
    filteredTemplates.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    ),
    [filteredTemplates, currentPage, itemsPerPage]
  );

  const handleAdd = () => {
    setEditingTemplate(null);
    setCloneType(null);
    setFormData({
      class: '',
      subject: '',
      availability: {
        monday: [1, 2, 3, 4],
        tuesday: [1, 2, 3, 4],
        wednesday: [1, 2, 3, 4],
        thursday: [1, 2, 3, 4],
        friday: [1, 2, 3, 4],
      },
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setCloneType(null);
    setFormData({
      class: template.class,
      subject: template.subject,
      availability: { ...template.availability },
    });
    setIsDialogOpen(true);
  };

  const handleCloneClass = (template) => {
    setEditingTemplate(template);
    setCloneType('class');
    setFormData({
      class: '',
      subject: template.subject,
      availability: { ...template.availability },
    });
    setIsDialogOpen(true);
  };

  const handleCloneSubject = (template) => {
    setEditingTemplate(template);
    setCloneType('subject');
    setFormData({
      class: template.class,
      subject: '',
      availability: { ...template.availability },
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id) => {
    setTemplates(templates.filter((t) => t.id !== id));
    toast('Template deleted successfully');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingTemplate && !cloneType) {
      setTemplates(
        templates.map((t) =>
          t.id === editingTemplate.id ? { ...t, ...formData } : t
        )
      );
      toast('Template updated successfully');
    } else {
      const newTemplate = {
        id: templates.length + 1,
        ...formData,
      };
      setTemplates([...templates, newTemplate]);
      toast(
        cloneType
          ? `Template cloned (${cloneType === 'class' ? 'class-based' : 'subject-based'})`
          : 'Template added successfully'
      );
    }
    setIsDialogOpen(false);
  };

  const getAvailabilitySummary = (availability) => {
    const totalSlots = Object.values(availability).reduce(
      (sum, slots) => sum + slots.length,
      0
    );
    return totalSlots;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2>{t('templates.title')}</h2>
          <p className="text-muted-foreground">{t('templates.description')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            {t('templates.import')}
          </Button>
          <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            {t('templates.add_template')}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>All Templates</CardTitle>
              <CardDescription>
                Manage templates for different classes and subjects
              </CardDescription>
            </div>
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Availability</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTemplates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell>
                    <Badge variant="outline">{template.id}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{template.class}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge>{template.subject}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground">
                      {getAvailabilitySummary(template.availability)} slots/week
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(template)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCloneClass(template)}
                        title="Clone (Class-based)"
                      >
                        <Copy className="h-4 w-4 text-blue-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCloneSubject(template)}
                        title="Clone (Subject-based)"
                      >
                        <Copy className="h-4 w-4 text-purple-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(template.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-muted-foreground">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, filteredTemplates.length)} of{' '}
              {filteredTemplates.length} templates
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Template Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate && !cloneType
                ? 'Edit Template'
                : cloneType
                ? `Clone Template (${cloneType === 'class' ? 'Class-based' : 'Subject-based'})`
                : 'Add New Template'}
            </DialogTitle>
            <DialogDescription>
              {editingTemplate && !cloneType
                ? 'Update the template details below.'
                : cloneType === 'class'
                ? 'Copy all availability/subjects, only change Class Name (required)'
                : cloneType === 'subject'
                ? 'Copy availability, only change Subject Name (required)'
                : 'Enter the details for the new template.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="class">
                  Class {cloneType === 'class' ? '*' : ''}
                </Label>
                <Input
                  id="class"
                  placeholder="e.g., 10-MA"
                  value={formData.class}
                  onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                  required={cloneType === 'class' || !editingTemplate}
                  disabled={cloneType === 'subject'}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="subject">
                  Subject {cloneType === 'subject' ? '*' : ''}
                </Label>
                <Input
                  id="subject"
                  placeholder="e.g., Mathematics"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required={cloneType === 'subject' || !editingTemplate}
                  disabled={cloneType === 'class'}
                />
              </div>
              <div className="grid gap-2">
                <Label>Availability Preview</Label>
                <div className="border rounded-lg p-4 space-y-2">
                  {Object.entries(formData.availability).map(([day, slots]) => (
                    <div key={day} className="flex items-center gap-2">
                      <span className="w-24 capitalize">{day}:</span>
                      <div className="flex flex-wrap gap-1">
                        {slots.length > 0 ? (
                          slots.map((slot) => (
                            <Badge key={slot} variant="outline" className="text-xs">
                              {slot}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-muted-foreground">
                  Total: {getAvailabilitySummary(formData.availability)} slots/week
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">
                {editingTemplate && !cloneType
                  ? 'Update'
                  : cloneType
                  ? 'Clone'
                  : 'Add'}{' '}
                Template
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Templates from Excel</DialogTitle>
            <DialogDescription>
              Upload an Excel file with template data or download our template.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Button
              variant="outline"
              onClick={() => toast('Template downloaded')}
              className="w-full"
            >
              <Download className="mr-2 h-4 w-4" />
              Download Excel Template
            </Button>
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-2">
                Drag and drop your Excel file here
              </p>
              <Input type="file" accept=".xlsx,.xls" className="max-w-xs mx-auto" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsImportDialogOpen(false)}>Import</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}