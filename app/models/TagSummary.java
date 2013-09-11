package models;

public class TagSummary {

    public TagSummary(String tag, Double unresolvedArr) {
        this.tag = tag;
        if (unresolvedArr != null) {
            this.unresolvedArr = unresolvedArr;
        }
    }

    public String tag;

    public int openProblems;

    public int assignedProblems;

    public int reviewedProblems;

    public int openFeatures;

    public int researchingFeatures;

    public int plannedFeatures;

    public int committedFeatures;

    public int startedFeatures;

    public int stalledFeatures;

    public double unresolvedArr;
}
