# --- !Ups

alter table problem add column state varchar(8) not null default 'OPEN';

alter table problem add constraint ck_problem_state check (state in ('OPEN','RESEARCH','BUG','DUPE','WONT_FIX','CLOSED','NOTIFIED'));

# --- !Downs

alter table problem drop constraint ck_problem_state;
alter table problem drop column state;