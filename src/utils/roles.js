export const normalizeRoles = (roles = []) => {
  if (!Array.isArray(roles)) return []

  return roles
    .map((role) => {
      if (!role) return null
      if (typeof role === 'string') return role
      if (typeof role === 'object') {
        return role.name || role.code || role.authority || role.key || null
      }
      return null
    })
    .filter(Boolean)
}
