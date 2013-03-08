package models;

import org.codehaus.jackson.map.annotate.JsonDeserialize;
import play.data.validation.Constraints;
import play.db.ebean.Model;
import util.TeamJsonDeserializer;

import javax.persistence.*;

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

    @JsonDeserialize(using = TeamJsonDeserializer.class)
    @ManyToOne
    public Team team;

    public Quarter quarter;
}
