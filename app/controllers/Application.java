package controllers;

import models.Session;
import models.User;
import org.codehaus.jackson.JsonNode;
import play.Routes;
import play.libs.Json;
import play.mvc.Controller;
import play.mvc.Result;
import util.BCrypt;
import views.html.index;

public class Application extends Controller {
    public static Result getSession(String id) {
        Session session = Session.find.byId(id);
        if (session == null) {
            return notFound();
        } else {
            return ok(Json.toJson(session));
        }
    }

    public static Result createUser() {
        JsonNode json = request().body().asJson();
        User user = Json.fromJson(json, User.class);
        user.password = BCrypt.hashpw(user.password, BCrypt.gensalt());
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

        User user = User.findByEmail(email);
        if (user == null || !BCrypt.checkpw(password, user.password)) {
            return unauthorized("Bad email/password combo");
        }

        // now create a session for the user
        Session session = new Session(user, 30);
        session.save();

        return ok(Json.toJson(session));
    }

    public static Result home() {
        return ok(index.render());
    }

    public static Result javascriptRoutes() {
        response().setContentType("text/javascript");
        return ok(
                Routes.javascriptRouter("jsRoutes",
                        controllers.routes.javascript.Application.createUser(),
                        controllers.routes.javascript.Application.authenticate()
                )
        );
    }


}