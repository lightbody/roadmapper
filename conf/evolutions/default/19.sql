# --- !Ups

update feature set state = 'OPEN' where state != 'RELEASED';

# --- !Downs

