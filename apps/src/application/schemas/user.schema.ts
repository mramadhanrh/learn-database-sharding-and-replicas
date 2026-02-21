import { z } from "zod";

export const CreateUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Name is required").max(255, "Name is too long"),
});

export const UpdateUserSchema = z.object({
  email: z.string().email("Invalid email address").optional(),
  name: z.string().min(1, "Name must not be empty").max(255, "Name is too long").optional(),
});

export const GetUserSchema = z.object({
  id: z.string().uuid("Invalid user ID"),
});

export type CreateUserRequest = z.infer<typeof CreateUserSchema>;
export type UpdateUserRequest = z.infer<typeof UpdateUserSchema>;
export type GetUserRequest = z.infer<typeof GetUserSchema>;
