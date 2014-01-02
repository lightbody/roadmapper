# --- !Ups

alter table users add column role varchar(7) not null default 'USER';
create index ix_users_role on users (role);

alter table users add column last_modified timestamp not null default now();


# --- !Downs

alter table users drop column role;
alter table users drop column last_modified;