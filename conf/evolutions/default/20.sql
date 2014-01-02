# --- !Ups

alter table problem add column assignee_email varchar(255) null;
alter table problem add constraint fk_problem_assignee_2 foreign key (assignee_email) references users (email);
create index ix_problem_assignee_4 on problem (assignee_email);


# --- !Downs

alter table problem drop column assignee_email;