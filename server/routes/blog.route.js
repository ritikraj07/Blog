// routes/blog.route.js
const { Router } = require("express");
const { 
  createBlog, 
  editBlog, 
  deleteBlog, 
  getBlog, 
  getBlogs 
} = require("../controllers/blog.controller");
const { upload } = require("../middlewares/cloudinary");

const router = Router();

/**
 * @route   GET /api/blogs
 * @desc    Get all published blog posts with pagination and filtering
 * @access  Public
 * @query   page, limit, category, tag
 */
router.get("/", getBlogs);

/**
 * @route   GET /api/blogs/:slug
 * @desc    Get single blog post by slug
 * @access  Public
 */
router.get("/:slug", getBlog);

/**
 * @route   POST /api/blogs
 * @desc    Create a new blog post with image upload
 * @access  Private
 * @body    title, summary, content, category, tags, metaDescription, status
 * @file    image
 */
router.post("/", upload.single('image'), createBlog);

/**
 * @route   PUT /api/blogs/:id
 * @desc    Update a blog post (with optional image update)
 * @access  Private
 * @body    title, summary, content, category, tags, metaDescription, status
 * @file    image (optional)
 */
router.put("/:id", upload.single('image'), editBlog);

/**
 * @route   DELETE /api/blogs/:id
 * @desc    Delete a blog post and its associated image
 * @access  Private
 */
router.delete("/:id", deleteBlog);

module.exports = router;