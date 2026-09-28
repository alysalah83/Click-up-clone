import { createServerAxios } from "@/shared/lib/axios/server";
import { LoginInputs, SignupUserInputs, UserWithoutPassword } from "../types";
import { Session } from "../types";

export const signupUser = async (signupUserInputs: SignupUserInputs) => {
  const serverAxios = await createServerAxios();
  return await serverAxios.post<Session>(
    "/users/register/user",
    signupUserInputs,
  );
};

export const signupGuest = async () => {
  const serverAxios = await createServerAxios();
  return await serverAxios.post<Session>("/users/register/guest");
};

export async function getUser() {
  const serverAxios = await createServerAxios();
  return await serverAxios.get<UserWithoutPassword>("/users");
}

export const loginUser = async function (loginInputs: LoginInputs) {
  const serverAxios = await createServerAxios();
  return await serverAxios.post<Session>("/users/login", loginInputs);
};

export const updateUser = async function (hasOnBoarded: boolean) {
  const serverAxios = await createServerAxios();
  return await serverAxios.patch<UserWithoutPassword>("/users", {
    hasOnBoarded,
  });
};
