package controllers;

import models.Session;
import models.User;
import org.codehaus.jackson.JsonNode;
import play.Routes;
import play.libs.Json;
import play.mvc.Controller;
import play.mvc.Result;
import play.mvc.Security;
import util.BCrypt;
import util.Mail;
import views.html.index;

import javax.mail.MessagingException;

public class Application extends Controller {
    public static Result getSession(String id) {
        Session session = Session.find.byId(id);
        if (session == null) {
            return notFound();
        } else {
            // never send back the encrypted password
            session.user.password = null;

            return ok(Json.toJson(session));
        }
    }

    public static Result createUser() {
        JsonNode json = request().body().asJson();
        User user = Json.fromJson(json, User.class);

        // check if the user already exists
        if (User.findByEmail(user.email) != null) {
            response().setHeader("X-Global-Error", "emailTaken");
            return internalServerError();
        }

        user.password = BCrypt.hashpw(user.password, BCrypt.gensalt());
        user.save();

        return ok();
    }

    public static Result authenticate() {
        JsonNode json = request().body().asJson();

        if (!json.has("email") || !json.has("password")) {
            response().setHeader("X-Global-Error", "invalidLogin");
            return badRequest();
        }

        String email = json.get("email").getTextValue();
        String password = json.get("password").getTextValue();

        User user = User.findByEmail(email);
        if (user == null || !BCrypt.checkpw(password, user.password)) {
            response().setHeader("X-Global-Error", "invalidLogin");
            return unauthorized("Bad email/password combo");
        }

        // now create a session for the user
        Session session = new Session(user, 30);
        session.save();

        // never send back the encrypted password
        session.user.password = null;

        return ok(Json.toJson(session));
    }

    public static Result forgotPassword() {
        JsonNode json = request().body().asJson();

        String email = json.get("email").asText();

        User user = User.findByEmail(email);
        if (user == null) {
            return ok();
        }

        Session session = new Session(user, 30);
        session.save();

        try {
            Mail.send(email, "Roadmapper: Forgot password", "Please go here to reset your password: http://roadmapper-newrelic.herokuapp.com/#/forgot-password/" + session.id);
        } catch (MessagingException e) {
            e.printStackTrace();
            return internalServerError();
        }

        return ok();
    }

    @Security.Authenticated(Secured.class)
    public static Result updateUser() {
        JsonNode json = request().body().asJson();
        User update = Json.fromJson(json, User.class);

        User original = User.findByEmail(request().username());
        original.name = update.name;
        if (update.password != null) {
            original.password = BCrypt.hashpw(update.password, BCrypt.gensalt());
        }
        original.save();

        return ok();
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