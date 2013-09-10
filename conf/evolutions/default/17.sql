# --- !Ups

alter table users add column first_login timestamp default now();
alter table users drop column password;

# --- !Downs

alter table users drop column first_login;
alter table users add column password varchar(255);