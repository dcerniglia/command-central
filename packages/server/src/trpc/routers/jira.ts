import { router, protectedProcedure } from '../trpc.js';
import { SYMBOLS } from '../../di/symbols.js';
import { JiraService } from '../../services/jira-service.js';

export const jiraRouter = router({
  status: protectedProcedure.query(async ({ ctx }) => {
    const jira = ctx.container.get<JiraService>(SYMBOLS.JiraService);
    const configured = jira.isConfigured();
    let issueCount = 0;
    if (configured) {
      try {
        const issues = await jira.getMyIssues();
        issueCount = issues.length;
      } catch {
        // Jira may be unreachable — still report configured
      }
    }
    return { configured, issueCount };
  }),

  sync: protectedProcedure.mutation(async ({ ctx }) => {
    const jira = ctx.container.get<JiraService>(SYMBOLS.JiraService);
    if (!jira.isConfigured()) {
      throw new Error('Jira is not configured. Set JIRA_URL, JIRA_EMAIL, and JIRA_API_TOKEN.');
    }
    return jira.syncAllIssues();
  }),
});
