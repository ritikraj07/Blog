const { Schema, model } = require("mongoose");

const BlogSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    // Slug is the URL-friendly version of the title
    slug: {
        type: String,
        unique: true,
        lowercase: true
    },
    summary: {
        type: String,
        required: true,
        maxlength: 200
    },
    content: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    tags: [{
        type: String,
        trim: true
    }],
    author: {
        type: String,
        default: "Ritik Raj", 
        required: true
    },
    metaDescription: {
        type: String,
        maxlength: 160
    },
    
    status: {
        type: String,
        enum: ['draft', 'published'],
        default: 'draft'
    },
    publishedAt: {
        type: Date
    },
    readTime: {
        type: Number 
    }
}, {
    timestamps: true
});



// Auto-generate publishedAt before saving
BlogSchema.pre('save', function(next) {
    if (this.status === 'published' && !this.publishedAt) {
        this.publishedAt = new Date();
    }
    next();
});

// Calculate read time before saving
BlogSchema.pre('save', function(next) {
    if (this.isModified('content')) {
        const wordsPerMinute = 200;
        const wordCount = this.content.split(/\s+/).length;
        this.readTime = Math.ceil(wordCount / wordsPerMinute);
    }
    next();
});

// models/Blog.js
BlogSchema.pre('save', async function(next) {
    try {
        // If it's a new document and no slug provided, generate one
        if (this.isNew && !this.slug) {
            this.slug = await this.generateUniqueSlug(this.title);
        }
        
        // If title is modified but slug wasn't manually set, update slug
        if (this.isModified('title') && !this.isModified('slug')) {
            this.slug = await this.generateUniqueSlug(this.title);
        }
        
        next();
    } catch (error) {
        next(error);
    }
});

// Instance method to generate unique slug
BlogSchema.methods.generateUniqueSlug = async function(title) {
    let baseSlug = title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
    
    let slug = baseSlug;
    let counter = 1;
    let existingDoc;
    
    do {
        existingDoc = await this.constructor.findOne({ 
            slug: slug, 
            _id: { $ne: this._id } 
        });
        
        if (existingDoc) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }
    } while (existingDoc && counter < 100);
    
    return slug;
};

module.exports = model('Blog', BlogSchema);