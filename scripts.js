// Global variables
let blogData = { blogs: [] }; // Initialize empty blog data
let currentFilter = 'all';
let currentSearch = '';
let currentSort = 'newest';

// Load blog data from JSON file
async function loadBlogData() {
    try {
        console.log('Loading blog data from JSON file...');
        const response = await fetch('blogs.json');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        blogData = data;
        console.log('Blog data loaded successfully:', blogData.blogs.length, 'blogs');
        
        // Initialize the page after data is loaded
        initializePage();
        setupEventListeners();
        
    } catch (error) {
        console.error('Error loading blog data:', error);
        // Show error message to user
        const featuredContainer = document.getElementById('featured-posts');
        const blogsContainer = document.getElementById('blogs-container');
        
        if (featuredContainer) {
            featuredContainer.innerHTML = '<p class="no-posts">Error loading blog data. Please check if blogs.json exists.</p>';
        }
        if (blogsContainer) {
            blogsContainer.innerHTML = '<p class="no-posts">Error loading blog data.</p>';
        }
    }
}

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, loading blog data...');
    loadBlogData();
});

function initializePage() {
    console.log('Initializing page with', blogData.blogs.length, 'blogs');
    
    // Display all content
    displayFeaturedPosts();
    displayAllPosts();
    
    console.log('Page initialization complete');
}

function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Search functionality
    const searchInput = document.getElementById('search-input');
    const clearSearch = document.getElementById('clear-search');
    
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearch = e.target.value.toLowerCase();
            console.log('Search term:', currentSearch);
            performSearchAndFilter();
        });
    }
    
    if (clearSearch) {
        clearSearch.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            currentSearch = '';
            performSearchAndFilter();
        });
    }
    
    // Filter buttons
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            currentFilter = e.target.dataset.filter;
            console.log('Filter changed to:', currentFilter);
            performSearchAndFilter();
        });
    });
    
    // Sort functionality
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            currentSort = e.target.value;
            console.log('Sort changed to:', currentSort);
            performSearchAndFilter();
        });
    }
    
    // Clear all filters
    const clearFilters = document.getElementById('clear-filters');
    if (clearFilters) {
        clearFilters.addEventListener('click', clearAllFilters);
    }
    
    // Reset search button
    const resetSearch = document.getElementById('reset-search');
    if (resetSearch) {
        resetSearch.addEventListener('click', clearAllFilters);
    }
    
    console.log('Event listeners setup complete');
}

function performSearchAndFilter() {
    console.log('Performing search and filter...');
    
    // Check if blog data is loaded
    if (!blogData || !blogData.blogs || blogData.blogs.length === 0) {
        console.log('No blog data available');
        return;
    }
    
    let filteredBlogs = blogData.blogs.filter(blog => {
        // Search filter
        const matchesSearch = currentSearch === '' || 
            blog.title.toLowerCase().includes(currentSearch) ||
            blog.description.toLowerCase().includes(currentSearch) ||
            (blog.tags && blog.tags.some(tag => tag.toLowerCase().includes(currentSearch))) ||
            blog.category.some(cat => cat.toLowerCase().includes(currentSearch));
        
        // Category filter
        const matchesFilter = currentFilter === 'all' || 
            blog.category.includes(currentFilter);
        
        return matchesSearch && matchesFilter;
    });
    
    console.log('Filtered blogs count:', filteredBlogs.length);
    
    // Sort blogs
    filteredBlogs = sortBlogs(filteredBlogs);
    
    // Update UI
    updateSearchResultsInfo(filteredBlogs.length);
    displayFeaturedPosts(filteredBlogs);
    displayAllPosts(filteredBlogs);
}

function sortBlogs(blogs) {
    const sortedBlogs = [...blogs];
    
    switch(currentSort) {
        case 'newest':
            sortedBlogs.sort((a, b) => new Date(b.date) - new Date(a.date));
            break;
        case 'oldest':
            sortedBlogs.sort((a, b) => new Date(a.date) - new Date(b.date));
            break;
        case 'title-asc':
            sortedBlogs.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'title-desc':
            sortedBlogs.sort((a, b) => b.title.localeCompare(a.title));
            break;
    }
    
    return sortedBlogs;
}

