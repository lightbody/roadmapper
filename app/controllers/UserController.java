package controllers;

import com.avaje.ebean.ExpressionList;
import models.User;
import play.libs.Json;
import play.mvc.Controller;
import play.mvc.Result;
import play.mvc.Security;

import java.util.Map;

import static com.avaje.ebean.Expr.like;

@Security.Authenticated(Secured.class)
public class UserController extends Controller {
    public static Result find() {
        ExpressionList<User> where = User.find.where();

        Map<String, String[]> query = request().queryString();

        if (query.containsKey("role")) {
            where.eq("role", query.get("role")[0]);
        }

        if (query.containsKey("text")) {
            String text = query.get("text")[0];
            where.or(like("email", "%" + text + "%"), like("name", "%" + text + "%"));
        }

        return ok(Json.toJson(where.findList()));
    }
}
