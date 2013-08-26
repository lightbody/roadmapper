package controllers;

import com.newrelic.api.agent.NewRelic;
import play.Configuration;
import play.Play;
import play.libs.WS;
import play.mvc.Http;
import play.mvc.Result;
import play.mvc.Security;

public class Secured extends Security.Authenticator {
    public final static String OAUTH_BASE = "https://dev--auth-newrelic-com-rzk4pe3f3jxn.runscope.net";
    public final static long OAUTH_TIMEOUT = 15000;

    @Override
    public String getUsername(Http.Context ctx) {
        String accessToken = ctx.session().get("oauth-access-token");
        if (accessToken == null) {
            return null;
        }

        String email = ctx.session().get("oauth-email");
        long lastCheck = Long.parseLong(ctx.session().get("oauth-last-check"));

        // check again if we've timed out
        if (System.currentTimeMillis() > lastCheck + OAUTH_TIMEOUT) {
            System.out.println("**********************************");
            System.out.println("**********************************");
            System.out.println("**********************************");
            System.out.println("**********************************");
            System.out.println("Checking OAuth with access token: " + accessToken);
            System.out.println("**********************************");
            System.out.println("**********************************");
            System.out.println("**********************************");
            System.out.println("**********************************");
            System.out.println("**********************************");


            Configuration config = Play.application().configuration();

            System.out.println(config.keys());

            WS.Response response = WS.url(config.getString("oauth.userDetailUrl"))
                    .setHeader("Authorization", "Bearer " + accessToken)
                    .get().get();

            System.out.println("Got response: " + response.getBody());

            if (response.getStatus() != 200) {
                ctx.session().remove("oauth-access-token");
                return null;
            } else {
                email = response.asJson().get("email").asText();
                ctx.session().put("oauth-email", email);
                ctx.session().put("oauth-last-check", String.valueOf(System.currentTimeMillis()));
            }
        }

        NewRelic.addCustomParameter("username", email);

        return email;
    }

    @Override
    public Result onUnauthorized(Http.Context ctx) {
        return redirect(Play.application().configuration().getString("oauth.authorizeUrl"));
    }
}
