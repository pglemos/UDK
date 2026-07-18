create extension if not exists pgtap;

begin;
select plan(10);
select has_table('public','championships','championships table exists');
select has_table('public','seasons','seasons table exists');
select has_table('public','categories','categories table exists');
select has_table('public','stages','stages table exists');
select has_table('public','drivers','drivers table exists');
select has_table('public','registrations','registrations table exists');
select has_table('public','results','results table exists');
select has_table('public','standings','standings table exists');
select has_table('public','penalties','penalties table exists');
select has_table('public','endurance_teams','endurance teams table exists');
select * from finish();
rollback;
