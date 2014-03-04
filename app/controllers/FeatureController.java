package controllers;

import com.avaje.ebean.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.google.common.collect.LinkedListMultimap;
import com.google.common.collect.Multimap;
import com.newrelic.api.agent.NewRelic;
import models.*;
import play.libs.Json;
import play.mvc.Controller;
import play.mvc.Result;
import play.mvc.Security;
import util.Qtr;

import java.sql.Timestamp;
import java.util.*;

@Security.Authenticated(Secured.class)
public class FeatureController extends Controller {

    public static final double WEIGHT_ENG_COST = 2;
    public static final double WEIGHT_REVENUE_BENEFIT = 3;
    public static final double WEIGHT_RETENTION_BENEFIT = 1.5;
    public static final double WEIGHT_POSITIONING_BENEFIT = 2.5;
    public static final double MAX_SCORE = WEIGHT_ENG_COST * Size.NONE.getCostWeight() +
            WEIGHT_REVENUE_BENEFIT * Size.XLARGE.getBenefitWeight() +
            WEIGHT_RETENTION_BENEFIT * Size.XLARGE.getBenefitWeight() +
            WEIGHT_POSITIONING_BENEFIT * Size.XLARGE.getBenefitWeight();

    public static Result getFeature(Long id) {
        Feature feature = Feature.find.byId(id);

        if (feature == null) {
            return notFound();
        }

        // get the tags
        feature.tags = new HashSet<>();
        SqlQuery query = Ebean.createSqlQuery("select tag from feature_tags where feature_id = :feature_id");
        query.setParameter("feature_id", id);
        List<SqlRow> list = query.findList();
        for (SqlRow row : list) {
            feature.tags.add(row.getString("tag"));
        }

        dressFeature(feature);
        captureCustomAttributes(feature);

        return ok(Json.toJson(feature));
    }

    @play.db.ebean.Transactional
    public static Result updateFeature(Long id) {
        // Only `PM`s can update features
        if (!Secured.checkRole(UserRole.PM)) {
            return forbidden();
        }

        Feature original = Feature.find.byId(id);

        if (original == null) {
            return notFound();
        }

        JsonNode json = request().body().asJson();
        Feature update = Json.fromJson(json, Feature.class);
        original.assignee = update.assignee;
        original.lastModified = new Timestamp(System.currentTimeMillis());
        original.lastModifiedBy = User.findByEmail(request().username());
        original.title = update.title;
        original.title = update.title;
        original.description = update.description;
        original.state = update.state;
        original.engineeringCost = update.engineeringCost;
        original.revenueBenefit = update.revenueBenefit;
        original.retentionBenefit = update.retentionBenefit;
        original.positioningBenefit = update.positioningBenefit;
        original.score = 0; // todo: do we even need this?
        original.team = update.team;
        original.quarter = update.quarter;

        original.save();

        // delete tag and then re-add
        SqlUpdate delete = Ebean.createSqlUpdate("delete from feature_tags where feature_id = :feature_id");
        delete.setParameter("feature_id", id);
        delete.execute();
        insertTags(update);

        Feature feature = dressFeature(original);
        captureCustomAttributes(feature);

        return ok(Json.toJson(feature));
    }

