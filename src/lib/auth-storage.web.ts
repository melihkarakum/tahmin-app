// Web'de tarayıcının kendi localStorage'ı kullanılır. Sayfa sunucuda önceden üretilirken
// (static rendering) tarayıcı olmadığı için depolama yoktur.
export const authStorage: Storage | undefined =
  typeof window === 'undefined' ? undefined : window.localStorage;
