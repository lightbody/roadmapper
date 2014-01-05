package models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import play.data.format.Formats;
import play.data.validation.Constraints;
import play.db.ebean.Model;

import javax.persistence.*;
import java.sql.Timestamp;
import java.util.Date;

/**
 * User entity managed by Ebean
 */
@Entity
@Table(name = "users")
@JsonIgnoreProperties({"id"})
public class User extends Model {

    @Id
    @Constraints.Required
    @Formats.NonEmpty
    public String email;

    @Constraints.Required
    public String name;

    @Enumerated(EnumType.STRING)
    public UserRole role;

    @Constraints.Required
    public Date firstLogin;

    @Version
    public Timestamp lastModified;

    // -- Queries

    public static Model.Finder<String, User> find = new Model.Finder(String.class, User.class);

    /**
     * Retrieve a User from email.
     */
    public static User findByEmail(String email) {
        return find.where().eq("email", email).findUnique();
    }
}
