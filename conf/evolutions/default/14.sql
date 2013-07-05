# --- !Ups

delete from feature_tags;
delete from feature;
alter table feature drop constraint ck_feature_quarter;

alter table feature alter column quarter type varchar(7);

# --- !Downs

alter table feature alter column quarter type integer using 1;
