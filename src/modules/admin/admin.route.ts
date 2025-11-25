import { Router } from "express";
import { guardRole } from "../../middlewares/roleGuard";
import { AdminController } from "./admin.controller";
import { UserController } from "../user/user.controller";
const router = Router();
router
  .route("/change-user/status/:userId")
  .get(guardRole("admin"), AdminController.changeUserStatus);

router.post("/admin-login", UserController.adminloginUser);
router.get("/user-list", guardRole("admin"), UserController.getAllUsers);
export const AdminRoutes = router;