    public static Result bulkUpdate() {
        JsonNode json = request().body().asJson();
        FeatureBulkChange bulkChange = Json.fromJson(json, FeatureBulkChange.class);

        if (bulkChange.ids == null || bulkChange.ids.size() == 0) {
            return notFound();
        }

        NewRelic.addCustomParameter("bulk_change_count", bulkChange.ids.size());

        if (bulkChange.assignee != null) {
            NewRelic.addCustomParameter("bulk_change_assignee", bulkChange.assignee.email);

            if ("nobody".equals(bulkChange.assignee.email)) {
                Ebean.createSqlUpdate("update feature set assignee_email = null where id in (:ids)")
                        .setParameter("ids", bulkChange.ids)
                        .execute();
            } else {
                Ebean.createSqlUpdate("update feature set assignee_email = :assignee where id in (:ids)")
                        .setParameter("assignee", bulkChange.assignee.email)
                        .setParameter("ids", bulkChange.ids)
                        .execute();
            }
        }

        if (bulkChange.state != null) {
            NewRelic.addCustomParameter("bulk_change_state", bulkChange.state.name());

            Ebean.createSqlUpdate("update feature set state = :state where id in (:ids)")
                    .setParameter("state", bulkChange.state)
                    .setParameter("ids", bulkChange.ids)
                    .execute();
        }

        if (bulkChange.team != null) {
            NewRelic.addCustomParameter("bulk_change_team", bulkChange.team.id);
            if (bulkChange.team.name != null) {
                NewRelic.addCustomParameter("bulk_change_team_name", bulkChange.team.name);
            }

            if (bulkChange.team.id > 0) {
                Ebean.createSqlUpdate("update feature set team_id = :team where id in (:ids)")
                        .setParameter("team", bulkChange.team.id)
                        .setParameter("ids", bulkChange.ids)
                        .execute();
            } else {
                Ebean.createSqlUpdate("update feature set team_id = null where id in (:ids)")
                        .setParameter("ids", bulkChange.ids)
                        .execute();
            }
        }

        if (bulkChange.tags != null && !bulkChange.tags.isEmpty()) {
            NewRelic.addCustomParameter("bulk_change_tag_count", bulkChange.tags.size());

            // delete the tags in case they already exist...
            Ebean.createSqlUpdate("delete from feature_tags where feature_id in (:ids) and tag in (:tags)")
                    .setParameter("ids", bulkChange.ids)
                    .setParameter("tags", bulkChange.tags)
                    .execute();

            // .. and now re-insert them
            SqlUpdate tagInsert = Ebean.createSqlUpdate("insert into feature_tags (feature_id, tag) values (:id, :tag)");
            for (String tag : bulkChange.tags) {
                for (Long id : bulkChange.ids) {
                    tagInsert.setParameter("id", id).setParameter("tag", tag).execute();
                }
            }
        }

        return ok();
    }