function updateSearchResultsInfo(count) {
    const resultsInfo = document.getElementById('search-results');
    const resultsCount = document.getElementById('results-count');
    const noResults = document.getElementById('no-results');
    
    if (resultsInfo && resultsCount) {
        if (currentSearch !== '' || currentFilter !== 'all') {
            resultsCount.textContent = count;
            resultsInfo.style.display = 'flex';
        } else {
            resultsInfo.style.display = 'none';
        }
    }
    
    // Show/hide no results message
    if (noResults) {
        if (count === 0 && (currentSearch !== '' || currentFilter !== 'all')) {
            noResults.style.display = 'block';
        } else {
            noResults.style.display = 'none';
        }
    }
}

function clearAllFilters() {
    console.log('Clearing all filters...');
    
    // Reset search
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.value = '';
    }
    currentSearch = '';
    
    // Reset filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === 'all') {
            btn.classList.add('active');
        }
    });
    currentFilter = 'all';
    
    // Reset sort
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.value = 'newest';
    }
    currentSort = 'newest';
    
    // Update UI
    performSearchAndFilter();
}

function displayFeaturedPosts(blogs = blogData.blogs) {
    const featuredContainer = document.getElementById('featured-posts');
    if (!featuredContainer) {
        console.error('Featured posts container not found!');
        return;
    }
    
    featuredContainer.innerHTML = '';
    
    // Check if we have blog data
    if (!blogs || blogs.length === 0) {
        featuredContainer.innerHTML = '<p class="no-posts">No blog data available</p>';
        return;
    }
    
    const featuredPosts = blogs.filter(blog => blog.featured);
    console.log('Displaying featured posts:', featuredPosts.length);
    
    if (featuredPosts.length === 0) {
        featuredContainer.innerHTML = '<p class="no-posts">No featured posts match your search</p>';
        return;
    }
    
    featuredPosts.forEach(post => {
        const postElement = createPostElement(post, true);
        featuredContainer.appendChild(postElement);
    });
}

function displayAllPosts(blogs = blogData.blogs) {
    const blogsContainer = document.getElementById('blogs-container');
    if (!blogsContainer) {
        console.error('Blogs container not found!');
        return;
    }
    
    blogsContainer.innerHTML = '';
    
    // Check if we have blog data
    if (!blogs || blogs.length === 0) {
        blogsContainer.innerHTML = '<p class="no-posts">No blog data available</p>';
        return;
    }
    
    // Don't show featured posts in all blogs to avoid duplication
    const nonFeaturedBlogs = blogs.filter(blog => !blog.featured);
    console.log('Displaying all posts:', nonFeaturedBlogs.length);
    
    if (nonFeaturedBlogs.length === 0 && (currentSearch !== '' || currentFilter !== 'all')) {
        return; // No results message is handled elsewhere
    }
    
    nonFeaturedBlogs.forEach(post => {
        const postElement = createPostElement(post, false);
        blogsContainer.appendChild(postElement);
    });
}

function createPostElement(post, isFeatured) {
    const article = document.createElement('article');
    article.className = `blog-card ${isFeatured ? 'featured' : ''}`;
    
    // Format date
    const postDate = new Date(post.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // Create category tags HTML
    const categoryTagsHTML = post.category.map(cat => 
        `<span class="category-tag">${cat}</span>`
    ).join('');
    
    // Create additional tags HTML
    const tagsHTML = post.tags && post.tags.length > 0 ? 
        post.tags.map(tag => `<span class="tag">${tag}</span>`).join('') : '';
    
    // Create references HTML
    let referencesHTML = '';
    if (post.referenced && post.referenced.length > 0) {
        referencesHTML = `
            <div class="references">
                <h4>References:</h4>
                <div class="reference-links">
                    ${post.referenced.map(ref => 
                        `<a href="${ref}" class="reference-link">${ref.split('/').pop()}</a>`
                    ).join('')}
                </div>
            </div>
        `;
    }
    
    article.innerHTML = `
        ${isFeatured ? '<span class="featured-badge">Featured</span>' : ''}
        <h3>${post.title}</h3>
        <p>${post.description}</p>
        <div class="blog-meta">
            <span>${postDate}</span>
            <span>${post.readTime}</span>
        </div>
        <div class="tags-container">
            ${categoryTagsHTML}
            ${tagsHTML}
        </div>
        ${referencesHTML}
        <a href="${post.link}" class="read-more">
            Read More <i class="fas fa-arrow-right"></i>
        </a>
    `;
    
    return article;
}

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

console.log('TechBlog script loaded successfully!');