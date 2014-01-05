package models;

import com.avaje.ebean.SqlRow;

public class ProblemCount {
    public int count;
    public Double revenue;

    public ProblemCount(SqlRow row) {
        this.count = row.getInteger("count");
        this.revenue = row.getDouble("revenue");
    }
}
