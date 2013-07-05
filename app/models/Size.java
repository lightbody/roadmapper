package models;

public enum Size {
    NONE(8,0,0),
    TRIVIAL(5,0.25,1),
    SMALL(3,1,2),
    MEDIUM(2,4.5,3),
    LARGE(1,9,5),
    XLARGE(0,14,8);

    private int costWeight;
    private double costAsPersonWeeks;
    private int benefitWeight;

    private Size(int costWeight, double costAsPersonWeeks, int benefitWeight) {
        this.costWeight = costWeight;
        this.costAsPersonWeeks = costAsPersonWeeks;
        this.benefitWeight = benefitWeight;
    }

    public int getCostWeight() {
        return costWeight;
    }

    public int getBenefitWeight() {
        return benefitWeight;
    }

    public double getCostAsPersonWeeks() {
        return costAsPersonWeeks;
    }
}
