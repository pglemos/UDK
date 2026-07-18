create extension if not exists pgtap;

begin;
select plan(10);
select has_table('public','championships');
select has_table('public','seasons');
select has_table('public','categories');
select has_table('public','stages');
select has_table('public','drivers');
select has_table('public','registrations');
select has_table('public','results');
select has_table('public','standings');
select has_table('public','penalties');
select has_table('public','endurance_teams');
select * from finish();
rollback;
