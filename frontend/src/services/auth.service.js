import axios from 'axios';

const API_URL = 'http://localhost:8080/api/auth/';

const register = (name, email, password) => {
  return axios.post(API_URL + 'signup', {
    name,
    email,
    password,
  });
};

const login = async (email, password) => {
  const response = await axios.post(API_URL + 'login', {
    email,
    password,
  });
  if (response.data.token) {
    localStorage.setItem('user', JSON.stringify(response.data));
  }
  return response.data;
};

const logout = () => {
  localStorage.removeItem('user');
};

const getCurrentUser = () => {
  return JSON.parse(localStorage.getItem('user'));
};

export default { register, login, logout, getCurrentUser };