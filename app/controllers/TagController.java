package controllers;

import models.Tag;
import play.libs.Json;
import play.mvc.Controller;
import play.mvc.Result;
import play.mvc.Security;

import java.util.List;

@Security.Authenticated(Secured.class)
public class TagController extends Controller {
    public static Result search(String query) {
        List<Tag> tags = Tag.find.where().like("tag", "%" + query + "%").findList();
        System.out.println("***************");
        System.out.println("***************");
        System.out.println(tags.size());
        System.out.println("***************");
        System.out.println("***************");
        return ok(Json.toJson(tags));
    }
}
