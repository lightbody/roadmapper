package models;

import java.util.HashMap;
import java.util.Map;

public class DashboardStats {
    public ProblemCount newProblemsThisWeek;
    public ProblemCount newProblemsLastWeek;
    public ProblemCount modifiedProblemsThisWeek;
    public ProblemCount modifiedProblemsLastWeek;
    public ProblemCount unassignedOpenProblems;
    public Map<String, AssigneeStats> assigneeStats = new HashMap<>();

    public AssigneeStats getAssignee(String assignee) {
        AssigneeStats stats = assigneeStats.get(assignee);
        if (stats == null) {
            stats = new AssigneeStats();
            assigneeStats.put(assignee, stats);
        }

        return stats;
    }
}
