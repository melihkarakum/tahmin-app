-- FAZ 6: Maç senkronunu zamanlar (pg_cron + pg_net).
--   sync-matches-full : her gün 03:15 UTC (06:15 TSİ) tüm fikstür
--   sync-matches-live : 10 dakikada bir; yalnızca başlamak üzere olan/oynanan maç varsa API'ye gider
-- Fonksiyon adresi ve gizli parola Vault'ta durur ("project_url", "sync_secret"); bu dosyada sır yoktur.
-- Vault kayıtları bir kez elle oluşturulur (bkz. docs/ARCHITECTURE.md).
-- Yerel test veritabanında pg_cron ve pg_net bulunmadığı için bu adım orada atlanır.

do $migration$
begin
  if not exists (select 1 from pg_available_extensions where name = 'pg_cron')
     or not exists (select 1 from pg_available_extensions where name = 'pg_net') then
    raise notice 'pg_cron/pg_net yok; zamanlama atlandı.';
    return;
  end if;

  create extension if not exists pg_net with schema extensions;
  create extension if not exists pg_cron;

  -- Aynı adlı eski işler varsa kaldırılır; dosya tekrar çalıştırılabilir.
  perform cron.unschedule(jobname)
  from cron.job
  where jobname in ('sync-matches-full', 'sync-matches-live');

  perform cron.schedule(
    'sync-matches-full',
    '15 3 * * *',
    $job$
      select net.http_post(
        url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
          || '/functions/v1/sync-matches?mode=full',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-sync-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'sync_secret')
        ),
        body := '{}'::jsonb,
        timeout_milliseconds := 120000
      );
    $job$
  );

  perform cron.schedule(
    'sync-matches-live',
    '*/10 * * * *',
    $job$
      select net.http_post(
        url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
          || '/functions/v1/sync-matches?mode=live',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-sync-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'sync_secret')
        ),
        body := '{}'::jsonb,
        timeout_milliseconds := 60000
      );
    $job$
  );
end
$migration$;
