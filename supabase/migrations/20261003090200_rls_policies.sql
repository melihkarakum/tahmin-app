-- FAZ 4: İzinler ve satır güvenliği (RLS).
-- İlke: önce her şey kapatılır, sonra yalnızca gerekenler açılır.
-- Tahmin yazma, oda oluşturma ve odaya katılma ileride sunucu fonksiyonlarıyla eklenecek
-- (FAZ 8 ve FAZ 10); o zamana kadar uygulamanın bu tablolara yazma izni yoktur.

-- Supabase yeni tablolara anon ve authenticated rolleri için tüm izinleri verir; geri alıyoruz.
revoke all on table
  public.profiles,
  public.leagues,
  public.seasons,
  public.teams,
  public.matches,
  public.scoring_config,
  public.predictions,
  public.rooms,
  public.room_members
from anon, authenticated;

alter table public.profiles enable row level security;
alter table public.leagues enable row level security;
alter table public.seasons enable row level security;
alter table public.teams enable row level security;
alter table public.matches enable row level security;
alter table public.scoring_config enable row level security;
alter table public.predictions enable row level security;
alter table public.rooms enable row level security;
alter table public.room_members enable row level security;

-- Yardımcı fonksiyonlar ----------------------------------------------------------
-- RLS kurallarında oda üyeliğini kontrol eder. security definer: kurallar birbirini
-- çağırıp döngüye girmesin ve sorgu tek yerden yapılsın diye.

create or replace function public.is_room_member(target_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.room_members rm
    where rm.room_id = target_room_id
      and rm.user_id = (select auth.uid())
  );
$$;

create or replace function public.is_room_owner(target_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.rooms r
    where r.id = target_room_id
      and r.owner_id = (select auth.uid())
  );
$$;

create or replace function public.shares_room_with(other_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.room_members mine
    join public.room_members theirs on theirs.room_id = mine.room_id
    where mine.user_id = (select auth.uid())
      and theirs.user_id = other_user_id
  );
$$;

revoke execute on function
  public.is_room_member(uuid),
  public.is_room_owner(uuid),
  public.shares_room_with(uuid)
from public, anon;

grant execute on function
  public.is_room_member(uuid),
  public.is_room_owner(uuid),
  public.shares_room_with(uuid)
to authenticated;

-- Tetikleyici fonksiyonları doğrudan çağrılmamalı.
revoke execute on function
  public.set_updated_at(),
  public.enforce_prediction_window(),
  public.handle_new_user()
from public, anon, authenticated;

-- Profiller ------------------------------------------------------------------------
-- Rol, ban ve silinme bilgisi API'den okunamaz; uygulama sütunları tek tek seçmelidir.
grant select (id, username, display_name, created_at) on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;

create policy "profiles_select_authenticated"
  on public.profiles for select to authenticated
  using (true);

create policy "profiles_update_own"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Lig, sezon, takım, maç, puan ayarı: yalnızca okunur -------------------------------
grant select on public.leagues, public.seasons, public.teams, public.matches, public.scoring_config
to authenticated;

create policy "leagues_select_authenticated"
  on public.leagues for select to authenticated using (true);

create policy "seasons_select_authenticated"
  on public.seasons for select to authenticated using (true);

create policy "teams_select_authenticated"
  on public.teams for select to authenticated using (true);

create policy "matches_select_authenticated"
  on public.matches for select to authenticated using (true);

create policy "scoring_config_select_authenticated"
  on public.scoring_config for select to authenticated using (true);

-- Tahminler ---------------------------------------------------------------------------
-- Kendi tahminin her zaman görünür. Oda arkadaşının tahmini yalnızca maç başladıktan
-- sonra görünür; böylece maçtan önce kimse başkasının tahminini kopyalayamaz.
grant select on public.predictions to authenticated;

create policy "predictions_select_own_or_roommate_after_kickoff"
  on public.predictions for select to authenticated
  using (
    user_id = (select auth.uid())
    or (
      public.shares_room_with(user_id)
      and exists (
        select 1
        from public.matches m
        where m.id = match_id
          and m.kickoff_at <= now()
      )
    )
  );

-- Odalar --------------------------------------------------------------------------------
grant select, delete on public.rooms to authenticated;
grant update (name) on public.rooms to authenticated;

create policy "rooms_select_members"
  on public.rooms for select to authenticated
  using (public.is_room_member(id));

create policy "rooms_update_owner"
  on public.rooms for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "rooms_delete_owner"
  on public.rooms for delete to authenticated
  using (owner_id = (select auth.uid()));

-- Oda üyeleri ------------------------------------------------------------------------------
-- Üye odadan ayrılabilir (sahip hariç; sahip odayı silmeli). Sahip başka üyeleri çıkarabilir.
grant select, delete on public.room_members to authenticated;

create policy "room_members_select_members"
  on public.room_members for select to authenticated
  using (public.is_room_member(room_id));

create policy "room_members_delete_self_or_owner"
  on public.room_members for delete to authenticated
  using (
    (user_id = (select auth.uid()) and not public.is_room_owner(room_id))
    or (public.is_room_owner(room_id) and user_id <> (select auth.uid()))
  );
