package models;

import play.data.format.Formats;
import play.data.validation.Constraints;
import play.db.ebean.Model;

import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Table;

@Entity
@Table(name = "tags")
public class Tag {
    @Id
    @Constraints.Required
    @Formats.NonEmpty
    public String tag;

    public static Model.Finder<String, Tag> find = new Model.Finder(String.class, Tag.class);

}
