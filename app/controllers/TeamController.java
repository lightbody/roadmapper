package controllers;

import models.Team;
import org.codehaus.jackson.JsonNode;
import play.libs.Json;
import play.mvc.Controller;
import play.mvc.Result;
import play.mvc.Security;

import java.util.List;

public class TeamController extends Controller {
    @Security.Authenticated(Secured.class)
    public static Result getAll() {
        List<Team> teams = Team.find.all();
        return ok(Json.toJson(teams));
    }

    @Security.Authenticated(Secured.class)
    public static Result create() {
        JsonNode json = request().body().asJson();

        Team team = Json.fromJson(json, Team.class);
        team.save();

        return ok();
    }

}
