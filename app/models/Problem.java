package models;

import play.data.validation.Constraints;
import play.db.ebean.Model;

import javax.persistence.*;
import java.util.Date;
import java.util.Set;

@Entity
public class Problem extends Model {
    @Id
    public Long id;

    @Enumerated(EnumType.STRING)
    public ProblemState state;

    @Constraints.Required
    public Date date;

    @Constraints.Required
    public String description;

    @Constraints.Required
    @ManyToOne
    public User reporter;

    @Constraints.Required
    public String customerName;

    @Constraints.Required
    public String customerEmail;

    public String customerCompany;

    public Long accountId;

    public Integer annualRevenue;

    public String url;

    @ManyToOne
    public Feature feature;

    public Set<String> tags;

    public static Model.Finder<Long, Problem> find = new Model.Finder<>(Long.class, Problem.class);

    public static void create(Problem problem) {
        problem.save();
    }

    public static void delete(Long id) {
        find.ref(id).delete(id);
    }
}
