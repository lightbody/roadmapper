# --- Created by Ebean DDL
# To stop Ebean DDL generation, remove this comment and start using Evolutions

# --- !Ups

create table feature (
  id                        bigint not null,
  description               varchar(255),
  engineering_cost          varchar(7),
  operational_benefit       varchar(7),
  revenue_benefit           varchar(7),
  retention_benefit         varchar(7),
  positioning_benefit       varchar(7),
  score                     integer,
  quarter                   integer,
  constraint ck_feature_engineering_cost check (engineering_cost in ('NONE','TRIVIAL','SMALL','MEDIUM','LARGE','XLARGE')),
  constraint ck_feature_operational_benefit check (operational_benefit in ('NONE','TRIVIAL','SMALL','MEDIUM','LARGE','XLARGE')),
  constraint ck_feature_revenue_benefit check (revenue_benefit in ('NONE','TRIVIAL','SMALL','MEDIUM','LARGE','XLARGE')),
  constraint ck_feature_retention_benefit check (retention_benefit in ('NONE','TRIVIAL','SMALL','MEDIUM','LARGE','XLARGE')),
  constraint ck_feature_positioning_benefit check (positioning_benefit in ('NONE','TRIVIAL','SMALL','MEDIUM','LARGE','XLARGE')),
  constraint ck_feature_quarter check (quarter in (0,1,2,3,4,5,6)),
  constraint pk_feature primary key (id))
;

create table problem (
  id                        bigint not null,
  date                      timestamp,
  description               varchar(255),
  reporter_email            varchar(255),
  account_id                bigint,
  annual_revenue            integer,
  feature_id                bigint,
  constraint pk_problem primary key (id))
;

create table session (
  id                        varchar(255) not null,
  user_email                varchar(255),
  created                   timestamp,
  expires                   timestamp,
  constraint pk_session primary key (id))
;

create table team (
  id                        bigint not null,
  name                      varchar(255),
  constraint pk_team primary key (id))
;

create table users (
  email                     varchar(255) not null,
  name                      varchar(255),
  password                  varchar(255),
  constraint pk_users primary key (email))
;

create sequence feature_seq;

create sequence problem_seq;

create sequence session_seq;

create sequence team_seq;

create sequence users_seq;

alter table problem add constraint fk_problem_reporter_1 foreign key (reporter_email) references users (email) on delete restrict on update restrict;
create index ix_problem_reporter_1 on problem (reporter_email);
alter table problem add constraint fk_problem_feature_2 foreign key (feature_id) references feature (id) on delete restrict on update restrict;
create index ix_problem_feature_2 on problem (feature_id);
alter table session add constraint fk_session_user_3 foreign key (user_email) references users (email) on delete restrict on update restrict;
create index ix_session_user_3 on session (user_email);



# --- !Downs

SET REFERENTIAL_INTEGRITY FALSE;

drop table if exists feature;

drop table if exists problem;

drop table if exists session;

drop table if exists team;

drop table if exists users;

SET REFERENTIAL_INTEGRITY TRUE;

drop sequence if exists feature_seq;

drop sequence if exists problem_seq;

drop sequence if exists session_seq;

drop sequence if exists team_seq;

drop sequence if exists users_seq;

