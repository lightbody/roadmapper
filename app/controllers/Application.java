package controllers;

import models.User;
import org.codehaus.jackson.JsonNode;
import play.libs.Json;
import play.mvc.Controller;
import play.mvc.Result;
import views.html.index;

public class Application extends Controller {
    public static Result createUser() {
        JsonNode json = request().body().asJson();
        User user = Json.fromJson(json, User.class);
        System.out.println("email --> " + user.email);
        System.out.println("password --> " + user.password);
        user.save();

        return ok();
    }

    public static Result authenticate() {
        JsonNode json = request().body().asJson();

        if (!json.has("email") || !json.has("password")) {
            return badRequest();
        }

        String email = json.get("email").getTextValue();
        String password = json.get("password").getTextValue();

        System.out.println("email --> " + email);
        System.out.println("password --> " + password);

        User user = User.authenticate(email, password);
        if (user == null) {
            return unauthorized("Bad email/password combo");
        } else {
            return ok(Json.toJson(user));
        }
    }

    public static Result home() {
        return ok(index.render());
    }

}