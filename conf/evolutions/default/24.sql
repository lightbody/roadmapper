# --- !Ups

create table feature_comment (
  id                        bigint not null,
  feature_id                bigint not null,
  user_email                varchar(255),
  comment                   varchar(255),
  date                      timestamp,
  constraint pk_feature_comment primary key (id)
);

alter table feature_comment add constraint fk_feature_comment_user_1 foreign key (user_email) references users (email);
create index ix_feature_comment_user_1 on feature_comment (user_email);

alter table feature_comment add constraint fk_feature_comment_feature_id_2 foreign key (feature_id) references feature (id);
create index ix_feature_comment_feature_id_2 on feature_comment (feature_id);

create sequence feature_comment_seq;

# --- !Downs

drop table feature_comment;
drop sequence feature_comment_seq;