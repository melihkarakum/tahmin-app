-- FAZ 9: Otomatik puanlama.
-- Kural: tam skor 5; doğru sonuç ve doğru gol farkı 3 + 1 = 4; yalnızca doğru sonuç 3; yanlış 0.
-- Tam skorda yalnızca tam skor puanı verilir (sonuç ve fark puanı üstüne eklenmez).
-- Değerler scoring_config tablosundan okunur; kazanılan puan tahmin satırına yazılır.

-- Tek bir tahminin puanı. Saf hesap: tabloya dokunmaz, aynı girdiye hep aynı sonucu verir.
create or replace function public.calculate_points(
  p_predicted_home integer,
  p_predicted_away integer,
  p_home_score integer,
  p_away_score integer,
  p_exact_points integer default 5,
  p_outcome_points integer default 3,
  p_goal_diff_bonus integer default 1
)
returns table (points integer, result_type text)
language sql
immutable
set search_path = ''
as $$
  select
    case
      when p_predicted_home = p_home_score and p_predicted_away = p_away_score then p_exact_points
      when sign(p_predicted_home - p_predicted_away) = sign(p_home_score - p_away_score) then
        p_outcome_points
        + case
            when p_predicted_home - p_predicted_away = p_home_score - p_away_score then p_goal_diff_bonus
            else 0
          end
      else 0
    end,
    case
      when p_predicted_home = p_home_score and p_predicted_away = p_away_score then 'exact'
      when sign(p_predicted_home - p_predicted_away) = sign(p_home_score - p_away_score) then
        case
          when p_predicted_home - p_predicted_away = p_home_score - p_away_score then 'outcome_diff'
          else 'outcome'
        end
      else 'miss'
    end;
$$;

-- Bir maçın tüm tahminlerini puanlar. Maç bitmemişse (ya da sonradan iptal/ertelenmiş sayıldıysa)
-- verilmiş puanları geri alır. Tekrar çalıştırılması güvenlidir: aynı maç iki kez puan vermez.
create or replace function public.score_match(p_match_id bigint)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_match public.matches;
  v_config public.scoring_config;
  v_scored integer;
begin
  select * into v_match from public.matches where id = p_match_id;
  if not found then
    return 0;
  end if;

  if v_match.status <> 'finished' then
    update public.predictions
    set points = null, result_type = null
    where match_id = p_match_id and points is not null;
    update public.matches set scored_at = null where id = p_match_id and scored_at is not null;
    return 0;
  end if;

  select * into v_config from public.scoring_config where id = 1;

  update public.predictions p
  set (points, result_type) = (
    select c.points, c.result_type
    from public.calculate_points(
      p.home_goals,
      p.away_goals,
      v_match.home_score,
      v_match.away_score,
      v_config.exact_points,
      v_config.outcome_points,
      v_config.goal_diff_bonus
    ) c
  )
  where p.match_id = p_match_id;
  get diagnostics v_scored = row_count;

  update public.matches set scored_at = now() where id = p_match_id;
  return v_scored;
end;
$$;

-- Maçın durumu ya da skoru değişince puanlama kendiliğinden çalışır
-- (senkron fonksiyonu, yönetici düzeltmesi ya da elle güncelleme fark etmez).
create or replace function public.on_match_result_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status is distinct from old.status
     or new.home_score is distinct from old.home_score
     or new.away_score is distinct from old.away_score then
    perform public.score_match(new.id);
  end if;
  return null;
end;
$$;

create trigger matches_score_on_result_change
  after update of status, home_score, away_score on public.matches
  for each row execute function public.on_match_result_change();

-- Puanlama yalnızca tetikleyici ve yönetici tarafından çalıştırılır.
revoke execute on function public.score_match(bigint) from public, anon, authenticated;
revoke execute on function public.on_match_result_change() from public, anon, authenticated;
revoke execute on function public.calculate_points(integer, integer, integer, integer, integer, integer, integer)
  from public, anon;
grant execute on function public.calculate_points(integer, integer, integer, integer, integer, integer, integer)
  to authenticated;
