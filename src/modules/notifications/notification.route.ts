import express from "express";
import {
  adminSendPushNotification,
  getMyNotification,
  getUnreadBadgeCount,
} from "./notification.controller";
import { guardRole } from "../../middlewares/roleGuard";

const router = express.Router();

router.get("/", guardRole(["admin", "user"]), getMyNotification);
router.get("/badge-count", guardRole(["admin", "user"]), getUnreadBadgeCount);
router.post("/send-push", guardRole("admin"), adminSendPushNotification);

export const NotificationRoutes = router;
