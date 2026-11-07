import { api } from "../../lib/api/client";
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  provider: "LOCAL" | "GOOGLE";
}
export interface Credentials {
  email: string;
  password: string;
}
export interface Registration extends Credentials {
  firstName: string;
  lastName: string;
}
export const authApi = {
  me: async () => (await api.get<User>("/auth/me")).data,
  login: async (data: Credentials) =>
    (await api.post<User>("/auth/login", data)).data,
  register: async (data: Registration) =>
    (await api.post<User>("/auth/register", data)).data,
  logout: async () => {
    await api.post("/auth/logout");
  },
  providers: async () =>
    (await api.get<{ google: boolean }>("/auth/providers")).data,
};
export const googleLoginUrl = new URL(
  "/oauth2/authorization/google",
  api.defaults.baseURL,
).href;
