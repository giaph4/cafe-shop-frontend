import apiClient from './axios'

/**
 * Upload a single file to the backend file storage service.
 * API: POST /api/v1/files/upload
 * @param {File} file - Binary file selected by the user
 * @returns {Promise<import('axios').AxiosResponse>} Upload response containing the hosted file URL
 */
export const uploadFile = (file) => {
  const formData = new FormData()
  formData.append('file', file)

  return apiClient.post('/api/v1/files/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}
