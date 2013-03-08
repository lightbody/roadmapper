package util;

import models.Team;
import org.codehaus.jackson.JsonParser;
import org.codehaus.jackson.JsonProcessingException;
import org.codehaus.jackson.map.DeserializationContext;
import org.codehaus.jackson.map.JsonDeserializer;

import java.io.IOException;

public class TeamJsonDeserializer extends JsonDeserializer<Team> {
    @Override
    public Team deserialize(JsonParser jsonParser, DeserializationContext deserializationContext) throws IOException, JsonProcessingException {
        return Team.find.byId(jsonParser.getLongValue());
    }
}
