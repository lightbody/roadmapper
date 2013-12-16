package controllers;

import com.avaje.ebean.Ebean;
import com.avaje.ebean.SqlQuery;
import com.avaje.ebean.SqlRow;
import com.avaje.ebean.SqlUpdate;
import com.fasterxml.jackson.databind.JsonNode;
import models.*;
import play.libs.Json;
import play.mvc.Controller;
import play.mvc.Result;
import play.mvc.Security;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;

@Security.Authenticated(Secured.class)
public class TeamController extends Controller {
    public static final List<String> QUARTERS_AS_STRINGS;

    static {
        QUARTERS_AS_STRINGS = new CopyOnWriteArrayList<>();
        for (Quarter quarter : Quarter.values()) {
            QUARTERS_AS_STRINGS.add(quarter.toString());
        }
    }

    public static Result getAll() {
        List<Team> teams = Team.find.all();

        if (request().queryString().containsKey("detailed")) {
            Map<Long, Team> teamMap = new HashMap<>();

            // map teams to IDs
            for (Team team : teams) {
                teamMap.put(team.id, team);
                for (Quarter quarter : Quarter.values()) {
                    team.quarterStaffSummary.put(quarter, new StaffSummary());
                }
            }

            // look up staff levels
            SqlQuery query = Ebean.createSqlQuery("select team_id, quarter, count from team_staff_levels");
            List<SqlRow> list = query.findList();
            for (SqlRow row : list) {
                Team team = teamMap.get(row.getLong("team_id"));
                Quarter quarter = Quarter.valueOf(row.getString("quarter"));
                team.quarterStaffSummary.get(quarter).setStaffed(row.getInteger("count"));
            }

            updateStaffSummary(teamMap);
        }

        return ok(Json.toJson(teams));
    }

    private static void updateStaffSummary(Map<Long, Team> teamMap) {
        SqlQuery query = Ebean.createSqlQuery("select team_id, quarter, engineering_cost from feature where state != :released_state " +
                "and engineering_cost is not null and quarter in (:quarters) and team_id is not null");
        query.setParameter("released_state", FeatureState.RELEASED);
        query.setParameter("quarters", QUARTERS_AS_STRINGS);
        for (SqlRow row : query.findList()) {
            Long teamId = row.getLong("team_id");
            Quarter quarter = Quarter.valueOf(row.getString("quarter"));
            Size cost = Size.valueOf(row.getString("engineering_cost"));

            Team team = teamMap.get(teamId);
            if (team != null) {
                StaffSummary summary = team.quarterStaffSummary.get(quarter);
                // could be an old quarter we don't care about anymore
                if (summary != null) {
                    summary.addScheduledFeature(cost, team.utilization);
                }
            }
        }
    }

    @play.db.ebean.Transactional
    public static Result create() {
        JsonNode json = request().body().asJson();

        Team team = Json.fromJson(json, Team.class);
        team.save();

        return ok(Json.toJson(team));
    }

    @play.db.ebean.Transactional
    public static Result update(Long id) {
        Team original = Team.find.byId(id);

        if (original == null) {
            return notFound();
        }

        JsonNode json = request().body().asJson();
        Team update = Json.fromJson(json, Team.class);
        original.name = update.name;
        original.utilization = update.utilization;

        original.save();


        // we need to pull up the team utilization rates
        Map<Long, Team> teamMap = Collections.singletonMap(id, original);
        for (Quarter quarter : Quarter.values()) {
            original.quarterStaffSummary.put(quarter, new StaffSummary());
        }

        // look up staff levels
        SqlQuery query = Ebean.createSqlQuery("select quarter, count from team_staff_levels where team_id = :id");
        query.setParameter("id", id);
        List<SqlRow> list = query.findList();
        for (SqlRow row : list) {
            Quarter quarter = Quarter.valueOf(row.getString("quarter"));
            original.quarterStaffSummary.get(quarter).setStaffed(row.getInteger("count"));
        }

        updateStaffSummary(teamMap);

        return ok(Json.toJson(original));
    }

    public static Result updateStaffForQuarter(Long teamId, String quarter) {
        // format: {count: 123}
        JsonNode json = request().body().asJson();
        double count = json.get("count").asDouble();

        SqlUpdate sqlUpdate = Ebean.createSqlUpdate("update team_staff_levels set count = :count where team_id = :team_id and quarter = :quarter");
        sqlUpdate.setParameter("count", count);
        sqlUpdate.setParameter("team_id", teamId);
        sqlUpdate.setParameter("quarter", quarter);
        if (sqlUpdate.execute() == 0) {
            // gotta insert it
            sqlUpdate = Ebean.createSqlUpdate("insert into team_staff_levels (team_id, quarter, count) values (:team_id, :quarter, :count)");
            sqlUpdate.setParameter("count", count);
            sqlUpdate.setParameter("team_id", teamId);
            sqlUpdate.setParameter("quarter", quarter);
            sqlUpdate.execute();
        }

        StaffSummary summary = new StaffSummary(count);

        // return a populated StaffSummary object
        Team teamShell = new Team();
        teamShell.quarterStaffSummary.put(Quarter.valueOf(quarter), summary);
        updateStaffSummary(Collections.singletonMap(teamId, teamShell));

        return ok(Json.toJson(summary));
    }

}
