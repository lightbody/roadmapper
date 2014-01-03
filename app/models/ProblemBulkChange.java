package models;

import java.util.Set;

public class ProblemBulkChange {
    public Set<Long> ids;
    public Set<String> tags;
    public ProblemState state;
    public Feature feature;
    public User assignee;
}
