package util;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import models.Team;

import java.io.IOException;

public class TeamJsonDeserializer extends JsonDeserializer<Team> {
    @Override
    public Team deserialize(JsonParser jsonParser, DeserializationContext deserializationContext) throws IOException, JsonProcessingException {
        return Team.find.byId(jsonParser.getLongValue());
    }
}
