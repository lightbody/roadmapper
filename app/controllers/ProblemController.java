package controllers;

import com.avaje.ebean.Ebean;
import com.avaje.ebean.SqlQuery;
import com.avaje.ebean.SqlRow;
import com.avaje.ebean.SqlUpdate;
import models.Problem;
import models.ProblemState;
import models.User;
import org.codehaus.jackson.JsonNode;
import play.libs.Json;
import play.mvc.Controller;
import play.mvc.Result;
import play.mvc.Security;

import java.util.Date;
import java.util.HashSet;
import java.util.List;

@Security.Authenticated(Secured.class)
public class ProblemController extends Controller {

    public static Result findOpen() {
        return findByState(ProblemState.OPEN);
    }

    public static Result getProblem(Long id) {
        Problem problem = Problem.find.byId(id);

        if (problem == null) {
            return notFound();
        }

        // get the tags
        problem.tags = new HashSet<>();
        SqlQuery query = Ebean.createSqlQuery("select tag from problem_tags where problem_id = :problem_id");
        query.setParameter("problem_id", id);
        List<SqlRow> list = query.findList();
        for (SqlRow row : list) {
            problem.tags.add(row.getString("tag"));
        }

        return ok(Json.toJson(problem));
    }

    @play.db.ebean.Transactional
    public static Result updateProblem(Long id) {
        Problem original = Problem.find.byId(id);

        if (original == null) {
            return notFound();
        }

        JsonNode json = request().body().asJson();
        Problem update = Json.fromJson(json, Problem.class);
        original.description = update.description;
        original.accountId = update.accountId;
        original.annualRevenue = update.annualRevenue;
        original.url = update.url;

        // todo: feature???
        original.save();

        System.out.println("!!!!!!!!!!!!!!!!!");

        // delete tag and then re-add
        SqlUpdate delete = Ebean.createSqlUpdate("delete from problem_tags where problem_id = :problem_id");
        delete.setParameter("problem_id", id);
        delete.execute();
        insertTags(update);

        return ok();
    }

    private static Result findByState(ProblemState state) {
        List<Problem> problems = Problem.find.where()
                .eq("state", state)
                .findList();

        return ok(Json.toJson(problems));
    }

    public static Result find() {
        List<Problem> problems = Problem.find.all();

        return ok(Json.toJson(problems));
    }

    public static Result create() {
        JsonNode json = request().body().asJson();

        Problem problem = Json.fromJson(json, Problem.class);
        problem.date = new Date();
        problem.reporter = User.findByEmail(request().username());
        problem.state = ProblemState.OPEN;
        problem.save();
        insertTags(problem);


        return ok(Json.toJson(problem));
    }

    private static void insertTags(Problem problem) {
        // now save the tags
        if (problem.tags != null && !problem.tags.isEmpty()) {
            SqlUpdate update = Ebean.createSqlUpdate("insert into problem_tags (problem_id, tag) values (:problem_id, :tag)");
            for (String tag : problem.tags) {
                update.setParameter("problem_id", problem.id);
                update.setParameter("tag", tag);
                update.execute();
            }
        }
    }
}
