package controllers;

import com.fasterxml.jackson.databind.JsonNode;
import com.newrelic.api.agent.NewRelic;
import models.User;
import models.UserRole;
import play.Configuration;
import play.Play;
import play.libs.WS;
import play.mvc.Http;
import play.mvc.Result;
import play.mvc.Security;

import java.util.Date;
import java.util.concurrent.TimeUnit;

public class Secured extends Security.Authenticator {
    @Override
    public String getUsername(Http.Context ctx) {
        String refreshToken = ctx.session().get("oauth-refresh-token");
        if (refreshToken == null) {
            return null;
        }

        String email = ctx.session().get("oauth-email");
        long currentExpiresIn = Long.parseLong(ctx.session().get("oauth-expires-in"));

        if (currentExpiresIn > (System.currentTimeMillis() - 15000)) {
            Configuration config = Play.application().configuration();

            WS.Response response = WS.url(config.getString("oauth.refreshTokenUrl"))
                    .setQueryParameter("refresh_token", refreshToken)
                    .setQueryParameter("client_id", config.getString("oauth.clientId"))
                    .setQueryParameter("client_secret", config.getString("oauth.clientSecret"))
                    .post("").get(15, TimeUnit.SECONDS);

            JsonNode json = response.asJson();

            String accessToken = json.get("access_token").asText();
            //String refreshToken = json.get("refresh_token").asText();
            long expiresIn = json.get("expires_at").asLong();

            response = WS.url(config.getString("oauth.userDetailUrl"))
                    .setHeader("Authorization", "Bearer " + accessToken)
                    .get().get(15, TimeUnit.SECONDS);

            json = response.asJson();
            email = json.get("email").asText();
            String name = json.get("first_name").asText() + " " + json.get("last_name").asText();

            User user = User.findByEmail(email);
            if (user == null) {
                // create one
                user = new User();
                user.email = email;
                user.name = name;
                user.role = UserRole.USER;
                user.firstLogin = new Date();
                user.save();
            } else {
                user.name = name;
                user.update();
            }

            ctx.session().put("oauth-access-token", accessToken);
            ctx.session().put("oauth-refresh-token", refreshToken);
            ctx.session().put("oauth-expires-in", String.valueOf(expiresIn));
            ctx.session().put("oauth-email", email);
        }

        NewRelic.addCustomParameter("user", email);

        return email;
    }

    @Override
    public Result onUnauthorized(Http.Context ctx) {
        return redirect(Play.application().configuration().getString("oauth.authorizeUrl"));
    }

    /**
     * Checks that the current user has the given `role`.
     * @param role the role to check the current user for
     * @return true if the user has the given role, false otherwise.
     */
    public static boolean checkRole(UserRole role) {
        User user = User.findByEmail(Http.Context.current().request().username());
        return user != null && role == user.role;
    }
}
