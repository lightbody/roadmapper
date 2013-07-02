# --- !Ups

alter table problem alter column description type TEXT;

# --- !Downs

alter table problem alter column description type varchar(255);
