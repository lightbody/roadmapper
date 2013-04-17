# --- !Ups

alter table problem add column customer_company varchar(255) not null default '-';
alter table problem drop constraint ck_problem_state;

# --- !Downs

alter table problem drop column customer_company;
alter table problem add constraint ck_problem_state check (state in ('OPEN','RESEARCH','BUG','DUPE','WONT_FIX','CLOSED','NOTIFIED'));
