export const parseTimeToMinutes = (timeString) => {
    if (!timeString) return null
    const [hours, minutes] = timeString.split(':').map(Number)
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return null
    return hours * 60 + minutes
}

export const calculateMinutesBetween = (startTime, endTime) => {
    const start = parseTimeToMinutes(startTime)
    const end = parseTimeToMinutes(endTime)
    if (start == null || end == null) return 0
    const diff = end - start
    return diff > 0 ? diff : 0
}

export const formatTimeRange = (startTime, endTime) => {
    if (!startTime || !endTime) return '—'
    return `${startTime.slice(0, 5)} - ${endTime.slice(0, 5)}`
}
