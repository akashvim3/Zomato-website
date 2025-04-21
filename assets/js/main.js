// Feather Icons initialization
feather.replace();

// Accordion functionality
document.addEventListener('DOMContentLoaded', function() {
  const accordions = document.querySelectorAll('.accordion');
  
  accordions.forEach(accordion => {
    const header = accordion.querySelector('.accordion-container');
    const icon = accordion.querySelector('.fa-chevron-down');
    const content = accordion.querySelector('.accordion-data');
    
    header.addEventListener('click', () => {
      content.classList.toggle('show');
      icon.classList.toggle('animate');
    });
  });
  
  // Location Search Functionality
  const locationInput = document.querySelector('.location-input');
  const searchBox = document.querySelector('.search_box');
  
  // Example locations for autocomplete
  const locations = [
    'Connaught Place, New Delhi',
    'Cyber City, Gurgaon',
    'Sector 29, Gurgaon',
    'Rajouri Garden, New Delhi',
    'Saket, New Delhi'
  ];
  
  // Search functionality
  searchBox.addEventListener('input', function() {
    // Implementation for search functionality would go here
    console.log('Searching for:', this.value);
  });
  
  // Mobile navigation menu toggle
  const mobileMenuBtn = document.createElement('div');
  mobileMenuBtn.className = 'mobile-menu-btn';
  mobileMenuBtn.innerHTML = '<i data-feather="menu"></i>';
  
  const nav = document.querySelector('nav');
  nav.appendChild(mobileMenuBtn);
  
  feather.replace();
  
  mobileMenuBtn.addEventListener('click', function() {
    const mobileNav = document.querySelector('.mobile-nav');
    mobileNav.classList.toggle('show-mobile-nav');
  });
  
  // App download form submission
  const appLinkForm = document.querySelector('.email-input');
  const emailInput = document.querySelector('.email');
  const shareBtn = document.querySelector('.btn');
  
  shareBtn.addEventListener('click', function(e) {
    e.preventDefault();
    
    if (emailInput.value.trim() !== '') {
      // Show success message
      const successMsg = document.createElement('div');
      successMsg.className = 'success-message';
      successMsg.textContent = 'App link sent successfully!';
      
      appLinkForm.appendChild(successMsg);
      
      // Clear message after 3 seconds
      setTimeout(() => {
        successMsg.remove();
        emailInput.value = '';
      }, 3000);
    }
  });
  
  // Lazy loading for images
  const lazyImages = document.querySelectorAll('.lazy-image');
  
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.remove('lazy-image');
          imageObserver.unobserve(img);
        }
      });
    });
    
    lazyImages.forEach(img => {
      imageObserver.observe(img);
    });
  }
  
  // Food category filter
  const foodCategories = document.querySelectorAll('.food-category');
  if (foodCategories.length > 0) {
    foodCategories.forEach(category => {
      category.addEventListener('click', function() {
        // Remove active class from all categories
        foodCategories.forEach(c => c.classList.remove('active'));
        
        // Add active class to clicked category
        this.classList.add('active');
        
        // Filter logic would go here
        console.log('Selected category:', this.textContent);
      });
    });
  }
  
  // Show back-to-top button when scrolled down
  const backToTopBtn = document.querySelector('.back-to-top');
  if (backToTopBtn) {
    window.addEventListener('scroll', function() {
      if (window.pageYOffset > 300) {
        backToTopBtn.classList.add('show');
      } else {
        backToTopBtn.classList.remove('show');
      }
    });
    
    backToTopBtn.addEventListener('click', function() {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }
});


