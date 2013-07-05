package models;

public class StaffSummary {
    private int staffed;
    private int scheduled;

    public StaffSummary() {
    }

    public StaffSummary(int staffed) {
        this.staffed = staffed;
    }

    public int getStaffed() {
        return staffed;
    }

    public void setStaffed(int staffed) {
        this.staffed = staffed;
    }

    public int getScheduled() {
        return scheduled;
    }

    public void setScheduled(int scheduled) {
        this.scheduled = scheduled;
    }

    public void addScheduledFeature(Size cost) {
        scheduled += cost.getCostAsPersonWeeks();
    }
}
