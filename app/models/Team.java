package models;

import play.data.validation.Constraints;
import play.db.ebean.Model;

import javax.persistence.Entity;
import javax.persistence.Id;
import java.util.HashMap;
import java.util.Map;

@Entity
public class Team extends Model {
    public static Model.Finder<Long, Team> find = new Model.Finder<>(Long.class, Team.class);

    @Id
    public Long id;

    @Constraints.Required
    public String name;

    public Map<Quarter, StaffSummary> quarterStaffSummary = new HashMap<>();
}
