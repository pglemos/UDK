-- O kart é sorteado por sessão. O número legado do piloto deixa de ser
-- obrigatório e o cadastro passa a guardar os dados operacionais usados pela
-- organização no briefing, no lastro e no atendimento de emergência.
alter table public.drivers
  alter column number drop not null,
  add column if not exists whatsapp text,
  add column if not exists cpf text,
  add column if not exists birth_date date,
  add column if not exists age integer,
  add column if not exists email text,
  add column if not exists state text,
  add column if not exists weight_kg numeric(5,2),
  add column if not exists height_cm numeric(5,2),
  add column if not exists gender text,
  add column if not exists emergency_contact_name text,
  add column if not exists emergency_contact_phone text,
  add column if not exists medical_restrictions text,
  add column if not exists allergies text,
  add column if not exists medications text,
  add column if not exists operational_notes text,
  add column if not exists contact_authorized boolean not null default false,
  add column if not exists regulation_acknowledged boolean not null default false,
  add column if not exists participation_acknowledged boolean not null default false,
  add column if not exists image_authorized boolean not null default false;

alter table public.drivers
  drop constraint if exists drivers_age_valid_check,
  drop constraint if exists drivers_weight_valid_check,
  drop constraint if exists drivers_height_valid_check,
  drop constraint if exists drivers_state_valid_check,
  drop constraint if exists drivers_gender_valid_check;

alter table public.drivers
  add constraint drivers_age_valid_check
    check (age is null or age between 5 and 120),
  add constraint drivers_weight_valid_check
    check (weight_kg is null or weight_kg between 20 and 300),
  add constraint drivers_height_valid_check
    check (height_cm is null or height_cm between 80 and 250),
  add constraint drivers_state_valid_check
    check (state is null or state in (
      'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS',
      'MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC',
      'SP','SE','TO'
    )),
  add constraint drivers_gender_valid_check
    check (gender is null or gender in ('feminino','masculino','nao_binario','nao_informar'));

comment on column public.drivers.number is
  'Legado histórico. Não identifica o piloto; o kart é sorteado por sessão e fica em result_entries.kart_number.';
comment on column public.drivers.avatar_url is
  'URL pública da foto autorizada do piloto, armazenada no bucket public-media.';
