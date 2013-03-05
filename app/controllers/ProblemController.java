package controllers;

import models.Problem;
import models.User;
import org.codehaus.jackson.JsonNode;
import play.libs.Json;
import play.mvc.Controller;
import play.mvc.Result;
import play.mvc.Security;

import java.util.Date;
import java.util.List;

public class ProblemController extends Controller {
    @Security.Authenticated(Secured.class)
    public static Result getAll() {
        List<Problem> problems = Problem.find.all();
        return ok(Json.toJson(problems));
    }

    @Security.Authenticated(Secured.class)
    public static Result create() {
        JsonNode json = request().body().asJson();

        Problem problem = Json.fromJson(json, Problem.class);
        problem.date = new Date();
        problem.reporter = User.findByEmail(request().username());
        problem.save();

        return ok();
    }
}
