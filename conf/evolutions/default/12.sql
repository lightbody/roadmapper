# --- !Ups

alter table feature drop column score;

# --- !Downs

alter table feature add column score integer;
