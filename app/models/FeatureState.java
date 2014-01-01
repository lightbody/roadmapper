package models;

import java.util.Collections;
import java.util.Set;

public enum FeatureState {
    OPEN, RELEASED;

    public static Set<FeatureState> resolvedStates() {
        return Collections.singleton(RELEASED);
    }
}
