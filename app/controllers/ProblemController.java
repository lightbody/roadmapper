package controllers;

import com.avaje.ebean.*;
import com.google.common.collect.LinkedListMultimap;
import com.google.common.collect.Multimap;
import models.Feature;
import models.Problem;
import models.ProblemState;
import models.User;
import org.codehaus.jackson.JsonNode;
import play.libs.Json;
import play.mvc.Controller;
import play.mvc.Result;
import play.mvc.Security;

import java.sql.Timestamp;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Security.Authenticated(Secured.class)
public class ProblemController extends Controller {

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
        original.lastModified = new Timestamp(System.currentTimeMillis());
        original.lastModifiedBy = User.findByEmail(request().username());
        original.description = update.description;
        original.customerName = update.customerName;
        original.customerEmail = update.customerEmail;
        original.customerCompany = update.customerCompany;
        original.accountId = update.accountId;
        original.annualRevenue = update.annualRevenue;
        original.url = update.url;
        original.state = update.state;
        if (update.feature == null) {
            original.feature = null;
        } else {
            original.feature = Feature.find.byId(update.feature.id);
        }

        original.save();

        // delete tag and then re-add
        SqlUpdate delete = Ebean.createSqlUpdate("delete from problem_tags where problem_id = :problem_id");
        delete.setParameter("problem_id", id);
        delete.execute();
        insertTags(update);

        return ok(Json.toJson(original));
    }

    public static Result find() {
        if (!request().queryString().containsKey("query")) {
            return ok();
        }

        String query = request().queryString().get("query")[0];
        if (query.equals("")) {
            return ok();
        }

        ExpressionList<Problem> where = Problem.find.where();
        String[] terms = query.split(",");

        int tagsSeen = 0;
        Multimap<Long, Boolean> tagMatchCount = LinkedListMultimap.create();

        for (String term : terms) {
            if (term.startsWith("state:")) {
                ProblemState state = ProblemState.valueOf(term.substring(6).toUpperCase());
                where.eq("state", state);
            } else if (term.startsWith("description:")) {
                where.ilike("description", "%" + term.substring(12) + "%");
            } else if (term.startsWith("company:")) {
                where.ilike("customerCompany", "%" + term.substring(8) + "%");
            } else if (term.startsWith("email:")) {
                where.ilike("customerEmail", "%" + term.substring(6) + "%");
            } else if (term.startsWith("user:")) {
                where.ilike("customerName", "%" + term.substring(5) + "%");
            } else if (term.startsWith("accountId:")) {
                try {
                    long accountId = Long.parseLong(term.substring(10));
                    where.eq("accountId", accountId);
                } catch (NumberFormatException e) {
                    // ignore
                }
            } else if (term.startsWith("featureId:")) {
                try {
                    long featureId = Long.parseLong(term.substring(10));
                    where.eq("feature.id", featureId);
                } catch (NumberFormatException e) {
                    // ignore
                }
            } else {
                // no prefix? assume a tag then
                tagsSeen++;

                SqlQuery tagQuery = Ebean.createSqlQuery("select problem_id from problem_tags where tag = :tag");
                tagQuery.setParameter("tag", term);
                List<SqlRow> list = tagQuery.findList();
                for (SqlRow row : list) {
                    Long problemId = row.getLong("problem_id");
                    tagMatchCount.put(problemId, true);
                }
            }
        }

        if (tagsSeen > 0) {
            System.out.println("tagsSeen = " + tagsSeen);
            Set<Long> problemIds = new HashSet<>();
            for (Long problemId : tagMatchCount.keySet()) {
                System.out.println("problemId  = " + problemId + "; count = " + tagMatchCount.get(problemId).size());
                if (tagMatchCount.get(problemId).size() == tagsSeen) {
                    problemIds.add(problemId);
                }
            }

            if (!problemIds.isEmpty()) {
                where.in("id", problemIds);
            } else {
                // nothing matched, game over man!
                return ok();
            }
        }

        // todo: not sure why this isn't helping with the N+1 query issue
        // where.join("reporter");
        return ok(Json.toJson(where.findList()));
    }

    @play.db.ebean.Transactional
    public static Result create() {
        JsonNode json = request().body().asJson();

        Problem problem = Json.fromJson(json, Problem.class);
        problem.date = new Date();
        problem.lastModified = new Timestamp(problem.date.getTime());
        problem.reporter = problem.lastModifiedBy = User.findByEmail(request().username());
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
