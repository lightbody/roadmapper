package models;


import java.util.HashSet;
import java.util.Set;

public enum ProblemState {
    OPEN,ASSIGNED,REVIEWED,RESOLVED,NOTIFIED,WONT_FIX,BUG,DUPE;

    public static Set<ProblemState> unresolvedStates() {
        HashSet<ProblemState> set = new HashSet<>();
        set.add(OPEN);
        set.add(ASSIGNED);
        set.add(REVIEWED);

        return set;
    }
}
