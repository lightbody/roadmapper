package models;

import play.data.validation.Constraints;
import play.db.ebean.Model;

import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.ManyToOne;
import java.util.Date;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Entity
public class Session extends Model {
    public static Model.Finder<String, Session> find = new Model.Finder(String.class, Session.class);

    public Session() {
    }

    public Session(User user, int days) {
        this.id = UUID.randomUUID().toString();
        this.user = user;
        this.created = new Date();
        this.expires = new Date(created.getTime() + TimeUnit.DAYS.toMillis(days));
    }

    @Id
    public String id;

    @Constraints.Required
    @ManyToOne
    public User user;

    @Constraints.Required
    public Date created;

    @Constraints.Required
    public Date expires;

    public static Session findById(String id) {
        return find.byId(id);
    }
}
