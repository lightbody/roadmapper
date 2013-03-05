package models;

import play.data.validation.Constraints;
import play.db.ebean.Model;

import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.Id;

@Entity
public class Feature extends Model {
    public static Model.Finder<Long, Feature> find = new Model.Finder<>(Long.class, Feature.class);

    @Id
    public Long id;

    @Constraints.Required
    public String description;

    @Enumerated(EnumType.STRING)
    public Size engineeringCost;

    @Enumerated(EnumType.STRING)
    public Size operationalBenefit;

    @Enumerated(EnumType.STRING)
    public Size revenueBenefit;

    @Enumerated(EnumType.STRING)
    public Size retentionBenefit;

    @Enumerated(EnumType.STRING)
    public Size positioningBenefit;

    public Integer score;

    public Team team;

    public Quarter quarter;
}
