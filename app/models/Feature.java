package models;

import play.data.validation.Constraints;

import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.Id;

@Entity
public class Feature {
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
