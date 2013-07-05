package models;

import play.data.validation.Constraints;
import play.db.ebean.Model;

import javax.persistence.*;
import java.sql.Timestamp;
import java.util.Set;

@Entity
public class Feature extends Model {
    public static Model.Finder<Long, Feature> find = new Model.Finder<>(Long.class, Feature.class);

    @Id
    public Long id;

    @Constraints.Required
    public String title;

    @Constraints.Required
    public String description;

    @Constraints.Required
    @ManyToOne
    public User creator;

    @Enumerated(EnumType.STRING)
    public FeatureState state;

    public Timestamp lastModified;

    @ManyToOne
    public User lastModifiedBy;

    @Enumerated(EnumType.STRING)
    public Size engineeringCost;

    @Enumerated(EnumType.STRING)
    public Size revenueBenefit;

    @Enumerated(EnumType.STRING)
    public Size retentionBenefit;

    @Enumerated(EnumType.STRING)
    public Size positioningBenefit;

    @Transient
    public transient Integer score;

    @Transient
    public transient Integer problemCount;

    @Transient
    public transient Integer problemRevenue;

    @ManyToOne
    public Team team;

    @Enumerated(EnumType.STRING)
    public Quarter quarter;

    public Set<String> tags;

}
