import { Router } from "express";
import { guardRole } from "../../middlewares/roleGuard";
import { FriendsController } from "./friends.controller";

const router = Router();
router
  .route("/send/:userId")
  .post(guardRole("user"), FriendsController.sendRequest);
router.route("/get").get(guardRole("user"), FriendsController.getNewFriends);
router.route("/action/:requestId").patch(guardRole("user"), FriendsController.action);
router.route("/myfriends").get(guardRole("user"), FriendsController.getMyFriends);
export const FriendRouter = router;
