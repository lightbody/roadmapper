import org.codehaus.jackson.node.ObjectNode;
import play.GlobalSettings;
import play.libs.Json;
import play.mvc.Http;
import play.mvc.Result;

import static play.mvc.Results.internalServerError;

public class Global extends GlobalSettings {
    @Override
    public Result onError(Http.RequestHeader requestHeader, Throwable throwable) {
        // todo: this seems weird
        ObjectNode json = Json.newObject();
        json.put("globalError", "unexpectedError");

        return internalServerError(json);
    }
}
