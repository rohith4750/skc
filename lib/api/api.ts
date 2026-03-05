import axios from "axios";

// Create a custom Axios instance
const instance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_ENDPOINT || "/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to attach authentication token
instance.interceptors.request.use(
  (config) => {
    // In Next.js, localStorage/sessionStorage is only available on the client-side
    if (typeof window !== "undefined") {
      const token = sessionStorage.getItem("accessToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor for handling common errors globally
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check for unauthorized access, etc.
    if (error.response?.status === 401) {
      console.warn("Unauthorized access - perhaps redirect to login");
      // e.g., window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

interface RequestParams {
  url: string;
  data?: any;
  params?: any;
  headers?: any;
}

// Reusable GET wrapper
export const getRequest = async ({ url, params, headers }: RequestParams) => {
  const response = await instance.get(url, { params, headers });
  return response.data;
};

// Reusable POST wrapper
export const postRequest = async ({
  url,
  data,
  params,
  headers,
}: RequestParams) => {
  const response = await instance.post(url, data, { params, headers });
  return response.data;
};

// Reusable PUT wrapper
export const putRequest = async ({
  url,
  data,
  params,
  headers,
}: RequestParams) => {
  const response = await instance.put(url, data, { params, headers });
  return response.data;
};

// Reusable PATCH wrapper
export const patchRequest = async ({
  url,
  data,
  params,
  headers,
}: RequestParams) => {
  const response = await instance.patch(url, data, { params, headers });
  return response.data;
};

// Reusable DELETE wrapper
export const deleteRequest = async ({
  url,
  params,
  headers,
}: RequestParams) => {
  const response = await instance.delete(url, { params, headers });
  return response.data;
};

// Reusable POST file upload wrapper
export const postRequestUploadFile = async ({
  url,
  data,
  params,
  headers,
}: RequestParams) => {
  const response = await instance.post(url, data, {
    params,
    headers: {
      ...headers,
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

// Reusable PUT file upload wrapper
export const putRequestUploadFile = async ({
  url,
  data,
  params,
  headers,
}: RequestParams) => {
  const response = await instance.put(url, data, {
    params,
    headers: {
      ...headers,
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export default instance;
