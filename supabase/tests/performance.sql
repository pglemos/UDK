create extension if not exists pgtap;

begin;
select plan(1);

select ok(
  not exists (
    with foreign_keys as (
      select
        con.oid as constraint_oid,
        con.conrelid,
        con.conname,
        con.conkey
      from pg_constraint con
      join pg_class rel on rel.oid = con.conrelid
      join pg_namespace namespace on namespace.oid = rel.relnamespace
      where con.contype = 'f'
        and namespace.nspname = 'public'
    ), fk_columns as (
      select
        foreign_key.constraint_oid,
        foreign_key.conrelid,
        foreign_key.conname,
        array_agg(key_column.attnum order by key_column.ordinality)::smallint[] as attnums
      from foreign_keys foreign_key
      cross join lateral unnest(foreign_key.conkey)
        with ordinality as key_column(attnum, ordinality)
      group by foreign_key.constraint_oid, foreign_key.conrelid, foreign_key.conname
    )
    select 1
    from fk_columns foreign_key
    where not exists (
      select 1
      from pg_index index_row
      where index_row.indrelid = foreign_key.conrelid
        and index_row.indisvalid
        and index_row.indisready
        and (index_row.indkey::smallint[])[0:cardinality(foreign_key.attnums)-1] = foreign_key.attnums
    )
  ),
  'every public foreign key has a matching index prefix'
);

select * from finish();
rollback;
