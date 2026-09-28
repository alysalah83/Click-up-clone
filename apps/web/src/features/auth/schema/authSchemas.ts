import z from "zod";

const emailSchema = z
  .email({
    message: "invalid email, please enter a valid email",
  })
  .max(100, { message: "too long email, enter a valid email" });

const passwordSchema = z
  .string()
  .trim()
  .min(6, { message: "password must be greater or equal than 6 length" })
  .max(320, { message: "password max length must be less than or equal 320" });

const nameSchema = z
  .string()
  .trim()
  .min(2, { error: "please enter your full name" })
  .max(120, "too long name");

const signupUserSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});

const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export { signupUserSchema, loginSchema };
