package models;

import play.data.format.Formats;
import play.data.validation.Constraints;
import play.db.ebean.Model;

import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Table;
import java.util.List;

/**
 * User entity managed by Ebean
 */
@Entity
@Table(name = "users")
public class User extends Model {

    @Id
    @Constraints.Required
    @Formats.NonEmpty
    public String email;

    @Constraints.Required
    public String name;

    @Constraints.Required
    public String password;

    // -- Queries

    public static Model.Finder<String, User> find = new Model.Finder(String.class, User.class);

    public User(String name, String email, String password) {
        this.name = name;
        this.email = email;
        this.password = password;
    }

    /**
     * Retrieve all users.
     */
    public static List<User> findAll() {
        return find.all();
    }

    /**
     * Retrieve a User from email.
     */
    public static User findByEmail(String email) {
        return find.where().eq("email", email).findUnique();
    }

    /**
     * Authenticate a User.
     */
    public static User authenticate(String email, String password) {
        return find.where()
                .eq("email", email)
                .eq("password", password)
                .findUnique();
    }
}
