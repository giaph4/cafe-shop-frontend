import apiClient from '@/api/axios'

export const normalizeParams = (params = {}) =>
    Object.fromEntries(
        Object.entries(params).filter(([, value]) => value !== undefined && value !== null),
    )

export const normalizePayload = (payload = {}) =>
    Object.fromEntries(
        Object.entries(payload).filter(([, value]) => value !== undefined),
    )

export const buildConfig = (params, config = {}) => ({
    params: normalizeParams(params),
    ...config,
})

export const createApiHelpers = (baseUrl, client = apiClient) => ({
    get(path = '', params, config) {
        return client.get(`${baseUrl}${path}`, buildConfig(params, config))
    },
    post(path = '', payload, config) {
        return client.post(`${baseUrl}${path}`, normalizePayload(payload), config)
    },
    put(path = '', payload, config) {
        return client.put(`${baseUrl}${path}`, normalizePayload(payload), config)
    },
    patch(path = '', payload, config) {
        return client.patch(`${baseUrl}${path}`, normalizePayload(payload), config)
    },
    remove(path = '', params, config) {
        return client.delete(`${baseUrl}${path}`, buildConfig(params, config))
    },
})

export const buildFormData = (payload = {}, fileFields = []) => {
    const formData = new FormData()

    Object.entries(payload).forEach(([key, value]) => {
        if (value === undefined || value === null) return

        if (fileFields.includes(key) && value instanceof File) {
            formData.append(key, value)
        } else if (typeof value === 'object' && !(value instanceof Blob)) {
            formData.append(key, new Blob([JSON.stringify(value)], { type: 'application/json' }))
        } else {
            formData.append(key, value)
        }
    })

    return formData
}
