import com.fasterxml.jackson.databind.node.ObjectNode;
import play.GlobalSettings;
import play.libs.F;
import play.libs.Json;
import play.mvc.Http;
import play.mvc.SimpleResult;

import static play.mvc.Results.internalServerError;

public class Global extends GlobalSettings {
    @Override
    public play.libs.F.Promise<play.mvc.SimpleResult> onError(Http.RequestHeader requestHeader, Throwable throwable) {
        // todo: this seems weird
        final ObjectNode json = Json.newObject();
        json.put("globalError", "unexpectedError");

        return F.Promise.promise(new F.Function0<SimpleResult>() {
            @Override
            public SimpleResult apply() throws Throwable {
                return internalServerError(json);
            }
        });
    }
}
