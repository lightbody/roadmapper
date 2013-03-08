package controllers;

import models.Category;
import org.codehaus.jackson.JsonNode;
import play.libs.Json;
import play.mvc.Controller;
import play.mvc.Result;
import play.mvc.Security;

import java.util.List;

@Security.Authenticated(Secured.class)
public class CategoryController extends Controller {
    public static Result getAll() {
        List<Category> teams = Category.find.all();
        return ok(Json.toJson(teams));
    }

    public static Result create() {
        JsonNode json = request().body().asJson();

        Category category = Json.fromJson(json, Category.class);
        category.save();

        return ok(Json.toJson(category));
    }

    public static Result delete(long id) {
        Category.find.byId(id).delete();

        return ok();
    }

}
