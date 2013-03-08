# --- !Ups

alter table feature add column team_id bigint;

alter table feature add constraint fk_feature_team_1 foreign key (team_id) references team (id);
create index ix_feature_team_1 on feature (team_id);

# --- !Downs

alter table feature drop constraint fk_feature_team_1;
alter table feature drop column team_id;