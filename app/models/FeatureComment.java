package models;

import play.data.validation.Constraints;
import play.db.ebean.Model;

import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.ManyToOne;
import java.util.Date;

@Entity
public class FeatureComment extends Model {
    public static Model.Finder<Long, FeatureComment> find = new Model.Finder<>(Long.class, FeatureComment.class);

    @Id
    public Long id;

    @Constraints.Required
    public Long featureId;

    @Constraints.Required
    @ManyToOne
    public User  user;

    @Constraints.Required
    public String comment;

    @Constraints.Required
    public Date date;
}
