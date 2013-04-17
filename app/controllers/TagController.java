package controllers;

import com.avaje.ebean.Ebean;
import com.avaje.ebean.SqlQuery;
import com.avaje.ebean.SqlRow;
import play.libs.Json;
import play.mvc.Controller;
import play.mvc.Result;
import play.mvc.Security;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Security.Authenticated(Secured.class)
public class TagController extends Controller {
    public static Result search(String query) {
        SqlQuery q = Ebean.createSqlQuery("select distinct tag from (select tag from problem_tags where tag like :like union select tag from feature_tags where tag like :like) t");
        q.setParameter("like", "%" + query + "%");
        List<SqlRow> rows = q.findList();
        Set<String> tags = new HashSet<>();
        for (SqlRow row : rows) {
            tags.add(row.getString("tag"));
        }

        return ok(Json.toJson(tags));
    }
}
