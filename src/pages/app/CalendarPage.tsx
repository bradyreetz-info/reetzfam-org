import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
import { CalendarPlus, Circle } from 'lucide-react'
import { calendarEvents } from '../../data/mock'

export function CalendarPage() {
  return <div><header className="page-header"><div><p className="eyebrow">Birthdays, gatherings & milestones</p><h1>Family calendar</h1><p>Plan ahead and keep the dates that matter in one shared place.</p></div><button className="button"><CalendarPlus /> Suggest an event</button></header><div className="calendar-legend"><span><Circle className="dot dot--gold" /> Birthday</span><span><Circle className="dot dot--green" /> Gathering</span><span><Circle className="dot dot--blue" /> Family history</span><span><Circle className="dot dot--terra" /> Volunteer</span></div><section className="panel calendar-panel"><FullCalendar plugins={[dayGridPlugin, listPlugin, interactionPlugin]} initialView="dayGridMonth" initialDate="2026-07-01" headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,listMonth' }} buttonText={{ today: 'Today', month: 'Month', list: 'List' }} events={calendarEvents} height="auto" eventClassNames={info => `event-${String(info.event.extendedProps.category).toLowerCase().replace(' ', '-')}`} /></section><p className="page-footnote">Birthdays are generated from the visibility preferences in each member’s profile. RSVP support is planned for a future release.</p></div>
}
