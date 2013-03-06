package controllers;

import models.Feature;
import org.codehaus.jackson.JsonNode;
import play.libs.Json;
import play.mvc.Controller;
import play.mvc.Result;
import play.mvc.Security;

import java.util.List;

@Security.Authenticated(Secured.class)
public class FeatureController extends Controller {
    public static Result getAll() {
        List<Feature> features = Feature.find.all();
        return ok(Json.toJson(features));
    }

    public static Result create() {
        JsonNode json = request().body().asJson();

        Feature feature = Json.fromJson(json, Feature.class);
        feature.save();

        return ok();
    }

}
