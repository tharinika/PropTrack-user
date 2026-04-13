import React, { useState, useMemo } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { ChevronLeft, ChevronRight, DollarSign, PartyPopper, Plus, Edit2, Trash2, Calendar as CalendarIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useAppData } from '../../contexts/AppDataContext';
import { useProperties } from '../../contexts/PropertiesContext';
import { GradientButton } from '../GradientButton';

// ============================================================================
// Indian Festival Dataset (Static)
// ============================================================================

const INDIAN_FESTIVALS = [
  // 2026
  { name: 'New Year', date: '2026-01-01', color: 'purple' },
  { name: 'Pongal', date: '2026-01-14', color: 'purple' },
  { name: 'Republic Day', date: '2026-01-26', color: 'purple' },
  { name: 'Maha Shivaratri', date: '2026-02-18', color: 'purple' },
  { name: 'Holi', date: '2026-03-25', color: 'purple' },
  { name: 'Ram Navami', date: '2026-04-02', color: 'purple' },
  { name: 'Good Friday', date: '2026-04-03', color: 'purple' },
  { name: 'Eid ul-Fitr', date: '2026-04-20', color: 'purple' },
  { name: 'Independence Day', date: '2026-08-15', color: 'purple' },
  { name: 'Janmashtami', date: '2026-08-24', color: 'purple' },
  { name: 'Ganesh Chaturthi', date: '2026-09-13', color: 'purple' },
  { name: 'Dussehra', date: '2026-10-12', color: 'purple' },
  { name: 'Diwali', date: '2026-10-31', color: 'purple' },
  { name: 'Guru Nanak Jayanti', date: '2026-11-19', color: 'purple' },
  { name: 'Christmas', date: '2026-12-25', color: 'purple' },
  
  // 2025
  { name: 'New Year', date: '2025-01-01', color: 'purple' },
  { name: 'Pongal', date: '2025-01-14', color: 'purple' },
  { name: 'Republic Day', date: '2025-01-26', color: 'purple' },
  { name: 'Maha Shivaratri', date: '2025-02-26', color: 'purple' },
  { name: 'Holi', date: '2025-03-14', color: 'purple' },
  { name: 'Eid ul-Fitr', date: '2025-03-31', color: 'purple' },
  { name: 'Ram Navami', date: '2025-04-06', color: 'purple' },
  { name: 'Good Friday', date: '2025-04-18', color: 'purple' },
  { name: 'Independence Day', date: '2025-08-15', color: 'purple' },
  { name: 'Janmashtami', date: '2025-08-16', color: 'purple' },
  { name: 'Ganesh Chaturthi', date: '2025-08-27', color: 'purple' },
  { name: 'Dussehra', date: '2025-10-02', color: 'purple' },
  { name: 'Diwali', date: '2025-10-20', color: 'purple' },
  { name: 'Guru Nanak Jayanti', date: '2025-11-05', color: 'purple' },
  { name: 'Christmas', date: '2025-12-25', color: 'purple' },
  
  // 2027
  { name: 'New Year', date: '2027-01-01', color: 'purple' },
  { name: 'Pongal', date: '2027-01-14', color: 'purple' },
  { name: 'Republic Day', date: '2027-01-26', color: 'purple' },
  { name: 'Maha Shivaratri', date: '2027-03-09', color: 'purple' },
  { name: 'Holi', date: '2027-03-22', color: 'purple' },
  { name: 'Good Friday', date: '2027-03-26', color: 'purple' },
  { name: 'Eid ul-Fitr', date: '2027-04-09', color: 'purple' },
  { name: 'Ram Navami', date: '2027-04-21', color: 'purple' },
  { name: 'Independence Day', date: '2027-08-15', color: 'purple' },
  { name: 'Janmashtami', date: '2027-08-14', color: 'purple' },
  { name: 'Ganesh Chaturthi', date: '2027-09-02', color: 'purple' },
  { name: 'Dussehra', date: '2027-10-01', color: 'purple' },
  { name: 'Diwali', date: '2027-10-19', color: 'purple' },
  { name: 'Guru Nanak Jayanti', date: '2027-11-24', color: 'purple' },
  { name: 'Christmas', date: '2027-12-25', color: 'purple' },
];

