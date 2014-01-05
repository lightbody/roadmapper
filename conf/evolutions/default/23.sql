# --- !Ups

update problem set state = 'OPEN' where state = 'ASSIGNED';

# --- !Downs

