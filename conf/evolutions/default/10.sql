# --- !Ups

alter table problem add column last_modified timestamp;
alter table problem add column last_modified_by_email varchar(255);

alter table problem add constraint fk_problem_last_modified_by_email_3 foreign key (last_modified_by_email) references users (email);
create index ix_problem_last_modified_by_email_3 on problem (last_modified_by_email);

# --- !Downs

alter table problem drop column last_modified;
alter table problem drop column last_modified_by_email;
