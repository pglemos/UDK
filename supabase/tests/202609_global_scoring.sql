create extension if not exists pgtap;
begin;
select plan(8);

select ok((select count(*)=1 from public.points_rules rule join public.seasons season on season.id=rule.season_id join public.championships c on c.id=season.championship_id where c.slug='udk' and season.year=2026 and rule.event_format='regular' and rule.category_id is null and rule.active and rule.deleted_at is null), 'one active global regular rule');
select is((select (rule.position_points->>'42')::integer from public.points_rules rule join public.seasons season on season.id=rule.season_id join public.championships c on c.id=season.championship_id where c.slug='udk' and season.year=2026 and rule.event_format='regular' and rule.category_id is null and rule.active order by rule.version desc limit 1),1,'regular P42 is one point');
select is((select (rule.position_points->>'1')::integer from public.points_rules rule join public.seasons season on season.id=rule.season_id join public.championships c on c.id=season.championship_id where c.slug='udk' and season.year=2026 and rule.event_format='endurance' and rule.category_id is null and rule.active order by rule.version desc limit 1),150,'Endurance P1 is 150');
select is((select best_pit_points::integer from public.points_rules rule join public.seasons season on season.id=rule.season_id join public.championships c on c.id=season.championship_id where c.slug='udk' and season.year=2026 and rule.event_format='endurance' and rule.category_id is null and rule.active order by rule.version desc limit 1),10,'Endurance best pit is 10');
select ok((select count(*) from public.result_entries entry join public.results result on result.id=entry.result_id where result.external_racing_id=2026090801 and entry.fastest_lap and entry.driver_id=(select id from public.drivers where slug='lucas-rabelo' limit 1))=1,'Lucas has fastest-lap bonus');
select ok((select count(*) from public.result_entries entry join public.results result on result.id=entry.result_id where result.external_racing_id=2026090801 and entry.position>0)=13,'global positions persisted');
select ok((select count(*) from public.result_entries entry where entry.status='nc' and entry.points=0)>=1,'NC receives no position points');
select ok((select count(*) from public.standings standing join public.seasons season on season.id=standing.season_id join public.championships c on c.id=season.championship_id where c.slug='udk' and season.year=2026 and standing.status in ('official','rectified'))>0,'standings recalculated');
select * from finish();
rollback;
