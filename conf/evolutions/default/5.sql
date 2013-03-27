# --- !Ups

create table tags (
  tag                       varchar(255) not null,
  constraint pk_tags primary key (tag))
;

# --- !Downs

drop table if exists tags cascade;
