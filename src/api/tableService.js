// src/api/tableService.js
import { createApiHelpers } from '@/utils/apiHelpers'

const TABLES_BASE_URL = '/api/v1/tables'

const { get, post, put, patch, remove } = createApiHelpers(TABLES_BASE_URL)

export const getAllTables = () => get()

export const createTable = (tableData) => post('', tableData)

export const updateTable = (id, tableData) => put(`/${id}`, tableData)

export const updateTableStatus = (id, status) => patch(`/${id}/status`, { status })

export const deleteTable = (id) => remove(`/${id}`)
