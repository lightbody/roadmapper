package controllers;

import com.avaje.ebean.Ebean;
import com.avaje.ebean.SqlQuery;
import com.avaje.ebean.SqlRow;
import com.avaje.ebean.SqlUpdate;
import models.FeatureState;
import models.ProblemState;
import models.TagSummary;
import play.libs.Json;
import play.mvc.Controller;
import play.mvc.Result;
import play.mvc.Security;

import java.util.*;

@Security.Authenticated(Secured.class)
public class TagController extends Controller {
    public static Result summaries() {
        SqlQuery q;
        List<SqlRow> rows;
        Map<String, TagSummary> map = new HashMap<>();

        String assignee = request().getQueryString("assignee");

        // get initial set of unresolved tags to start
        q = Ebean.createSqlQuery("select pt.tag, sum(annual_revenue) from problem_tags pt, problem p " +
                "where pt.problem_id = p.id and p.state in (:states) " +
                (assignee != null ? "and p.assignee_email = :assignee " : "") +
                "group by pt.tag order by count(*) desc");
        q.setParameter("states", ProblemState.unresolvedStates());
        if (assignee != null) {
            q.setParameter("assignee", assignee);
        }
        rows = q.findList();
        for (SqlRow row : rows) {
            String tag = row.getString("tag");
            Double unresolvedArr = row.getDouble("sum");
            map.put(tag, new TagSummary(tag, unresolvedArr));
        }

        // now weave in problem counts
        q = Ebean.createSqlQuery("select pt.tag, p.state, count(*) from problem_tags pt, problem p" +
                " where pt.problem_id = p.id and p.state in (:states)" +
                (assignee != null ? "and p.assignee_email = :assignee " : "") +
                " group by pt.tag, p.state" +
                " order by count(*) desc");
        q.setParameter("states", ProblemState.unresolvedStates());
        if (assignee != null) {
            q.setParameter("assignee", assignee);
        }
        rows = q.findList();
        for (SqlRow row : rows) {
            String tag = row.getString("tag");
            ProblemState state = ProblemState.valueOf(row.getString("state"));
            int count = row.getInteger("count");
            TagSummary summary = map.get(tag);

            switch (state) {
                case OPEN:
                    summary.openProblems = count;
                    break;
                case REVIEWED:
                    summary.reviewedProblems = count;
                    break;
            }
        }

        // now weave in feature counts
        q = Ebean.createSqlQuery("select ft.tag, f.state, count(*) from feature_tags ft, feature f " +
                " where ft.feature_id = f.id and f.state not in (:states)" +
                (assignee != null ? "and f.assignee_email = :assignee " : "") +
                " group by ft.tag, f.state order by count(*) desc");
        q.setParameter("states", FeatureState.resolvedStates());
        if (assignee != null) {
            q.setParameter("assignee", assignee);
        }
        rows = q.findList();
        for (SqlRow row : rows) {
            String tag = row.getString("tag");
            FeatureState state = FeatureState.valueOf(row.getString("state"));
            int count = row.getInteger("count");
            TagSummary summary = map.get(tag);
            if (summary == null) {
                summary = new TagSummary(tag, null);
                map.put(tag, summary);
            }

            switch (state) {
                case OPEN:
                    summary.openFeatures = count;
                    break;
            }
        }

        return ok(Json.toJson(map.values()));
    }

    public static Result deleteTag(String tag) {
        Ebean.createSqlUpdate("delete from problem_tags where tag = :tag").setParameter("tag", tag).execute();
        Ebean.createSqlUpdate("delete from feature_tags where tag = :tag").setParameter("tag", tag).execute();

        return ok();
    }

    public static Result editTag(String tag) {
        String newTag = request().body().asJson().get("tag").textValue();
        if (tag.equals(newTag)) {
            // nothing to do!
            return ok();
        }

        SqlQuery query;
        SqlUpdate update;
        List<SqlRow> rows;

        // get features that have either tag
        Set<Long> featureIds = new HashSet<>();
        query = Ebean.createSqlQuery("select distinct feature_id from feature_tags where tag = :old or tag = :new");
        query.setParameter("old", tag);
        query.setParameter("new", newTag);
        rows = query.findList();
        for (SqlRow row : rows) {
            featureIds.add(row.getLong("feature_id"));
        }

        // now delete all the feature tags for both
        update = Ebean.createSqlUpdate("delete from feature_tags where tag = :old or tag = :new");
        update.setParameter("old", tag);
        update.setParameter("new", newTag);
        update.execute();

        // now insert the new tag for all features
        update = Ebean.createSqlUpdate("insert into feature_tags (feature_id, tag) values (:feature_id, :tag)");
        for (Long featureId : featureIds) {
            update.setParameter("feature_id", featureId);
            update.setParameter("tag", newTag);
            update.execute();
        }

        // get problems that have either tag
        Set<Long> problemIds = new HashSet<>();
        query = Ebean.createSqlQuery("select distinct problem_id from problem_tags where tag = :old or tag = :new");
        query.setParameter("old", tag);
        query.setParameter("new", newTag);
        rows = query.findList();
        for (SqlRow row : rows) {
            problemIds.add(row.getLong("problem_id"));
        }

        // now delete all the problems tags for both
        update = Ebean.createSqlUpdate("delete from problem_tags where tag = :old or tag = :new");
        update.setParameter("old", tag);
        update.setParameter("new", newTag);
        update.execute();

        // now insert the new tag for all problems
        update = Ebean.createSqlUpdate("insert into problem_tags (problem_id, tag) values (:problem_id, :tag)");
        for (Long problemId : problemIds) {
            update.setParameter("problem_id", problemId);
            update.setParameter("tag", newTag);
            update.execute();
        }



        System.out.println("EDIT: " + tag + " -> " + newTag);
        return ok();
    }

    public static Result search(String query) {
        SqlQuery q = Ebean.createSqlQuery("select tag from (select tag, count(*) from problem_tags where tag like :like group by tag union select tag, count(*) from feature_tags where tag like :like group by tag) t group by tag order by sum(count) desc limit 10");
        q.setParameter("like", "%" + query + "%");
        List<SqlRow> rows = q.findList();
        Set<String> tags = new HashSet<>();
        for (SqlRow row : rows) {
            tags.add(row.getString("tag"));
        }

        return ok(Json.toJson(tags));
    }
}
