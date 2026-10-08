import { useQuery } from '@tanstack/react-query';
import TeacherReportService, { reportFilters } from '../services/TeacherReportService';

const retryReport = (count, error) => count < 1 && (!error.status || error.status >= 500);
const reportOptions = (kind, filters, enabled) => ({
    queryKey: ['teacher', 'reports', kind, reportFilters(filters)],
    queryFn: ({ signal }) => TeacherReportService[kind](filters, { signal }),
    enabled: Boolean(filters?.groupId) && enabled,
    staleTime: 30000,
    retry: retryReport,
});

export function useReportOverviewQuery(filters, { enabled = true } = {}) {
    const overviewFilters = reportFilters(filters, { pagination: false });
    return useQuery(reportOptions('getOverview', overviewFilters, enabled));
}

export function useReportStudentsQuery(filters, { enabled = true } = {}) {
    return useQuery(reportOptions('getStudents', filters, enabled));
}

export function useReportActivitiesQuery(filters, { enabled = true } = {}) {
    return useQuery(reportOptions('getActivities', filters, enabled));
}

export function useActivityAttemptHistoryQuery(activityId, { enabled = true } = {}) {
    return useQuery({
        queryKey: ['teacher', 'activity-attempts', String(activityId)],
        queryFn: ({ signal }) => TeacherReportService.getAttemptHistory(activityId, { signal }),
        enabled: Boolean(activityId) && enabled,
        staleTime: 30000,
        retry: retryReport,
    });
}
