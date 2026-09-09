update public.results
set title = case external_racing_id
  when 2026090801 then 'Resultado homologado - 2ª etapa - Ultra Insanos - Corrida 1'
  when 2026090802 then 'Resultado homologado - 2ª etapa - Ultra Insanos - Corrida 2'
  when 2026090803 then 'Resultado homologado - 2ª etapa - Ultras Rápidos - Corrida 1'
  when 2026090804 then 'Resultado homologado - 2ª etapa - Ultras Rápidos - Corrida 2'
end,
updated_at = now()
where external_racing_id between 2026090801 and 2026090804
  and deleted_at is null;
