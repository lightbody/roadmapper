package models;

import org.codehaus.jackson.map.annotate.JsonDeserialize;
import play.data.validation.Constraints;
import play.db.ebean.Model;
import util.TeamJsonDeserializer;

import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.ManyToOne;

@Entity
public class Category extends Model {
    public static Model.Finder<Long, Category> find = new Model.Finder<>(Long.class, Category.class);

    @Id
    public Long id;

    @Constraints.Required
    public String name;

    @Constraints.Required
    @JsonDeserialize(using = TeamJsonDeserializer.class)
    @ManyToOne
    public Team team;

}
