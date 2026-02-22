import { Router, type Request, type Response } from "express";
import { userService } from "../../application/services/user.service.ts";
import { asyncHandler, validate } from "../../middleware/validation.ts";
import { NotFoundError } from "../../middleware/errors.ts";
import {
  CreateUserSchema,
  UpdateUserSchema,
  GetUserSchema,
} from "../../application/schemas/user.schema.ts";

const router = Router();

// Create user
router.post(
  "/",
  validate(CreateUserSchema, "body"),
  asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.createUser(req.body);
    res.status(201).json({ success: true, data: user });
  }),
);

// Get all users
router.get(
  "/",
  asyncHandler(async (_req: Request, res: Response) => {
    const users = await userService.getAllUsers();
    res.status(200).json({ success: true, data: users });
  }),
);

// Get user by ID
router.get(
  "/:id",
  validate(GetUserSchema, "params"),
  asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.getUserById(req.params.id as string);
    if (!user) throw new NotFoundError("User");
    res.status(200).json({ success: true, data: user });
  }),
);

// Update user
router.put(
  "/:id",
  validate(GetUserSchema, "params"),
  validate(UpdateUserSchema, "body"),
  asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.updateUser(req.params.id as string, req.body);
    if (!user) throw new NotFoundError("User");
    res.status(200).json({ success: true, data: user });
  }),
);

// Delete user
router.delete(
  "/:id",
  validate(GetUserSchema, "params"),
  asyncHandler(async (req: Request, res: Response) => {
    const success = await userService.deleteUser(req.params.id as string);
    if (!success) throw new NotFoundError("User");
    res.status(200).json({ success: true, message: "User deleted successfully" });
  }),
);

export default router;
