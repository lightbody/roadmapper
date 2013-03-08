# --- !Ups

alter table feature drop constraint fk_feature_team_1;
alter table feature drop column team_id;

create table category (
  id                        bigint not null,
  name                      varchar(255),
  team_id                   bigint,
  constraint pk_category primary key (id))
;
alter table category add constraint fk_category_team_1 foreign key (team_id) references team (id);
create index ix_category_team_1 on category (team_id);

create sequence category_seq;

alter table feature add column category_id bigint;

alter table feature add constraint fk_feature_category_1 foreign key (category_id) references category (id);
create index ix_feature_category_1 on feature (category_id);

# --- !Downs

alter table feature drop constraint fk_feature_category_1;
alter table feature drop column category_id;

drop table if exists category cascade;
drop sequence if exists category_seq;

alter table feature add column team_id bigint;

alter table feature add constraint fk_feature_team_1 foreign key (team_id) references team (id);
create index ix_feature_team_1 on feature (team_id);
