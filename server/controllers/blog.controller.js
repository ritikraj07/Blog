// controllers/blog.controller.js
const Blog = require('../models/blog.model');
const { cloudinary } = require('../middlewares/cloudinary');

/**
 * @desc    Create a new blog post
 * @route   POST /api/blogs
 * @access  Private (add authentication later)
 */
const createBlog = async (req, res) => {
  console.log("enter in cloudinary");
  try {
    const {
      title,
      summary,
      content,
      category,
      tags,
      metaDescription,
      status = 'draft'
    } = req.body;

    // Validate required fields
    if (!title || !summary || !content || !category) {
      return res.status(400).json({
        success: false,
        message: 'Title, summary, content, and category are required'
      });
    }

    // Check if image was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Blog image is required'
      });
    }

    // Parse tags if they're sent as JSON string
    const parsedTags = tags ? JSON.parse(tags) : [];

    // Create blog post
    const blog = new Blog({
      title,
      summary,
      content,
      image: req.file.path, // Cloudinary URL
      category,
      tags: parsedTags,
      metaDescription: metaDescription || summary.substring(0, 160), // Auto-generate if not provided
      status,
      publishedAt: status === 'published' ? new Date() : null
    });

    await blog.save();

    res.status(201).json({
      success: true,
      message: 'Blog created successfully',
      data: blog
    });

  } catch (error) {
    console.error('Create blog error:', error);
    
    // Cleanup: Delete uploaded image if blog creation fails
    if (req.file && req.file.filename) {
      await cloudinary.uploader.destroy(req.file.filename);
    }

    res.status(500).json({
      success: false,
      message: 'Error creating blog post',
      error: error.message
    });
  }
};

/**
 * @desc    Get all published blog posts with pagination
 * @route   GET /api/blogs
 * @access  Public
 */
const getBlogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query for published blogs only
    const query = { status: 'published' };

    // Optional category filter
    if (req.query.category) {
      query.category = req.query.category;
    }

    // Optional tag filter
    if (req.query.tag) {
      query.tags = { $in: [req.query.tag] };
    }

    const blogs = await Blog.find(query)
      .sort({ publishedAt: -1 }) // Newest first
      .skip(skip)
      .limit(limit)
      .select('-content'); // Exclude content for listing

    const total = await Blog.countDocuments(query);

    res.json({
      success: true,
      data: blogs,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Get blogs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching blogs',
      error: error.message
    });
  }
};

/**
 * @desc    Get single blog post by slug
 * @route   GET /api/blogs/:slug
 * @access  Public
 */
const getBlog = async (req, res) => {
  try {
    const { slug } = req.params;

    const blog = await Blog.findOne({ 
      slug, 
      status: 'published' 
    });

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    // Increment views (you can add this field to your model)
    blog.views = (blog.views || 0) + 1;
    await blog.save();

    res.json({
      success: true,
      data: blog
    });

  } catch (error) {
    console.error('Get blog error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching blog post',
      error: error.message
    });
  }
};

/**
 * @desc    Update a blog post
 * @route   PUT /api/blogs/:id
 * @access  Private
 */
// controllers/blog.controller.js
const editBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Handle slug updates with proper validation
    if (updateData.slug) {
      // Clean and format the slug first
      const cleanedSlug = updateData.slug
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/[\s_-]+/g, '-') // Replace spaces/underscores with hyphens
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens

      // Validate slug format
      const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
      if (!slugRegex.test(cleanedSlug)) {
        return res.status(400).json({
          success: false,
          message: 'Slug can only contain lowercase letters, numbers, and hyphens. No spaces or special characters allowed.'
        });
      }

      // Check if slug is already taken by another blog
      const existingBlog = await Blog.findOne({ 
        slug: cleanedSlug, 
        _id: { $ne: id } 
      });
      
      if (existingBlog) {
        return res.status(400).json({
          success: false,
          message: 'This slug is already taken by another blog post. Please choose a different one.'
        });
      }

      // If validation passes, use the cleaned slug
      updateData.slug = cleanedSlug;
    }

    // Handle image update if new image is uploaded
    if (req.file) {
      updateData.image = req.file.path;
      
      // Delete old image from Cloudinary
      const oldBlog = await Blog.findById(id);
      if (oldBlog && oldBlog.image) {
        try {
          const urlParts = oldBlog.image.split('/');
          const publicIdWithExtension = urlParts[urlParts.length - 1];
          const publicId = publicIdWithExtension.split('.')[0];
          const folder = 'blog-images';
          const fullPublicId = `${folder}/${publicId}`;
          
          await cloudinary.uploader.destroy(fullPublicId);
          console.log('Old image deleted from Cloudinary');
        } catch (cloudinaryError) {
          console.error('Error deleting old image from Cloudinary:', cloudinaryError);
          // Don't fail the entire request if image deletion fails
        }
      }
    }

    // Parse tags if provided (with error handling)
    if (req.body.tags) {
      try {
        updateData.tags = typeof req.body.tags === 'string' 
          ? JSON.parse(req.body.tags) 
          : req.body.tags;
      } catch (parseError) {
        return res.status(400).json({
          success: false,
          message: 'Invalid tags format. Please provide tags as a valid JSON array.'
        });
      }
    }

    // Update publishedAt if status changes to published
    if (updateData.status === 'published') {
      const existingBlog = await Blog.findById(id);
      if (existingBlog && existingBlog.status !== 'published') {
        updateData.publishedAt = new Date();
      }
    }

    // Add updatedAt timestamp
    updateData.updatedAt = new Date();

    const blog = await Blog.findByIdAndUpdate(
      id, 
      updateData, 
      { 
        new: true, // Return updated document
        runValidators: true // Run model validations
      }
    );

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    res.json({
      success: true,
      message: 'Blog updated successfully',
      data: blog
    });

  } catch (error) {
    console.error('Edit blog error:', error);
    
    // More specific error handling
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.message
      });
    }
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid blog ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating blog post',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * @desc    Delete a blog post
 * @route   DELETE /api/blogs/:id
 * @access  Private
 */
const deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;

    const blog = await Blog.findById(id);
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    // Delete image from Cloudinary
    if (blog.image) {
      const urlParts = blog.image.split('/');
      const publicId = urlParts[urlParts.length - 1].split('.')[0];
      const fullPublicId = `blog-images/${publicId}`;
      await cloudinary.uploader.destroy(fullPublicId);
    }

    // Delete from database
    await Blog.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Blog deleted successfully'
    });

  } catch (error) {
    console.error('Delete blog error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting blog post',
      error: error.message
    });
  }
};

module.exports = {
  createBlog,
  editBlog,
  deleteBlog,
  getBlog,
  getBlogs
};