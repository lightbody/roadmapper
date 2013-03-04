package models;

import play.data.validation.Constraints;
import play.db.ebean.Model;

import javax.persistence.Entity;
import javax.persistence.Id;
import java.util.Map;

@Entity
public class Team extends Model {
    @Id
    public Long id;

    @Constraints.Required
    public String name;

    public Map<Quarter, Integer> peopleCount;
}
