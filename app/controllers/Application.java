package controllers;

import com.avaje.ebean.Ebean;
import com.avaje.ebean.SqlRow;
import com.fasterxml.jackson.databind.JsonNode;
import models.*;
import org.joda.time.DateTime;
import org.joda.time.DateTimeConstants;
import org.joda.time.DateTimeZone;
import play.Configuration;
import play.Play;
import play.Routes;
import play.libs.Json;
import play.libs.WS;
import play.mvc.Controller;
import play.mvc.Result;
import play.mvc.Security;
import util.Qtr;
import views.html.index;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

public class Application extends Controller {
    @play.db.ebean.Transactional
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

        json = response.asJson();
        String email = json.get("email").asText();
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
    public static Result home() {
        List<Qtr> activeQuarters = Qtr.active();
        List<Qtr> allQuarters = new ArrayList<>();
        for (int i = 1; i < 40; i++) {
            allQuarters.add(new Qtr(i));
        }

        return ok(index.render(User.findByEmail(request().username()), activeQuarters, allQuarters));
    }

    @Security.Authenticated(Secured.class)
    public static Result dashboardStats() {
        DashboardStats stats = new DashboardStats();

        final DateTime input = new DateTime(DateTimeZone.UTC);
        final DateTime startOfLastWeek = input.withTimeAtStartOfDay().minusWeeks(2).withDayOfWeek(DateTimeConstants.SUNDAY);
        final DateTime endOfLastWeek = input.withTimeAtStartOfDay().minusWeeks(1).withDayOfWeek(DateTimeConstants.SUNDAY);

        stats.newProblemsThisWeek = new ProblemCount(Ebean.createSqlQuery("select count(*) as count, sum(annual_revenue) as revenue from problem where date between :start and :end")
                .setParameter("start", endOfLastWeek)
                .setParameter("end", input)
                .findUnique());

        stats.newProblemsLastWeek = new ProblemCount(Ebean.createSqlQuery("select count(*) as count, sum(annual_revenue) as revenue from problem where date between :start and :end")
                .setParameter("start", startOfLastWeek)
                .setParameter("end", endOfLastWeek)
                .findUnique());

        stats.modifiedProblemsThisWeek = new ProblemCount(Ebean.createSqlQuery("select count(*) as count, sum(annual_revenue) as revenue from problem where last_modified != date and last_modified between :start and :end")
                .setParameter("start", endOfLastWeek)
                .setParameter("end", input)
                .findUnique());

        stats.modifiedProblemsLastWeek = new ProblemCount(Ebean.createSqlQuery("select count(*) as count, sum(annual_revenue) as revenue from problem where last_modified != date and last_modified between :start and :end")
                .setParameter("start", startOfLastWeek)
                .setParameter("end", endOfLastWeek)
                .findUnique());

        stats.unassignedOpenProblems = new ProblemCount(Ebean.createSqlQuery("select count(*) as count, sum(annual_revenue) as revenue from problem where state = :state and assignee_email is null")
                .setParameter("state", ProblemState.OPEN)
                .findUnique());

        List<SqlRow> rows = Ebean.createSqlQuery("select assignee_email, count(*) as count, sum(annual_revenue) as revenue from problem where state = :state and assignee_email is not null group by assignee_email ")
                .setParameter("state", ProblemState.OPEN)
                .setParameter("me", request().username())
                .findList();
        for (SqlRow row : rows) {
            stats.getAssignee(row.getString("assignee_email")).openProblems = new ProblemCount(row);
        }

        rows = Ebean.createSqlQuery("select assignee_email, count(*) from problem where state = :state and date between :start and :end and assignee_email is not null group by assignee_email ")
                .setParameter("state", ProblemState.OPEN)
                .setParameter("start", endOfLastWeek)
                .setParameter("end", input)
                .findList();
        for (SqlRow row : rows) {
            stats.getAssignee(row.getString("assignee_email")).openProblemsThisWeek = new ProblemCount(row);
        }

        rows = Ebean.createSqlQuery("select assignee_email, count(*) as count, sum(annual_revenue) as revenue from problem where state = :state and assignee_email is not null group by assignee_email ")
                .setParameter("state", ProblemState.REVIEWED)
                .findList();
        for (SqlRow row : rows) {
            stats.getAssignee(row.getString("assignee_email")).reviewedProblems = new ProblemCount(row);
        }

        rows = Ebean.createSqlQuery("select assignee_email, count(*) as count, sum(annual_revenue) as revenue from problem where state = :state and feature_id is null and assignee_email is not null group by assignee_email ")
                .setParameter("state", ProblemState.REVIEWED)
                .findList();
        for (SqlRow row : rows) {
            stats.getAssignee(row.getString("assignee_email")).reviewedUnmappedProblems = new ProblemCount(row);
        }

        rows = Ebean.createSqlQuery("select assignee_email, count(*) as count, sum(annual_revenue) as revenue from problem where state = :state and assignee_email is not null group by assignee_email ")
                .setParameter("state", ProblemState.RESOLVED)
                .findList();
        for (SqlRow row : rows) {
            stats.getAssignee(row.getString("assignee_email")).resolvedProblems = new ProblemCount(row);
        }

        rows = Ebean.createSqlQuery("select assignee_email, count(*) as count, sum(annual_revenue) as revenue from problem where state = :state and assignee_email is not null group by assignee_email ")
                .setParameter("state", ProblemState.NOTIFIED)
                .findList();
        for (SqlRow row : rows) {
            stats.getAssignee(row.getString("assignee_email")).notifiedProblems = new ProblemCount(row);
        }

        return ok(Json.toJson(stats));
    }

    public static Result javascriptRoutes() {
        response().setContentType("text/javascript");
        return ok(
                Routes.javascriptRouter("jsRoutes")
        );
    }


}