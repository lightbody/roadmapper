# --- !Ups

alter table problem add column customer_name varchar(255) not null default '-';
alter table problem add column customer_email varchar(255) not null default '-';

# --- !Downs

alter table problem drop column customer_name;
alter table problem drop column customer_email;