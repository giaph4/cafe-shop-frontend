// src/store/authModule.js
import { login, register } from '@/api/authService';
import router from '@/router';

// Không còn createStore()
export const authModule = {
    namespaced: true, // Quan trọng: Bật namespace

    state: {
        user: JSON.parse(localStorage.getItem('user')) || null,
        token: localStorage.getItem('token') || null,
        status: '',
    },

    mutations: {
        auth_request(state) {
            state.status = 'loading';
        },
        auth_success(state, { token, user }) {
            state.status = 'success';
            state.token = token;
            state.user = user;
        },
        auth_error(state) {
            state.status = 'error';
        },
        logout(state) {
            state.status = '';
            state.token = null;
            state.user = null;
        },
        register_request(state) {
            state.status = 'loading';
        },
        register_success(state) {
            state.status = 'success';
        },
        register_error(state) {
            state.status = 'error';
        }
    },

    actions: {
        async login({ commit }, user) {
            commit('auth_request');
            try {
                const response = await login(user);
                const { token, userProfile } = response.data;
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(userProfile));
                commit('auth_success', { token, user: userProfile });
                router.push('/');
            } catch (err) {
                commit('auth_error');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                throw err;
            }
        },
        async register({ commit }, user) {
            commit('register_request');
            try {
                await register(user);
                commit('register_success');
                router.push('/login');
            } catch (err) {
                commit('register_error');
                throw err;
            }
        },
        logout({ commit }) {
            commit('logout');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            router.push('/login');
        },
    },

    getters: {
        isLoggedIn: (state) => !!state.token,
        authStatus: (state) => state.status,
        user: (state) => state.user,
        userRole: (state) => state.user?.role,
    },
};