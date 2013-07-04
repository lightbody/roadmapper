package models;

public enum Size {
    NONE(8,0),
    TRIVIAL(5,1),
    SMALL(3,2),
    MEDIUM(2,3),
    LARGE(1,5),
    XLARGE(0,8);

    private int costWeight;
    private int benefitWeight;

    private Size(int costWeight, int benefitWeight) {
        this.costWeight = costWeight;
        this.benefitWeight = benefitWeight;
    }

    public int getCostWeight() {
        return costWeight;
    }

    public int getBenefitWeight() {
        return benefitWeight;
    }
}
