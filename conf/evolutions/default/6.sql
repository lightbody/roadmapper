# --- !Ups

create table problem_tags (
  problem_id                bigint not null,
  tag                       varchar(255) not null,
  constraint pk_problem_tags primary key (problem_id, tag))
;

alter table problem_tags add constraint fk_problem_tags_problem_1 foreign key (problem_id) references problem (id);
create index ix_problem_tags_problem_1 on problem_tags (problem_id);
create index ix_problem_tags_tag_2 on problem_tags (tag);

create table feature_tags (
  feature_id                bigint not null,
  tag                       varchar(255) not null,
  constraint pk_feature_tags primary key (feature_id, tag))
;

alter table feature_tags add constraint fk_feature_tags_problem_1 foreign key (feature_id) references feature (id);
create index ix_feature_tags_problem_1 on feature_tags (feature_id);
create index ix_feature_tags_tag_2 on feature_tags (tag);

drop table if exists tags cascade;

# --- !Downs

drop table if exists problem_tags cascade;

drop table if exists feature_tags cascade;

create table tags (
  tag                       varchar(255) not null,
  constraint pk_tags primary key (tag))
;
