export default defineEventHandler(() => {
  return {
    ok: true,
    service: 'web',
    now: new Date().toISOString(),
  }
})