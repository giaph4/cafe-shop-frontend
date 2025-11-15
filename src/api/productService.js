// src/api/productService.js
import apiClient from './axios'

const PRODUCTS_BASE_URL = '/api/v1/products'

const normalizeParams = (params = {}) =>
    Object.fromEntries(
        Object.entries(params).filter(([, value]) => value !== undefined && value !== null),
    )

const buildFormData = (productData, imageFile) => {
    const formData = new FormData()
    formData.append(
        'product',
        new Blob([JSON.stringify(productData ?? {})], { type: 'application/json' }),
    )
    if (imageFile) {
        formData.append('image', imageFile)
    }
    return formData
}

const get = (path = '', params) =>
    apiClient.get(`${PRODUCTS_BASE_URL}${path}`, { params: normalizeParams(params) })

const remove = (path = '', params) =>
    apiClient.delete(`${PRODUCTS_BASE_URL}${path}`, { params: normalizeParams(params) })

const postForm = (path, productData, imageFile) =>
    apiClient.post(`${PRODUCTS_BASE_URL}${path}`, buildFormData(productData, imageFile), {
        headers: { 'Content-Type': 'multipart/form-data' },
    })

const putForm = (path, productData, imageFile) =>
    apiClient.put(`${PRODUCTS_BASE_URL}${path}`, buildFormData(productData, imageFile), {
        headers: { 'Content-Type': 'multipart/form-data' },
    })

const put = (path, payload) => apiClient.put(`${PRODUCTS_BASE_URL}${path}`, payload)

const patch = (path, payload) => apiClient.patch(`${PRODUCTS_BASE_URL}${path}`, payload)

export const getProducts = (params) => get('', params)

export const getProductById = (id) => get(`/${id}`)

export const createProduct = (productData, imageFile) => postForm('', productData, imageFile)

export const updateProduct = (id, productData, imageFile) => putForm(`/${id}`, productData, imageFile)

export const deleteProduct = (id) => remove(`/${id}`)

export const toggleProductAvailability = (id) => patch(`/${id}/toggle-availability`)

export const getAvailableProducts = (params = { page: 0, size: 1000 }) => get('', params)

export const getProductRecipe = (productId) => get(`/${productId}/recipe`)

export const setProductRecipe = (productId, recipeData) => put(`/${productId}/recipe`, recipeData)
