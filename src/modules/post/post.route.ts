import { Router } from "express";
import { guardRole } from "../../middlewares/roleGuard";
import { PostController } from "./post.controller";
import upload from "../../multer/multer";

const router = Router();
router
  .route("/create")
  .post(guardRole("user"), upload.single("image"), PostController.createPost);
router.route("/feed").get(guardRole("user"), PostController.getFeed);
router
  .route("/comment/:postId")
  .post(guardRole("user"), PostController.addComment);

router
  .route("/replies/:postId")
  .post(guardRole("user"), PostController.addReplies);

router
  .route("/reaction/:targetId")
  .post(guardRole("user"), PostController.addReaction);
router
  .route("/reaction-list/:targetId")
  .post(guardRole("user"), PostController.getReaction);
export const PostRouter = router;
