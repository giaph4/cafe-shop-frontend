export const getUserAvatar = (user) => {
  if (!user) return ''

  const directUrl = user.avatarUrl || user.avatar_url
  if (typeof directUrl === 'string' && directUrl.trim()) {
    return directUrl.trim()
  }

  const seedSource = user.fullName || user.username || user.email || 'user'
  const nameSeed = encodeURIComponent(seedSource)
  return `https://avatar.iran.liara.run/username?username=${nameSeed}`
}
