package util;

import org.joda.time.DateTime;
import org.joda.time.DateTimeZone;
import org.joda.time.Days;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

/**
 * Quarters are captured by integer, starting with 1 == Q1 2008 (first year of New Relic).
 */
public class Qtr implements Comparable<Qtr>, Serializable {
    public static void main(String[] args) {
        // test functions
        for (int i = 1; i < 40; i++) {
            Qtr qtr = get(i);
            System.out.println(i + " -> " + qtr.label);

            Qtr other = get(qtr.label);
            if (!qtr.equals(other)) {
                System.out.println("Uh oh, problem with quarter " + i);
            }
        }

        System.out.println("............................");

        System.out.println("Q1-2008 => " + get("Q1-2008").label);
        System.out.println("Q3-2011 => " + get("Q3-2011").label);
        System.out.println("Q4-2013 => " + get("Q3-2013").label);
        System.out.println("Q2-2012 => " + get("Q2-2012").label);
        System.out.println("Q0-2014 => " + get("Q0-2014").label);
        System.out.println("Q1-FY15 => " + get("Q1-FY15").label);
        System.out.println("Q3-FY15 => " + get("Q3-FY15").label);
        System.out.println("Q4-FY15 => " + get("Q4-FY15").label);
        System.out.println("Q2-2014 => " + get("Q2-2014").label);
        System.out.println("Q4-2014 => " + get("Q4-2014").label);
        System.out.println("Q1-2015 => " + get("Q1-2015").label);

        System.out.println("............................");

        System.out.println(current().label);

        System.out.println("............................");

        for (Qtr qtr : active()) {
            System.out.println(qtr.label + " (" + qtr.pctComplete + ")");
        }
    }

    public int id;
    public String label;
    public DateTime start;
    public DateTime end;
    public double pctComplete;
    private boolean fiscal;

    public static Qtr get(int quarter) {
        return new Qtr(quarter);
    }

    public static Qtr get(String label) {
        // special case Q0-214
        if ("Q0-2014".equals(label)) {
            return get(1, 2014);
        }

        int qtr = Integer.parseInt(label.substring(1, 2));

        int year;
        if (label.substring(3, 5).equals("FY")) {
            year = 2000 + Integer.parseInt(label.substring(5, 7));
            if (qtr == 4) {
                qtr = 1;
            } else {
                year--;
                qtr++;
            }
        } else {
            year = Integer.parseInt(label.substring(3, 7));
        }

        return get(qtr, year);
    }

    public static Qtr get(int qtr, int year) {
        return get((year - 2008) * 4 + qtr);
    }

    public static List<Qtr> active() {
        int id = current().id;
        ArrayList<Qtr> list = new ArrayList<>();

        for (int i = (id - 1); i < (id + 5); i++) {
            list.add(get(i));
        }

        return list;
    }

    public static Qtr current() {
        DateTime now = DateTime.now(DateTimeZone.UTC);
        int year = now.getYear();
        int month = now.getMonthOfYear();
        switch (month) {
            case 1:
            case 2:
            case 3:
                return get(1, year);
            case 4:
            case 5:
            case 6:
                return get(2, year);
            case 7:
            case 8:
            case 9:
                return get(3, year);
            case 10:
            case 11:
            case 12:
            default:
                return get(4, year);
        }
    }

    public Qtr(Integer id) {
        start = new DateTime(2008, 1, 1, 0, 0, DateTimeZone.UTC);
        for (int i = 1; i < id; i++) {
            start = start.plusMonths(3);
        }

        fiscal = false;
        this.id = id;
        this.end = start.plusMonths(3);

        int q = (start.getMonthOfYear() - 1) / 3 + 1;

        if (id == 25) {
            q = 0;
        } else if (id > 25) {
            fiscal = true;
            q = q - 1;

            if (id >= 29 && q == 0) {
                q = 4;
            }
        }

        if (fiscal) {
            int year = start.getYearOfCentury();
            if (q != 4) {
                year++;
            }
            label = "Q" + q + "-FY" + year;
        } else {
            label = "Q" + q + "-" + start.getYear();
        }

        // determine how complete this quarter is
        if (end.isBeforeNow()) {
            pctComplete = 1;
        } else if (start.isAfterNow()) {
            pctComplete = 0;
        } else {
            // assume 91 days per quarter
            int days = Days.daysBetween(start.toDateMidnight(), DateTime.now(DateTimeZone.UTC).toDateMidnight()).getDays();
            pctComplete = days / 91.0;
        }
    }

    @Override
    public boolean equals(Object obj) {
        if (!(obj instanceof Qtr)) {
            return false;
        }

        Qtr other = (Qtr) obj;

        return other.id == this.id && other.start.equals(this.start);
    }

    @Override
    public int compareTo(Qtr qtr) {
        return new Integer(qtr.id).compareTo(this.id);
    }
}
