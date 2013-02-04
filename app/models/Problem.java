package models;

import play.data.validation.Constraints;
import play.db.ebean.Model;

import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.ManyToOne;
import java.util.Date;

@Entity
public class Problem extends Model {
    @Id
    public Long id;

    @Constraints.Required
    public Date date;

    @Constraints.Required
    public String description;

    @Constraints.Required
    @ManyToOne
    public User reporter;

    public Long accountId;

    public Integer annualRevenue;

    @ManyToOne
    public Feature feature;

    public static Model.Finder<Long, Problem> find = new Model.Finder<>(Long.class, Problem.class);

    public static void create(Problem problem) {
        problem.save();
    }

    public static void delete(Long id) {
        find.ref(id).delete(id);
    }

}
