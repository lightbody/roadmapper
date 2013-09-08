# --- !Ups

alter table team add column utilization numeric(100,1) default 40;

# --- !Downs

alter table team drop column utilization;