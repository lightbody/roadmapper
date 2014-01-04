package models;

import java.util.Set;

public class FeatureBulkChange {
    public Set<Long> ids;
    public Set<String> tags;
    public FeatureState state;
    public Team team;
    public User assignee;
}
