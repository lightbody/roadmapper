package models;

import java.util.Collections;
import java.util.Set;

public enum FeatureState {
    OPEN, RESEARCHING, PLANNED, COMMITTED, STARTED, STALLED, RELEASED;

    public static Set<FeatureState> resolvedStates() {
        return Collections.singleton(RELEASED);
    }
}
