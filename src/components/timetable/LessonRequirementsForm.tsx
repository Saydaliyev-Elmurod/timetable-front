import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button'; // Assuming shadcn ui exists
import { cn } from '../ui/utils';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { LessonRequest } from '@/types/advancedTimetable';
import { Info, Clock, Calculator } from 'lucide-react';

interface LessonRequirementsFormProps {
    onSubmit: (data: LessonRequest) => void;
    teachers?: string[]; // Mock data for now
    subjects?: string[];
    classes?: string[];
}

export const LessonRequirementsForm: React.FC<LessonRequirementsFormProps> = ({
    onSubmit,
    teachers = ['Mr. Smith', 'Ms. Jones', 'Dr. Brown'],
    subjects = ['Math', 'Physics', 'History', 'Art'],
    classes = ['10A', '10B', '11A']
}) => {
    const [formData, setFormData] = useState<LessonRequest>({
        teacher: '',
        subject: '',
        classGroup: '',
        totalWeeklyHours: 1.0
    });

    const [feedback, setFeedback] = useState<{ type: string, message: string }>({ type: '', message: '' });

    useEffect(() => {
        const hours = formData.totalWeeklyHours;
        let type = 'Standard';
        let message = '';

        if (hours <= 0) {
            type = 'Invalid';
            message = 'Hours must be greater than 0.';
        } else if (hours % 1 === 0) {
            type = 'Weekly';
            message = `This class meets for ${hours} hours every week.`;
        } else if (hours % 0.5 === 0) {
            type = 'Bi-Weekly (A/B)';
            if (hours === 0.5) {
                message = 'This class occurs once every TWO weeks (cycle of 1 hour / 0 hours).';
            } else {
                const base = Math.floor(hours);
                const ceil = Math.ceil(hours);
                message = `This class alternates: ${base} hours one week, ${ceil} hours the next week.`;
            }
        } else {
            type = 'Custom';
            message = 'Unusual frequency.';
        }

        setFeedback({ type, message });
    }, [formData.totalWeeklyHours]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <Card className="w-full max-w-md mx-auto shadow-md">
            <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-indigo-600" />
                    New Lesson Requirement
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* Teacher Selection */}
                    <div className="space-y-1">
                        <Label htmlFor="teacher">Teacher</Label>
                        <Select
                            value={formData.teacher}
                            onValueChange={(v) => setFormData(prev => ({ ...prev, teacher: v }))}
                        >
                            <SelectTrigger id="teacher">
                                <SelectValue placeholder="Select Teacher" />
                            </SelectTrigger>
                            <SelectContent>
                                {teachers.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Subject Selection */}
                    <div className="space-y-1">
                        <Label htmlFor="subject">Subject</Label>
                        <Select
                            value={formData.subject}
                            onValueChange={(v) => setFormData(prev => ({ ...prev, subject: v }))}
                        >
                            <SelectTrigger id="subject">
                                <SelectValue placeholder="Select Subject" />
                            </SelectTrigger>
                            <SelectContent>
                                {subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Class Group */}
                    <div className="space-y-1">
                        <Label htmlFor="class">Class Group</Label>
                        <Select
                            value={formData.classGroup}
                            onValueChange={(v) => setFormData(prev => ({ ...prev, classGroup: v }))}
                        >
                            <SelectTrigger id="class">
                                <SelectValue placeholder="Select Class" />
                            </SelectTrigger>
                            <SelectContent>
                                {classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Hours Input */}
                    <div className="space-y-3 pt-2">
                        <div className="flex justify-between items-center">
                            <Label htmlFor="hours">Total Weekly Hours</Label>
                            <span className="text-sm font-bold text-indigo-600 px-2 py-0.5 bg-indigo-50 rounded">
                                {formData.totalWeeklyHours.toFixed(1)} hrs
                            </span>
                        </div>

                        <Input
                            type="number"
                            id="hours"
                            step="0.5"
                            min="0.5"
                            max="40"
                            value={formData.totalWeeklyHours}
                            onChange={(e) => setFormData(prev => ({ ...prev, totalWeeklyHours: parseFloat(e.target.value) }))}
                            className="font-mono text-lg"
                        />

                        {/* Dynamic Visual Feedback */}
                        <div className={cn(
                            "p-3 rounded-lg text-sm border flex gap-3 items-start transition-all",
                            feedback.type.includes('Bi-Weekly') ? "bg-amber-50 border-amber-200 text-amber-800" : "bg-gray-50 border-gray-100 text-gray-600"
                        )}>
                            <Clock className="w-4 h-4 mt-0.5 shrink-0" />
                            <div>
                                <div className="font-bold">{feedback.type}</div>
                                <div className="opacity-90">{feedback.message}</div>
                            </div>
                        </div>
                    </div>

                </form>
            </CardContent>
            <CardFooter>
                <Button
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white"
                    onClick={handleSubmit}
                    disabled={!formData.teacher || !formData.subject || !formData.classGroup}
                >
                    Create Requirement
                </Button>
            </CardFooter>
        </Card>
    );
};
