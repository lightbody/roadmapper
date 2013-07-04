# --- !Ups

update problem set feature_id = null;
delete from feature;

alter table feature add column title varchar(255) not null;

alter table feature alter column description type TEXT;

alter table feature add column creator_email varchar(255) not null;
alter table feature add constraint fk_feature_creator_email_2 foreign key (creator_email) references users (email);
create index ix_feature_creator_email_2 on feature (creator_email);

alter table feature add column last_modified timestamp not null;

alter table feature add column last_modified_by_email varchar(255) not null;
alter table feature add constraint fk_feature_last_modified_by_email_3 foreign key (last_modified_by_email) references users (email);
create index ix_feature_last_modified_by_email_3 on feature (last_modified_by_email);

alter table feature add column state varchar(11) not null default 'OPEN';
alter table feature add constraint ck_feature_state check (state in ('OPEN','RESEARCHING','PLANNED','STALLED','COMMITTED','STARTED','RELEASED'));

alter table feature drop column operational_benefit;

alter table feature add column team_id bigint;
alter table feature add constraint fk_feature_team_1 foreign key (team_id) references team (id);
create index ix_feature_team_1 on feature (team_id);

alter table feature drop column category_id;

drop table category;
drop sequence category_seq;

# --- !Downs

alter table feature drop column title;

alter table feature alter column description type varchar(255);

alter table feature drop column creator_email;

alter table feature drop column last_modified;

alter table feature drop column last_modified_by_email;

alter table feature drop constraint ck_feature_state;
alter table feature drop column state;

alter table feature add column operational_benefit varchar(7);
alter table feature add constraint ck_feature_operational_benefit check (operational_benefit in ('NONE','TRIVIAL','SMALL','MEDIUM','LARGE','XLARGE'));

alter table feature drop constraint fk_feature_team_1;
alter table feature drop column team_id;

create table category (
  id                        bigint not null,
  name                      varchar(255),
  team_id                   bigint,
  constraint pk_category primary key (id))
;
alter table category add constraint fk_category_team_1 foreign key (team_id) references team (id);
create index ix_category_team_1 on category (team_id);
create sequence category_seq;

alter table feature add column category_id bigint;
alter table feature add constraint fk_feature_category_1 foreign key (category_id) references category (id);
create index ix_feature_category_1 on feature (category_id);
