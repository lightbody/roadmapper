# --- !Ups

alter table feature add column assignee_email varchar(255) null;
alter table feature add constraint fk_feature_assignee_2 foreign key (assignee_email) references users (email);
create index ix_feature_assignee_4 on feature (assignee_email);


# --- !Downs

alter table feature drop column assignee_email;