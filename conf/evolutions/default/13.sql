# --- !Ups

create table team_staff_levels (
  team_id                   bigint not null,
  quarter                   varchar(7) not null,
  count                     integer not null,
  constraint pk_team_staff_levels primary key (team_id, quarter))
;

alter table team_staff_levels add constraint fk_team_staff_levels_team_1 foreign key (team_id) references team (id);
create index ix_team_staff_levels_team_1 on team_staff_levels (team_id);
create index ix_team_staff_levels_quarter_2 on team_staff_levels (quarter);

# --- !Downs

drop table team_staff_levels;
