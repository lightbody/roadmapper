package controllers;

import models.Session;
import play.mvc.Http;
import play.mvc.Result;
import play.mvc.Security;

import java.util.Date;

public class Secured extends Security.Authenticator {
    @Override
    public String getUsername(Http.Context ctx) {
        String sessionId = ctx.request().getHeader("X-Session-ID");
        if (sessionId == null) {
            return null;
        }

        Session session = Session.find.byId(sessionId);
        if (session != null && session.expires.after(new Date())) {
            return session.user.email;
        } else {
            return null;
        }
    }

    @Override
    public Result onUnauthorized(Http.Context ctx) {
        return unauthorized();
    }
}
