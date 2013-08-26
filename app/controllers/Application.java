package controllers;

import models.User;
import org.codehaus.jackson.JsonNode;
import play.Configuration;
import play.Play;
import play.Routes;
import play.libs.Json;
import play.libs.WS;
import play.mvc.Controller;
import play.mvc.Result;
import play.mvc.Security;
import views.html.index;

public class Application extends Controller {
    public static Result oauthCallback() {
        String code = request().queryString().get("code")[0];

        Configuration config = Play.application().configuration();

        WS.Response response = WS.url(config.getString("oauth.accessTokenUrl"))
                .setQueryParameter("grant_type", "authorization_code")
                .setQueryParameter("code", code)
                .setQueryParameter("redirect_uri", config.getString("oauth.redirectUrl"))
                .setQueryParameter("client_id", config.getString("oauth.clientId"))
                .setQueryParameter("client_secret", config.getString("oauth.clientSecret"))
                .post("").get();

        JsonNode json = response.asJson();

        String accessToken = json.get("access_token").asText();

        response = WS.url(config.getString("oauth.userDetailUrl"))
                .setHeader("Authorization", "Bearer " + accessToken)
                .get().get();

        String email = response.asJson().get("email").asText();

        User user = User.findByEmail(email);
        if (user == null) {
            // create one
            user = new User();
            user.email = email;
            user.name = "N/A";
            user.password = "N/A";
            user.save();
        }

        session().put("oauth-access-token", accessToken);
        session().put("oauth-email", email);
        session().put("oauth-last-check", String.valueOf(System.currentTimeMillis()));

        return redirect("/");
    }

    public static Result logout() {
        session().remove("oauth-access-token");

        // note: this must be a two-stage logout process because we need to write the session cookie back
        // before going to the external OAuth logout URL
        return redirect(routes.Application.oauthLogout());
    }

    public static Result oauthLogout() {
        return redirect(Play.application().configuration().getString("oauth.logoutUrl"));
    }

    @Security.Authenticated(Secured.class)
    public static Result getUser() {
        User user = User.findByEmail(request().username());
        user.password = null;

        return ok(Json.toJson(user));
    }

    @Security.Authenticated(Secured.class)
    public static Result home() {
        return ok(index.render());
    }

    public static Result javascriptRoutes() {
        response().setContentType("text/javascript");
        return ok(
                Routes.javascriptRouter("jsRoutes")
        );
    }


}