// ============================================================================
// Calendar Event Types
// ============================================================================

interface CalendarEvent {
  type: 'rent-due' | 'payment' | 'festival' | 'personal';
  title: string;
  description?: string;
  amount?: number;
  color: 'green' | 'blue' | 'purple' | 'yellow';
  id?: string; // For personal events
  isEditable?: boolean; // Can this event be edited/deleted?
}

interface DayEvents {
  [date: string]: CalendarEvent[];
}

// ============================================================================
// Main Calendar Component
// ============================================================================

export function CalendarView() {
  const { user } = useAuth();
  const { payments, calendarEvents, addCalendarEvent, updateCalendarEvent, deleteCalendarEvent } = useAppData();
  const { properties } = useProperties();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<{ id: string; title: string; description: string } | null>(null);
  
  // Form state
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  
  // Get tenant's property and unit info
  const tenantProperty = properties.find(p => p.id === user?.propertyId);
  const tenantUnit = tenantProperty?.units.find(u => u.id === user?.unitId);
  const monthlyRent = tenantUnit?.rent || user?.monthlyRent || 0;
  
  // Filter payments and events for current tenant only
  const tenantPayments = payments.filter(p => p.tenantId === user?.id);
  const tenantCalendarEvents = calendarEvents.filter(e => e.tenantId === user?.id);
  
  // ============================================================================
  // Generate Calendar Events from Real Data
  // ============================================================================
  
  const allCalendarEvents = useMemo<DayEvents>(() => {
    const events: DayEvents = {};
    
    // Helper to format date as YYYY-MM-DD
    const formatDate = (date: Date) => {
      return date.toISOString().split('T')[0];
    };
    
    // 1. Add Rent Due dates (1st of every month)
    const startYear = currentDate.getFullYear() - 1;
    const endYear = currentDate.getFullYear() + 2;
    
    for (let year = startYear; year <= endYear; year++) {
      for (let month = 0; month < 12; month++) {
        const rentDueDate = new Date(year, month, 1);
        const dateKey = formatDate(rentDueDate);
        
        if (!events[dateKey]) events[dateKey] = [];
        events[dateKey].push({
          type: 'rent-due',
          title: 'Rent Due',
          description: `Monthly rent payment of ₹${monthlyRent.toLocaleString('en-IN')}`,
          amount: monthlyRent,
          color: 'green',
          isEditable: false
        });
      }
    }
    
    // 2. Add Payment History (Last Paid dates)
    tenantPayments.forEach(payment => {
      if (payment.status === 'paid' && payment.paidDate) {
        const paidDate = new Date(payment.paidDate);
        const dateKey = formatDate(paidDate);
        
        if (!events[dateKey]) events[dateKey] = [];
        events[dateKey].push({
          type: 'payment',
          title: 'Rent Paid',
          description: `Paid ₹${payment.amount.toLocaleString('en-IN')}`,
          amount: payment.amount,
          color: 'blue',
          isEditable: false
        });
      }
    });
    
    // 3. Add Indian Festivals
    INDIAN_FESTIVALS.forEach(festival => {
      const dateKey = festival.date;
      if (!events[dateKey]) events[dateKey] = [];
      events[dateKey].push({
        type: 'festival',
        title: festival.name,
        color: 'purple',
        isEditable: false
      });
    });
    
    // 4. Add Personal Events (User Created)
    tenantCalendarEvents.forEach(event => {
      const dateKey = event.date;
      if (!events[dateKey]) events[dateKey] = [];
      events[dateKey].push({
        type: 'personal',
        title: event.title,
        description: event.description,
        color: 'yellow',
        id: event.id,
        isEditable: true
      });
    });
    
    return events;
  }, [tenantPayments, tenantCalendarEvents, monthlyRent, currentDate]);
  
  // ============================================================================
  // Calendar Grid Generation
  // ============================================================================
  
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Get first day of month and total days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    // Calculate previous month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    const prevMonthDays = Array.from(
      { length: startingDayOfWeek },
      (_, i) => ({
        date: prevMonthLastDay - startingDayOfWeek + i + 1,
        isCurrentMonth: false,
        fullDate: new Date(year, month - 1, prevMonthLastDay - startingDayOfWeek + i + 1)
      })
    );
    
    // Current month days
    const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => ({
      date: i + 1,
      isCurrentMonth: true,
      fullDate: new Date(year, month, i + 1)
    }));
    
    // Next month padding to complete the grid
    const totalCells = prevMonthDays.length + currentMonthDays.length;
    const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    const nextMonthDays = Array.from({ length: remainingCells }, (_, i) => ({
      date: i + 1,
      isCurrentMonth: false,
      fullDate: new Date(year, month + 1, i + 1)
    }));
    
    return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
  }, [currentDate]);
  
  // ============================================================================
  // Navigation Handlers
  // ============================================================================
  
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  
  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  
  const goToToday = () => {
    setCurrentDate(new Date());
  };
  
  // ============================================================================
  // Helper Functions
  // ============================================================================
  
  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };
  
  const formatDateKey = (date: Date) => {
    return date.toISOString().split('T')[0];
  };
  
  const getEventsForDate = (date: Date) => {
    const dateKey = formatDateKey(date);
    return allCalendarEvents[dateKey] || [];
  };
  
  const handleDateClick = (date: Date, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return;
    setSelectedDate(formatDateKey(date));
  };
  
  const selectedDateEvents = selectedDate ? allCalendarEvents[selectedDate] || [] : [];
  
  // Separate system events and personal events
  const systemEvents = selectedDateEvents.filter(e => !e.isEditable);
  const personalEvents = selectedDateEvents.filter(e => e.isEditable);
  
  // ============================================================================
  // Event Management Handlers
  // ============================================================================
  
  const handleAddEvent = () => {
    setEventTitle('');
    setEventDescription('');
    setEventDate(selectedDate || formatDateKey(new Date()));
    setEditingEvent(null);
    setIsAddEventOpen(true);
  };
  
  const handleEditEvent = (event: CalendarEvent) => {
    setEventTitle(event.title);
    setEventDescription(event.description || '');
    setEventDate(selectedDate || '');
    setEditingEvent({ id: event.id!, title: event.title, description: event.description || '' });
    setIsAddEventOpen(true);
  };
  
  const handleDeleteEvent = (eventId: string) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      deleteCalendarEvent(eventId);
    }
  };
  
  const handleSaveEvent = () => {
    if (!eventTitle.trim()) {
      alert('Please enter an event title');
      return;
    }
    
    if (editingEvent) {
      // Update existing event
      updateCalendarEvent(editingEvent.id, {
        title: eventTitle,
        description: eventDescription,
        date: eventDate
      });
    } else {
      // Create new event
      addCalendarEvent({
        tenantId: user!.id,
        title: eventTitle,
        description: eventDescription,
        date: eventDate,
        type: 'personal'
      });
    }
    
    setIsAddEventOpen(false);
    setEventTitle('');
    setEventDescription('');
    setEventDate('');
    setEditingEvent(null);
  };
  
  // ============================================================================
  // Render Calendar
  // ============================================================================
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-semibold mb-1">Calendar</h2>
          <p className="text-muted-foreground">View rent dates, payments, festivals, and personal reminders</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={goToToday}>
            Today
          </Button>
          <GradientButton onClick={() => {
            setEventDate(formatDateKey(new Date()));
            handleAddEvent();
          }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Event
          </GradientButton>
        </div>
      </div>

      <Card className="p-6">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={goToNextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Day Headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
              {day}
            </div>
          ))}
          
          {/* Calendar Days */}
          {calendarDays.map((day, index) => {
            const events = getEventsForDate(day.fullDate);
            const today = isToday(day.fullDate);
            
            return (
              <button
                key={index}
                onClick={() => handleDateClick(day.fullDate, day.isCurrentMonth)}
                disabled={!day.isCurrentMonth}
                className={`
                  min-h-[80px] p-2 rounded-lg border transition-all
                  ${day.isCurrentMonth 
                    ? 'bg-card hover:bg-accent hover:shadow-md cursor-pointer' 
                    : 'bg-muted/30 opacity-50 cursor-not-allowed'
                  }
                  ${today ? 'border-primary border-2 shadow-lg' : 'border-border'}
                  ${selectedDate === formatDateKey(day.fullDate) ? 'ring-2 ring-primary' : ''}
                  flex flex-col items-start
                `}
              >
                <span className={`text-sm font-medium mb-1 ${today ? 'text-primary' : ''}`}>
                  {day.date}
                </span>
                
                {/* Event Dots */}
                {events.length > 0 && day.isCurrentMonth && (
                  <div className="flex flex-wrap gap-1 mt-auto">
                    {events.map((event, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full ${
                          event.color === 'green'
                            ? 'bg-green-500'
                            : event.color === 'blue'
                            ? 'bg-blue-500'
                            : event.color === 'purple'
                            ? 'bg-purple-500'
                            : 'bg-yellow-500'
                        }`}
                        title={event.title}
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-6 pt-6 border-t border-border">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-muted-foreground">Rent Due</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-muted-foreground">Rent Paid</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            <span className="text-muted-foreground">Festival / Holiday</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="text-muted-foreground">Personal Event</span>
          </div>
        </div>
      </Card>

      {/* Date Details Dialog */}
      <Dialog open={!!selectedDate} onOpenChange={() => setSelectedDate(null)}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>
                {selectedDate && new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </DialogTitle>
              <Button variant="ghost" size="icon" onClick={handleAddEvent}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <DialogDescription>
              View rent due dates, payments, festivals, and personal events for this date
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 pt-4">
            {/* System Events Section */}
            {systemEvents.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  System Events
                </h4>
                <div className="space-y-3">
                  {systemEvents.map((event, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`
                          w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                          ${event.color === 'green' 
                            ? 'bg-green-500/10' 
                            : event.color === 'blue' 
                            ? 'bg-blue-500/10' 
                            : 'bg-purple-500/10'
                          }
                        `}>
                          {event.type === 'rent-due' && <DollarSign className="w-5 h-5 text-green-600" />}
                          {event.type === 'payment' && <DollarSign className="w-5 h-5 text-blue-600" />}
                          {event.type === 'festival' && <PartyPopper className="w-5 h-5 text-purple-600" />}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1">{event.title}</h4>
                          {event.description && (
                            <p className="text-sm text-muted-foreground">{event.description}</p>
                          )}
                          <Badge
                            variant="outline"
                            className={`mt-2 ${
                              event.color === 'green'
                                ? 'bg-green-500/10 text-green-600 border-green-500/20'
                                : event.color === 'blue'
                                ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                                : 'bg-purple-500/10 text-purple-600 border-purple-500/20'
                            }`}
                          >
                            {event.type === 'rent-due' && 'Rent Due'}
                            {event.type === 'payment' && 'Payment'}
                            {event.type === 'festival' && 'Festival'}
                          </Badge>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Personal Events Section */}
            {personalEvents.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  My Events
                </h4>
                <div className="space-y-3">
                  {personalEvents.map((event, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-yellow-500/10">
                          <CalendarIcon className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1">{event.title}</h4>
                          {event.description && (
                            <p className="text-sm text-muted-foreground">{event.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Badge
                              variant="outline"
                              className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                            >
                              Personal
                            </Badge>
                            <div className="flex gap-1 ml-auto">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => handleEditEvent(event)}
                              >
                                <Edit2 className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => handleDeleteEvent(event.id!)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* No Events */}
            {systemEvents.length === 0 && personalEvents.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No events on this date</p>
                <Button variant="outline" onClick={handleAddEvent}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Event
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Event Dialog */}
      <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingEvent ? 'Edit Event' : 'Add Event'}</DialogTitle>
            <DialogDescription>
              {editingEvent ? 'Update your event details' : 'Add a new event to your calendar'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="event-title">Event Title *</Label>
              <Input
                id="event-title"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="e.g., Doctor Visit, Travel"
                className="mt-2"
              />
            </div>
            
            <div>
              <Label htmlFor="event-description">Description (Optional)</Label>
              <Textarea
                id="event-description"
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                placeholder="Add notes about this event..."
                className="mt-2"
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="event-date">Date *</Label>
              <Input
                id="event-date"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddEventOpen(false)}>
              Cancel
            </Button>
            <GradientButton onClick={handleSaveEvent}>
              {editingEvent ? 'Update Event' : 'Add Event'}
            </GradientButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}