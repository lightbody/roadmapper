package controllers;

import com.avaje.ebean.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.google.common.collect.LinkedListMultimap;
import com.google.common.collect.Multimap;
import models.*;
import play.libs.Json;
import play.mvc.Controller;
import play.mvc.Result;
import play.mvc.Security;

import javax.persistence.PersistenceException;
import java.sql.Timestamp;
import java.util.*;

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
        if (update.assignee == null) {
            original.assignee = null;
        } else {
            original.assignee = User.findByEmail(update.assignee.email);
        }

        original.save();

        // delete tag and then re-add
        SqlUpdate delete = Ebean.createSqlUpdate("delete from problem_tags where problem_id = :problem_id");
        delete.setParameter("problem_id", id);
        delete.execute();
        insertTags(update);

        return ok(Json.toJson(original));
    }

    public static Result bulkUpdate() {
        JsonNode json = request().body().asJson();
        ProblemBulkChange bulkChange = Json.fromJson(json, ProblemBulkChange.class);

        if (bulkChange.ids == null || bulkChange.ids.size() == 0) {
            return notFound();
        }

        if (bulkChange.assignee != null) {
            Ebean.createSqlUpdate("update problem set assignee_email = :assignee where id in (:ids)")
                    .setParameter("ids", bulkChange.ids)
                    .setParameter("assignee", bulkChange.assignee.email)
                    .execute();
        }

        if (bulkChange.state != null) {
            Ebean.createSqlUpdate("update problem set state = :state where id in (:ids)")
                    .setParameter("state", bulkChange.state)
                    .setParameter("ids", bulkChange.ids)
                    .execute();
        }

        if (bulkChange.feature != null) {
            Ebean.createSqlUpdate("update problem set feature_id = :feature where id in (:ids)")
                    .setParameter("feature", bulkChange.feature.id)
                    .setParameter("ids", bulkChange.ids)
                    .execute();
        }

        if (bulkChange.tags != null) {
            SqlUpdate tagInsert = Ebean.createSqlUpdate("insert into problem_tags (problem_id, tag) values (:id, :tag)");
            for (String tag : bulkChange.tags) {
                for (Long id : bulkChange.ids) {
                    try {
                        tagInsert.setParameter("id", id).setParameter("tag", tag).execute();
                    } catch (PersistenceException e) {
                        // todo: this is lame, we should be smarter but I'm lazy
                        if (!e.getCause().getMessage().contains("duplicate key")) {
                            throw e;
                        }
                    }
                }
            }
        }

        return ok();
    }

    public static Result find() {
        if (!request().queryString().containsKey("query")) {
            return ok();
        }

        String query = request().queryString().get("query")[0];
        if (query.equals("")) {
            return ok();
        }

        Integer limit = null;
        if (request().queryString().get("limit") != null) {
            limit = Integer.parseInt(request().queryString().get("limit")[0]);
        }

        ExpressionList<Problem> where = Problem.find.where();
        String[] terms = query.split(",");

        int tagsSeen = 0;
        Multimap<Long, Boolean> tagMatchCount = LinkedListMultimap.create();
        Map<Long, Float> rankings = null;

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
            } else if (term.startsWith("assignedTo:")) {
                // todo: this t0 stuff is really ghetto and I'm only doing it because the same column
                // exists with problems and features and the advice on this thread doesn't seem to be working
                // https://groups.google.com/forum/#!topic/ebean/Ot9WtPNIhGI
                String str = term.substring(11);
                switch (str) {
                    case "null":
                        where.isNull("t0.assignee_email");
                        break;
                    case "not-null":
                        where.isNotNull("t0.assignee_email");
                        break;
                    default:
                        where.eq("t0.assignee_email", str);
                        break;
                }
            } else if (term.startsWith("accountId:")) {
                try {
                    long accountId = Long.parseLong(term.substring(10));
                    where.eq("accountId", accountId);
                } catch (NumberFormatException e) {
                    // ignore
                }
            } else if (term.startsWith("featureId:")) {
                String str = term.substring(10);

                switch (str) {
                    case "null":
                        where.isNull("feature.id");
                        break;
                    case "not-null":
                        where.isNotNull("feature.id");
                        break;
                    default:
                        try {
                            long featureId = Long.parseLong(str);
                            where.eq("feature.id", featureId);
                        } catch (NumberFormatException e) {
                            // ignore
                        }
                        break;
                }
            } else if (term.startsWith("text:")) {
                rankings = new HashMap<>();
                String tsquery = term.substring(4);
                tsquery = tsquery.replaceAll("[\\|\\&\\!'\\@\\#\\$\\%\\^\\*\\(\\)\\{\\[\\}\\]\\+\\=\\-\\_\\?\\;\\:\\'\"\\<\\>\\,\\.\\/]", "")
                        .replaceAll("[ \t\n\r]", "|");

                SqlQuery searchQuery = Ebean.createSqlQuery("select id, ts_rank_cd(textsearch, query) rank from (select id, setweight(to_tsvector(coalesce((select string_agg(tag, ' ') from problem_tags where problem_id = id),'')), 'A') || setweight(to_tsvector(coalesce(description,'')), 'B') as textsearch from problem) t, to_tsquery(:tsquery) query where textsearch @@ query order by rank desc");
                searchQuery.setParameter("tsquery", tsquery);
                if (limit != null) {
                    searchQuery.setMaxRows(limit);
                }
                List<SqlRow> list = searchQuery.findList();
                for (SqlRow row : list) {
                    rankings.put(row.getLong("id"), row.getFloat("rank"));
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

        if (rankings != null) {
            if (rankings.isEmpty()) {
                return ok();
            }

            where.in("id", rankings.keySet());
        }

        // fixes N+1 query problem
        where.join("reporter");
        where.join("lastModifiedBy");
        where.join("feature");

        if (limit != null) {
            where.setMaxRows(limit);
        }

        List<Problem> list = where.findList();

        if (rankings != null) {
            for (Problem problem : list) {
                problem.rank = rankings.get(problem.id);
            }
        }

        return ok(Json.toJson(list));
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
