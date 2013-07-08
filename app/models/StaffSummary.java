package models;

public class StaffSummary {
    private double staffed;
    private double scheduled;

    public StaffSummary() {
    }

    public StaffSummary(double staffed) {
        this.staffed = staffed;
    }

    public double getStaffed() {
        return staffed;
    }

    public void setStaffed(int staffed) {
        this.staffed = staffed;
    }

    public double getScheduled() {
        return scheduled;
    }

    public void setScheduled(int scheduled) {
        this.scheduled = scheduled;
    }

    public void addScheduledFeature(Size cost) {
        scheduled += (cost.getCostAsPersonWeeks() / 5.0);
    }
}
