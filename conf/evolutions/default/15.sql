# --- !Ups

alter table team_staff_levels alter column count type numeric(100,1);

# --- !Downs

alter table team_staff_levels alter column count type integer;