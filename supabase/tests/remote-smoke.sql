-- Gerçek Supabase projesinde en kritik güvenlik kurallarını dener. Hiçbir veri bırakmaz.
-- Çalıştırma: supabase db query --linked -f supabase/tests/remote-smoke.sql
-- Sonuç bilinçli olarak bir hata mesajı içinde döner ("SMOKE ..."): hata, blokta yapılan
-- her şeyin (test kullanıcıları, maçlar, oda) otomatik olarak geri alınmasını sağlar.
do $smoke$
declare
  melih uuid := gen_random_uuid();
  burak uuid := gen_random_uuid();
  yabanci uuid := gen_random_uuid();
  v_league bigint;
  v_season bigint;
  v_home bigint;
  v_away bigint;
  v_match bigint;
  v_past_match bigint;
  v_future_match bigint;
  v_room uuid;
  v_new_room uuid;
  v_new_code text;
  v_status text;
  v_count int;
  v_count_after int;
  passed text[] := '{}';
  failed text[] := '{}';
begin
  -- Hazırlık (yönetici yetkisiyle) ----------------------------------------------
  insert into auth.users (id, aud, role, email, raw_user_meta_data)
  values
    (melih, 'authenticated', 'authenticated', 'smoke-melih@example.invalid', '{"username":"smoke_melih","accepted_terms":true}'),
    (burak, 'authenticated', 'authenticated', 'smoke-burak@example.invalid', '{"username":"smoke_burak","accepted_terms":true}'),
    (yabanci, 'authenticated', 'authenticated', 'smoke-yabanci@example.invalid', '{"username":"smoke_yabanci","accepted_terms":true}');

  select count(*) into v_count from public.profiles where id in (melih, burak, yabanci);
  if v_count = 3 then
    passed := passed || 'kayıtta profil oluşuyor'::text;
  else
    failed := failed || 'kayıtta profil oluşuyor'::text;
  end if;

  insert into public.leagues (name, country, provider, provider_id)
    values ('Smoke', 'TR', 'smoke', 'l1') returning id into v_league;
  insert into public.seasons (league_id, name, provider_season)
    values (v_league, 'S', '1') returning id into v_season;
  insert into public.teams (name, short_name, provider, provider_id)
    values ('A', 'A', 'smoke', 'a') returning id into v_home;
  insert into public.teams (name, short_name, provider, provider_id)
    values ('B', 'B', 'smoke', 'b') returning id into v_away;
  insert into public.matches (season_id, round, home_team_id, away_team_id, kickoff_at, provider, provider_id)
    values (v_season, 1, v_home, v_away, now() + interval '1 hour', 'smoke', 'm1')
    returning id into v_match;
  insert into public.matches (season_id, round, home_team_id, away_team_id, kickoff_at, provider, provider_id)
    values (v_season, 1, v_home, v_away, now() - interval '5 minutes', 'smoke', 'm2')
    returning id into v_past_match;

  insert into public.rooms (name, code, owner_id) values ('Smoke Oda', 'SMK001', melih)
    returning id into v_room;
  insert into public.room_members (room_id, user_id) values (v_room, melih), (v_room, burak);
  insert into public.predictions (user_id, match_id, home_goals, away_goals) values (burak, v_match, 2, 1);

  -- 1) Maç başladıktan sonra tahmin oluşturulamaz -------------------------------
  begin
    insert into public.predictions (user_id, match_id, home_goals, away_goals)
      values (melih, v_past_match, 1, 0);
    failed := failed || 'maç başladıktan sonra tahmin reddi'::text;
  exception when others then
    if sqlerrm like '%tahmin süresi doldu%' then
      passed := passed || 'maç başladıktan sonra tahmin reddi'::text;
    else
      failed := failed || ('maç başladıktan sonra tahmin reddi: ' || sqlerrm);
    end if;
  end;

  -- 2) Uygulama tahmin tablosuna doğrudan yazamaz ---------------------------------
  begin
    set local role authenticated;
    perform set_config('request.jwt.claims', json_build_object('sub', melih, 'role', 'authenticated')::text, true);
    insert into public.predictions (user_id, match_id, home_goals, away_goals) values (melih, v_match, 1, 0);
    reset role;
    failed := failed || 'doğrudan tahmin yazma reddi'::text;
  exception when insufficient_privilege then
    passed := passed || 'doğrudan tahmin yazma reddi'::text;
  end;

  -- 3) Kullanıcı kendi puanını değiştiremez ----------------------------------------
  begin
    set local role authenticated;
    perform set_config('request.jwt.claims', json_build_object('sub', burak, 'role', 'authenticated')::text, true);
    update public.predictions set points = 99 where user_id = burak;
    reset role;
    failed := failed || 'puan değiştirme reddi'::text;
  exception when insufficient_privilege then
    passed := passed || 'puan değiştirme reddi'::text;
  end;

  -- 4) Kullanıcı maç sonucunu değiştiremez -----------------------------------------
  begin
    set local role authenticated;
    perform set_config('request.jwt.claims', json_build_object('sub', melih, 'role', 'authenticated')::text, true);
    update public.matches set home_score = 5 where id = v_match;
    reset role;
    failed := failed || 'maç sonucu değiştirme reddi'::text;
  exception when insufficient_privilege then
    passed := passed || 'maç sonucu değiştirme reddi'::text;
  end;

  -- 5) Başkasının rolü okunamaz -----------------------------------------------------
  begin
    set local role authenticated;
    perform set_config('request.jwt.claims', json_build_object('sub', melih, 'role', 'authenticated')::text, true);
    perform role from public.profiles limit 1;
    reset role;
    failed := failed || 'rol okuma reddi'::text;
  exception when insufficient_privilege then
    passed := passed || 'rol okuma reddi'::text;
  end;

  -- 6) Oda arkadaşının tahmini maçtan önce görünmez, sonra görünür; yabancıya hiç görünmez
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', melih, 'role', 'authenticated')::text, true);
  select count(*) into v_count from public.predictions where user_id = burak;
  reset role;
  if v_count = 0 then
    passed := passed || 'maçtan önce oda arkadaşının tahmini gizli'::text;
  else
    failed := failed || 'maçtan önce oda arkadaşının tahmini gizli'::text;
  end if;

  update public.matches set kickoff_at = now() - interval '1 minute' where id = v_match;

  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', melih, 'role', 'authenticated')::text, true);
  select count(*) into v_count from public.predictions where user_id = burak;
  reset role;
  if v_count = 1 then
    passed := passed || 'maç başlayınca oda arkadaşının tahmini görünür'::text;
  else
    failed := failed || 'maç başlayınca oda arkadaşının tahmini görünür'::text;
  end if;

  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', yabanci, 'role', 'authenticated')::text, true);
  select count(*) into v_count from public.predictions where user_id = burak;
  reset role;
  if v_count = 0 then
    passed := passed || 'odada olmayana tahmin gizli'::text;
  else
    failed := failed || 'odada olmayana tahmin gizli'::text;
  end if;

  -- 7) Oda yalnızca üyelere görünür -----------------------------------------------------
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', yabanci, 'role', 'authenticated')::text, true);
  select count(*) into v_count from public.rooms;
  reset role;
  if v_count = 0 then
    passed := passed || 'oda yabancıya gizli'::text;
  else
    failed := failed || 'oda yabancıya gizli'::text;
  end if;

  -- 8) Görünen ad: kendininki değişir, başkasınınki değişmez ----------------------------
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', melih, 'role', 'authenticated')::text, true);
  update public.profiles set display_name = 'Smoke Hacked' where id = burak;
  get diagnostics v_count = row_count;
  reset role;
  if v_count = 0 then
    passed := passed || 'başkasının adı değiştirilemez'::text;
  else
    failed := failed || 'başkasının adı değiştirilemez'::text;
  end if;

  -- 9) Giriş yapmamış biri maçları okuyamaz --------------------------------------------
  begin
    set local role anon;
    perform 1 from public.matches limit 1;
    reset role;
    failed := failed || 'girişsiz okuma reddi'::text;
  exception when insufficient_privilege then
    passed := passed || 'girişsiz okuma reddi'::text;
  end;

  -- 10) save_prediction: kendi adına kaydeder ve günceller --------------------------------
  insert into public.matches (season_id, round, home_team_id, away_team_id, kickoff_at, provider, provider_id)
    values (v_season, 1, v_home, v_away, now() + interval '2 hours', 'smoke', 'm3')
    returning id into v_future_match;
  begin
    set local role authenticated;
    perform set_config('request.jwt.claims', json_build_object('sub', melih, 'role', 'authenticated')::text, true);
    perform public.save_prediction(v_future_match, 2, 1);
    perform public.save_prediction(v_future_match, 3, 1);
    reset role;
    select count(*) into v_count
    from public.predictions
    where user_id = melih and match_id = v_future_match and home_goals = 3;
    if v_count = 1 then
      passed := passed || 'tahmin kaydetme ve güncelleme'::text;
    else
      failed := failed || 'tahmin kaydetme ve güncelleme'::text;
    end if;
  exception when others then
    failed := failed || ('tahmin kaydetme ve güncelleme: ' || sqlerrm);
  end;

  -- 11) save_prediction: başlamış maça kaydedemez ----------------------------------------
  begin
    set local role authenticated;
    perform set_config('request.jwt.claims', json_build_object('sub', melih, 'role', 'authenticated')::text, true);
    perform public.save_prediction(v_past_match, 1, 0);
    reset role;
    failed := failed || 'başlamış maça kaydetme reddi'::text;
  exception when others then
    if sqlerrm like '%tahmin süresi doldu%' then
      passed := passed || 'başlamış maça kaydetme reddi'::text;
    else
      failed := failed || ('başlamış maça kaydetme reddi: ' || sqlerrm);
    end if;
  end;

  -- 12) Maç bitince otomatik puanlama (Melih 3-1 tahmin etti, maç 3-1 bitti: 5 puan) -----
  update public.matches
  set kickoff_at = now() - interval '2 hours', status = 'finished', home_score = 3, away_score = 1
  where id = v_future_match;
  select count(*) into v_count
  from public.predictions
  where user_id = melih and match_id = v_future_match and points = 5 and result_type = 'exact';
  if v_count = 1 then
    passed := passed || 'maç bitince otomatik puanlama'::text;
  else
    failed := failed || 'maç bitince otomatik puanlama'::text;
  end if;

  -- 13) Kullanıcı puanlamayı kendisi tetikleyemez -------------------------------------------
  begin
    set local role authenticated;
    perform set_config('request.jwt.claims', json_build_object('sub', melih, 'role', 'authenticated')::text, true);
    perform public.score_match(v_future_match);
    reset role;
    failed := failed || 'puanlamayı kullanıcı tetikleyemez'::text;
  exception when insufficient_privilege then
    passed := passed || 'puanlamayı kullanıcı tetikleyemez'::text;
  end;

  -- 14) Oda kurma ve kodla katılma ---------------------------------------------------------
  begin
    set local role authenticated;
    perform set_config('request.jwt.claims', json_build_object('sub', melih, 'role', 'authenticated')::text, true);
    select r.id, r.code into v_new_room, v_new_code from public.create_room('Smoke Yeni Oda') r;
    perform set_config('request.jwt.claims', json_build_object('sub', yabanci, 'role', 'authenticated')::text, true);
    select j.status into v_status from public.join_room(lower(v_new_code)) j;
    reset role;
    if v_status = 'joined'
       and (select count(*) from public.room_members where room_id = v_new_room) = 2 then
      passed := passed || 'oda kurma ve kodla katılma'::text;
    else
      failed := failed || ('oda kurma ve kodla katılma: ' || coalesce(v_status, 'durum yok'));
    end if;
  exception when others then
    failed := failed || ('oda kurma ve kodla katılma: ' || sqlerrm);
  end;

  -- 15) Oda sıralaması üyeye açık, üye olmayana kapalı --------------------------------------
  begin
    set local role authenticated;
    perform set_config('request.jwt.claims', json_build_object('sub', yabanci, 'role', 'authenticated')::text, true);
    select count(*) into v_count from public.get_room_leaderboard(v_new_room);
    perform set_config('request.jwt.claims', json_build_object('sub', burak, 'role', 'authenticated')::text, true);
    perform * from public.get_room_leaderboard(v_new_room);
    reset role;
    failed := failed || 'oda sıralaması üye olmayana kapalı'::text;
  exception when others then
    if sqlerrm like '%üyesi değilsin%' and v_count = 2 then
      passed := passed || 'oda sıralaması üyeye açık, üye olmayana kapalı'::text;
    else
      failed := failed || ('oda sıralaması: ' || sqlerrm);
    end if;
  end;

  -- 16) Odada yalnızca oda kurulduktan sonra başlayan maçlar sayılır -------------------------
  -- Melih'in 5 puanlık maçı 2 saat önce başladı; "Smoke Oda" şimdi kuruldu, yani sayılmamalı.
  -- Oda bir gün önce kurulmuş gibi yapılınca aynı maç sayılmalı. (Sezon geçici olarak güncel
  -- yapılır; bloğun sonunda her şey geri alınır.)
  begin
    update public.seasons set is_current = false where is_current;
    update public.seasons set is_current = true where id = v_season;
    set local role authenticated;
    perform set_config('request.jwt.claims', json_build_object('sub', melih, 'role', 'authenticated')::text, true);
    select l.points into v_count from public.get_room_leaderboard(v_room) l where l.user_id = melih;
    reset role;
    update public.rooms set created_at = now() - interval '1 day' where id = v_room;
    set local role authenticated;
    perform set_config('request.jwt.claims', json_build_object('sub', melih, 'role', 'authenticated')::text, true);
    select l.points into v_count_after from public.get_room_leaderboard(v_room) l where l.user_id = melih;
    reset role;
    if v_count = 0 and v_count_after = 5 then
      passed := passed || 'odada yalnızca kuruluştan sonraki maçlar sayılır'::text;
    else
      failed := failed || format('oda kuruluş kuralı: önce=%s sonra=%s', v_count, v_count_after);
    end if;
  exception when others then
    failed := failed || ('oda kuruluş kuralı: ' || sqlerrm);
  end;

  -- 17) Bildirim adresi fonksiyonla kaydedilir; tablo uygulamaya kapalı ------------------------
  begin
    set local role authenticated;
    perform set_config('request.jwt.claims', json_build_object('sub', melih, 'role', 'authenticated')::text, true);
    perform public.register_push_token('ExponentPushToken[smokesmokesmokesmoke]', 'ios');
    reset role;
    if exists (select 1 from public.push_tokens where token = 'ExponentPushToken[smokesmokesmokesmoke]' and user_id = melih) then
      begin
        set local role authenticated;
        perform set_config('request.jwt.claims', json_build_object('sub', melih, 'role', 'authenticated')::text, true);
        perform 1 from public.push_tokens limit 1;
        reset role;
        failed := failed || 'bildirim adresi tablosu uygulamaya kapalı'::text;
      exception when insufficient_privilege then
        passed := passed || 'bildirim adresi kaydı, tablo uygulamaya kapalı'::text;
      end;
    else
      failed := failed || 'bildirim adresi kaydı'::text;
    end if;
  exception when others then
    failed := failed || ('bildirim adresi: ' || sqlerrm);
  end;

  -- 18) Bildirim tercihi kaydedilir ve okunur -----------------------------------------------------
  begin
    set local role authenticated;
    perform set_config('request.jwt.claims', json_build_object('sub', melih, 'role', 'authenticated')::text, true);
    perform public.set_notification_settings(false, true);
    select count(*) into v_count
    from public.get_my_notification_settings() s
    where s.match_reminders = false and s.round_results = true;
    reset role;
    if v_count = 1 then
      passed := passed || 'bildirim tercihi kaydı'::text;
    else
      failed := failed || 'bildirim tercihi kaydı'::text;
    end if;
  exception when others then
    failed := failed || ('bildirim tercihi: ' || sqlerrm);
  end;

  -- 19) Bildirim toplayıcıları uygulama kullanıcısına kapalı ---------------------------------------
  begin
    set local role authenticated;
    perform set_config('request.jwt.claims', json_build_object('sub', melih, 'role', 'authenticated')::text, true);
    perform * from public.collect_match_reminders(now(), true);
    reset role;
    failed := failed || 'bildirim toplayıcısı kullanıcıya kapalı'::text;
  exception when insufficient_privilege then
    passed := passed || 'bildirim toplayıcısı kullanıcıya kapalı'::text;
  end;

  -- 20) Hesap silme: giriş bilgisi silinir, profil anonimleşir, tahminler kalır -------------
  begin
    set local role authenticated;
    perform set_config('request.jwt.claims', json_build_object('sub', yabanci, 'role', 'authenticated')::text, true);
    perform public.delete_my_account();
    reset role;
    if not exists (select 1 from auth.users where id = yabanci)
       and exists (
         select 1 from public.profiles
         where id = yabanci and display_name = 'Silinmiş Kullanıcı' and deleted_at is not null
       )
       and not exists (select 1 from public.room_members where user_id = yabanci) then
      passed := passed || 'hesap silme ve anonimleştirme'::text;
    else
      failed := failed || 'hesap silme ve anonimleştirme'::text;
    end if;
  exception when others then
    failed := failed || ('hesap silme: ' || sqlerrm);
  end;

  raise exception 'SMOKE geçen=% kalan=% | geçenler: % | kalanlar: %',
    cardinality(passed), cardinality(failed),
    array_to_string(passed, ', '), coalesce(nullif(array_to_string(failed, ', '), ''), '-');
end
$smoke$;
