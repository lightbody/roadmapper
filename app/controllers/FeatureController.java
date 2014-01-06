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

        return ok(Json.toJson(dressFeature(feature)));
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

        return ok(Json.toJson(dressFeature(original)));
    }


    public static Result bulkUpdate() {
        JsonNode json = request().body().asJson();
        FeatureBulkChange bulkChange = Json.fromJson(json, FeatureBulkChange.class);

        if (bulkChange.ids == null || bulkChange.ids.size() == 0) {
            return notFound();
        }

        if (bulkChange.assignee != null) {
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
            Ebean.createSqlUpdate("update feature set state = :state where id in (:ids)")
                    .setParameter("state", bulkChange.state)
                    .setParameter("ids", bulkChange.ids)
                    .execute();
        }

        if (bulkChange.team != null) {
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

        if (bulkChange.tags != null) {
            SqlUpdate tagInsert = Ebean.createSqlUpdate("insert into feature_tags (feature_id, tag) values (:id, :tag)");
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

    @play.db.ebean.Transactional
    public static Result bulkDelete() {
        JsonNode json = request().body().asJson();
        FeatureBulkChange bulkChange = Json.fromJson(json, FeatureBulkChange.class);

        if (bulkChange.ids == null || bulkChange.ids.size() == 0) {
            return notFound();
        }

        for (Long id : bulkChange.ids) {
            deleteFeature(id);
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
                where.eq("assignee_email", term.substring(11));
            } else if (term.startsWith("text:")) {
                rankings = new HashMap<>();
                String tsquery = term.substring(4);
                tsquery = tsquery.replaceAll("[\\|\\&\\!'\\@\\#\\$\\%\\^\\*\\(\\)\\{\\[\\}\\]\\+\\=\\-\\_\\?\\;\\:\\'\"\\<\\>\\,\\.\\/]", "")
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

        return ok(Json.toJson(dressFeature(feature)));
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
        // Only `PM`s can delete features
        if (!Secured.checkRole(UserRole.PM)) {
            return forbidden();
        }

        Feature feature = Feature.find.ref(id);

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
}