    @play.db.ebean.Transactional
    public static Result bulkDelete() {
        JsonNode json = request().body().asJson();
        FeatureBulkChange bulkChange = Json.fromJson(json, FeatureBulkChange.class);

        if (bulkChange.ids == null || bulkChange.ids.size() == 0) {
            return notFound();
        }

        NewRelic.addCustomParameter("bulk_change_count", bulkChange.ids.size());

        for (Long id : bulkChange.ids) {
            deleteFeature(id, false);
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

        ExpressionList<Feature> where = Feature.find.where();
        String[] terms = query.split(",");

        int tagsSeen = 0;
        Multimap<Long, Boolean> tagMatchCount = LinkedListMultimap.create();
        Map<Long, Float> rankings = null;

        for (String term : terms) {
            if (term.startsWith("state:")) {
                FeatureState state = FeatureState.valueOf(term.substring(6).toUpperCase());
                where.eq("state", state);
            } else if (term.startsWith("title:")) {
                where.ilike("title", "%" + term.substring(6) + "%");
            } else if (term.startsWith("description:")) {
                where.ilike("description", "%" + term.substring(12) + "%");
            } else if (term.startsWith("createdBy:")) {
                where.ilike("creator.email", "%" + term.substring(10) + "%");
            } else if (term.startsWith("team:")) {
                where.ilike("team.name", "%" + term.substring(5) + "%");
            } else if (term.startsWith("quarter:")) {
                where.eq("quarter", Integer.parseInt(term.substring(8)));
            } else if (term.startsWith("assignedTo:")) {
                String str = term.substring(11);
                switch (str) {
                    case "null":
                        where.isNull("assignee_email");
                        break;
                    case "not-null":
                        where.isNotNull("assignee_email");
                        break;
                    default:
                        where.eq("assignee_email", str);
                        break;
                }
            } else if (term.startsWith("text:")) {
                rankings = new HashMap<>();
                String tsquery = term.substring(5);
                tsquery = tsquery.replaceAll("[\\|\\&\\!']", "-")
                        .replaceAll("[ \t\n\r]", "|");

                SqlQuery searchQuery = Ebean.createSqlQuery("select id, ts_rank_cd(textsearch, query) rank from (select id, setweight(to_tsvector(coalesce((select string_agg(tag, ' ') from feature_tags where feature_id = id),'')), 'A') || setweight(to_tsvector(coalesce(title,'')), 'B') || setweight(to_tsvector(coalesce(description,'')), 'C') as textsearch from feature) t, to_tsquery(:tsquery) query where textsearch @@ query order by rank desc");
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

                SqlQuery tagQuery = Ebean.createSqlQuery("select feature_id from feature_tags where tag = :tag");
                tagQuery.setParameter("tag", term);
                if (limit != null) {
                    tagQuery.setMaxRows(limit);
                }
                List<SqlRow> list = tagQuery.findList();
                for (SqlRow row : list) {
                    Long featureId = row.getLong("feature_id");
                    tagMatchCount.put(featureId, true);
                }
            }
        }

        if (tagsSeen > 0) {
            Set<Long> featureIds = new HashSet<>();
            for (Long featureId : tagMatchCount.keySet()) {
                if (tagMatchCount.get(featureId).size() == tagsSeen) {
                    featureIds.add(featureId);
                }
            }

            if (!featureIds.isEmpty()) {
                where.in("id", featureIds);
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
        where.join("creator");
        where.join("lastModifiedBy");

        if (limit != null) {
            where.setMaxRows(limit);
        }

        List<Feature> list = where.findList();

        if (rankings != null) {
            for (Feature feature : list) {
                feature.rank = rankings.get(feature.id);
            }
        }

        JsonNode jsonNode = Json.toJson(dressFeatures(list));

        return ok(jsonNode);
    }

    public static Feature dressFeature(Feature feature) {
        return dressFeatures(Collections.singletonList(feature)).get(0);
    }

    public static List<Feature> dressFeatures(List<Feature> features) {
        // first, get all the feature IDs so we can get all problems in a single query
        final Map<Long, Feature> featureMap = new HashMap<>();
        for (Feature feature : features) {
            featureMap.put(feature.id, feature);

            // also calculate a score
            double score = 0d;
            score += WEIGHT_ENG_COST * (feature.engineeringCost == null ? 0 : feature.engineeringCost.getCostWeight());
            score += WEIGHT_REVENUE_BENEFIT * (feature.revenueBenefit == null ? 0 : feature.revenueBenefit.getBenefitWeight());
            score += WEIGHT_RETENTION_BENEFIT * (feature.retentionBenefit == null ? 0 : feature.retentionBenefit.getBenefitWeight());
            score += WEIGHT_POSITIONING_BENEFIT * (feature.positioningBenefit == null ? 0 : feature.positioningBenefit.getBenefitWeight());

            // normalize to max score
            feature.score = (int) (score / MAX_SCORE * 100);
            feature.problemCount = 0;
            feature.problemRevenue = 0;
        }

        // now query all problems
        List<Problem> problems = Problem.find.where().in("feature_id", featureMap.keySet()).findList();
        for (Problem problem : problems) {
            Feature feature = featureMap.get(problem.feature.id);

            feature.problemCount++;
            if (problem.annualRevenue != null) {
                feature.problemRevenue += problem.annualRevenue;
            }
        }

        return features;
    }

    public static Result create() {
        // Only `PM`s can create features
        if (!Secured.checkRole(UserRole.PM)) {
            return forbidden();
        }

        JsonNode json = request().body().asJson();

        Feature feature = Json.fromJson(json, Feature.class);
        feature.lastModified = new Timestamp(System.currentTimeMillis());
        feature.creator = feature.lastModifiedBy = User.findByEmail(request().username());
        feature.state = FeatureState.OPEN;

        feature.save();
        insertTags(feature);
        dressFeature(feature);

        captureCustomAttributes(feature);

        return ok(Json.toJson(feature));
    }

    private static void insertTags(Feature feature) {
        // now save the tags
        if (feature.tags != null && !feature.tags.isEmpty()) {
            SqlUpdate update = Ebean.createSqlUpdate("insert into feature_tags (feature_id, tag) values (:feature_id, :tag)");
            for (String tag : feature.tags) {
                update.setParameter("feature_id", feature.id);
                update.setParameter("tag", tag);
                update.execute();
            }
        }
    }

    @play.db.ebean.Transactional
    public static Result deleteFeature(Long id) {
        return deleteFeature(id, true);
    }

    private static Result deleteFeature(Long id, boolean captureCustomAttributes) {
        // Only `PM`s can delete features
        if (!Secured.checkRole(UserRole.PM)) {
            return forbidden();
        }

        Feature feature = Feature.find.ref(id);
        if (captureCustomAttributes) {
            captureCustomAttributes(feature);
        }

        // Make sure the feature exists before doing any updates
        if (feature == null) {
            return notFound();
        }

        // Check the options on the delete
        JsonNode json = request().body().asJson();
        if (json != null && json.findPath("copyTagsToProblems").asBoolean()) {
            String copyFeatureTagsSql = "INSERT INTO problem_tags " +
                    "SELECT p.id, ft.tag " +
                    "FROM feature_tags ft, problem p " +
                    "WHERE ft.feature_id = :feature_id " +
                    "AND p.feature_id = :feature_id2 " +
                    "AND ft.tag NOT IN (SELECT tag FROM problem_tags WHERE problem_id = p.id)";
            SqlUpdate copyTags = Ebean.createSqlUpdate(copyFeatureTagsSql);
            copyTags.setParameter("feature_id", id);
            copyTags.setParameter("feature_id2", id);
            copyTags.execute();
        }
        Feature target = null;
        if (json != null && json.findPath("featureForProblems").asLong(-1) != -1) {
            // Move related problems to a new feature if the feature exists
            Long targetId = json.findPath("featureForProblems").asLong();
            target = Feature.find.ref(targetId);
        }
        if (target != null) {
            // Associate related problems to target
            SqlUpdate moveProblems = Ebean.createSqlUpdate("update problem set feature_id = :target_id where feature_id = :feature_id");
            moveProblems.setParameter("feature_id", id);
            moveProblems.setParameter("target_id", target.id);
            moveProblems.execute();
        }
        else {
            // Dissociate related problems
            SqlUpdate dissociateProblems = Ebean.createSqlUpdate("update problem set feature_id = NULL where feature_id = :feature_id");
            dissociateProblems.setParameter("feature_id", id);
            dissociateProblems.execute();
        }

        // Delete the feature's tags
        SqlUpdate deleteTags = Ebean.createSqlUpdate("delete from feature_tags where feature_id = :feature_id");
        deleteTags.setParameter("feature_id", id);
        deleteTags.execute();

        // Delete the feature
        feature.delete();

        return noContent();
    }

    private static void captureCustomAttributes(Feature feature) {
        NewRelic.addCustomParameter("feature_state", feature.state.name());

        if (feature.id != null) {
            NewRelic.addCustomParameter("feature", feature.id);
        }

        if (feature.problemCount != null) {
            NewRelic.addCustomParameter("feature_problem_count", feature.problemCount);
        }

        if (feature.problemRevenue != null) {
            NewRelic.addCustomParameter("feature_problem_arr", feature.problemRevenue);
        }

        if (feature.title != null) {
            NewRelic.addCustomParameter("feature_title", feature.title);
        }

        if (feature.quarter != null) {
            NewRelic.addCustomParameter("feature_quarter", Qtr.get(feature.quarter).label);
        }

        if (feature.score != null) {
            NewRelic.addCustomParameter("feature_score", feature.score);
        }

        if (feature.team != null) {
            NewRelic.addCustomParameter("feature_team", feature.team.id);
            if (feature.team.name != null) {
                NewRelic.addCustomParameter("feature_team_name", feature.team.name);
            }

        }


        captureCustomUserAttributes("feature_assignee", feature.assignee);
        captureCustomUserAttributes("feature_creator", feature.creator);
        captureCustomUserAttributes("feature_modifiedBy", feature.lastModifiedBy);

    }

    private static void captureCustomUserAttributes(String type, User user) {
        if (user == null) {
            return;
        }

        NewRelic.addCustomParameter(type, user.email);
        NewRelic.addCustomParameter(type + "_name", user.name);
    }
}
