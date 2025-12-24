import { startOfWeek, endOfWeek, parseISO, format } from 'date-fns';

export function getWeekRange(date = new Date()) {
    return {
        start: startOfWeek(date, { weekStartsOn: 1 }),
        end: endOfWeek(date, { weekStartsOn: 1 })
    };
}

export function formatDate(date: Date | string, formatStr = 'PPP') {
    if (!date) return '';
    return format(typeof date === 'string' ? parseISO(date) : date, formatStr);
}
