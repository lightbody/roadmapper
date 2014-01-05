package models;


import java.util.HashSet;
import java.util.Set;

public enum ProblemState {
    OPEN,REVIEWED,RESOLVED,NOTIFIED,WONT_FIX,BUG,DUPE;

    public static Set<ProblemState> unresolvedStates() {
        HashSet<ProblemState> set = new HashSet<>();
        set.add(OPEN);
        set.add(REVIEWED);

        return set;
    }
}
