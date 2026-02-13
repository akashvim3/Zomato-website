/**
 * Zomato - Professional JavaScript
 * Handles all interactive functionality
 */

(function () {
    'use strict';

    // ==========================================================================
    // Configuration
    // ==========================================================================

    const CONFIG = {
        lazyLoadThreshold: 0.1,
        scrollThreshold: 300,
        searchDebounceDelay: 300,
        toastDuration: 3000,
        animationDuration: 300
    };

    // ==========================================================================
    // DOM Elements Cache
    // ==========================================================================

    const $ = (selector) => document.querySelector(selector);
    const $$ = (selector) => document.querySelectorAll(selector);

    // ==========================================================================
    // Utility Functions
    // ==========================================================================

    const utils = {
        // Debounce function for performance
        debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },

        // Throttle function
        throttle(func, limit) {
            let inThrottle;
            return function (...args) {
                if (!inThrottle) {
                    func.apply(this, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        },

        // Generate unique ID
        generateId() {
            return '_' + Math.random().toString(36).substr(2, 9);
        },

        // Check if element is in viewport
        isInViewport(element) {
            const rect = element.getBoundingClientRect();
            return (
                rect.top >= 0 &&
                rect.left >= 0 &&
                rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                rect.right <= (window.innerWidth || document.documentElement.clientWidth)
            );
        },

        // Smooth scroll to element
        scrollToElement(element, offset = 0) {
            const top = element.getBoundingClientRect().top + window.pageYOffset - offset;
            window.scrollTo({ top, behavior: 'smooth' });
        },

        // Parse query string
        getQueryParams() {
            const params = new URLSearchParams(window.location.search);
            const obj = {};
            for (const [key, value] of params) {
                obj[key] = value;
            }
            return obj;
        }
    };

    // ==========================================================================
    // Toast Notification System
    // ==========================================================================

    class Toast {
        constructor() {
            this.container = $('.toast-container');
            if (!this.container) {
                this.createContainer();
            }
        }

        createContainer() {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }

        show(message, type = 'info', duration = CONFIG.toastDuration) {
            const toastId = utils.generateId();
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.id = toastId;

            const icons = {
                success: 'fa-check-circle',
                error: 'fa-exclamation-circle',
                info: 'fa-info-circle',
                warning: 'fa-exclamation-triangle'
            };

            toast.innerHTML = `
                <i class="fas ${icons[type]} toast-icon" aria-hidden="true"></i>
                <span class="toast-message">${message}</span>
                <button class="toast-close" aria-label="Close notification">
                    <i class="fas fa-times" aria-hidden="true"></i>
                </button>
            `;

            this.container.appendChild(toast);

            // Trigger animation
            setTimeout(() => toast.classList.add('show'), 10);

            // Close button handler
            toast.querySelector('.toast-close').addEventListener('click', () => {
                this.hide(toastId);
            });

            // Auto hide
            if (duration > 0) {
                setTimeout(() => this.hide(toastId), duration);
            }

            return toastId;
        }

        hide(toastId) {
            const toast = $(`#${toastId}`);
            if (toast) {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), CONFIG.animationDuration);
            }
        }

        success(message, duration) {
            return this.show(message, 'success', duration);
        }

        error(message, duration) {
            return this.show(message, 'error', duration);
        }

        info(message, duration) {
            return this.show(message, 'info', duration);
        }
    }

    // ==========================================================================
    // Modal Manager
    // ==========================================================================

    class ModalManager {
        constructor() {
            this.activeModal = null;
            this.init();
        }

        init() {
            // Modal open buttons
            document.addEventListener('click', (e) => {
                const modalTrigger = e.target.closest('[data-modal]');
                if (modalTrigger) {
                    e.preventDefault();
                    this.open(modalTrigger.dataset.modal);
                }
            });

            // Modal close buttons and overlay
            document.addEventListener('click', (e) => {
                if (e.target.classList.contains('modal-overlay') ||
                    e.target.closest('.modal-close')) {
                    this.close();
                }
            });

            // Escape key to close
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.activeModal) {
                    this.close();
                }
            });

            // Close on outside click
            document.addEventListener('click', (e) => {
                if (this.activeModal && e.target === $(`#${this.activeModal}`)) {
                    this.close();
                }
            });
        }

        open(modalId) {
            const modal = $(`#${modalId}`);
            if (!modal) return;

            this.close();
            modal.classList.add('active');
            modal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
            this.activeModal = modalId;

            // Focus trap for accessibility
            const focusableElements = modal.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            if (focusableElements.length > 0) {
                focusableElements[0].focus();
            }

            // Add animation class
            modal.querySelector('.modal-container').classList.add('animate-in');
        }

        close() {
            if (!this.activeModal) return;

            const modal = $(`#${this.activeModal}`);
            if (modal) {
                modal.classList.remove('active');
                modal.setAttribute('aria-hidden', 'true');
                modal.querySelector('.modal-container').classList.remove('animate-in');
            }

            document.body.style.overflow = '';
            this.activeModal = null;
        }
    }

    // ==========================================================================
    // Lazy Loading System
    // ==========================================================================

    class LazyLoader {
        constructor() {
            this.init();
        }

        init() {
            if ('IntersectionObserver' in window) {
                this.observer = new IntersectionObserver(
                    this.handleIntersection.bind(this),
                    {
                        root: null,
                        rootMargin: '50px',
                        threshold: CONFIG.lazyLoadThreshold
                    }
                );

                // Observe all lazy images
                $$('.lazy-image').forEach(img => {
                    if (img.dataset.src) {
                        this.observer.observe(img);
                    }
                });
            } else {
                // Fallback for older browsers
                this.loadAllImages();
            }
        }

        handleIntersection(entries, observer) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadImage(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }

        loadImage(img) {
            if (!img.dataset.src) return;

            const tempImage = new Image();
            tempImage.onload = () => {
                img.src = img.dataset.src;
                img.classList.add('loaded');
                img.removeAttribute('data-src');
            };
            tempImage.onerror = () => {
                // Set placeholder on error
                img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23f0f0f0" width="400" height="300"/%3E%3Ctext fill="%23aaa" font-family="sans-serif" font-size="20" x="50%25" y="50%25" text-anchor="middle"%3EImage not available%3C/text%3E%3C/svg%3E';
                img.classList.add('loaded');
            };
            tempImage.src = img.dataset.src;
        }

        loadAllImages() {
            $$('.lazy-image').forEach(img => this.loadImage(img));
        }
    }

    // ==========================================================================
    // Search Functionality
    // ==========================================================================

    class SearchHandler {
        constructor() {
            this.searchInput = $('#search-input');
            this.locationInput = $('#location-input');
            this.suggestionsContainer = $('.search-suggestions');
            this.locations = [
                'Delhi NCR', 'Mumbai', 'Bangalore', 'Hyderabad', 'Pune',
                'Chennai', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Lucknow',
                'Connaught Place, New Delhi', 'Cyber City, Gurgaon',
                'Sector 29, Gurgaon', 'Rajouri Garden, New Delhi', 'Saket, New Delhi'
            ];
            this.searchQueries = [
                'Pizza', 'Burger', 'Biryani', 'Chinese', 'South Indian',
                'North Indian', 'Italian', 'Desserts', 'Sushi', 'Street Food',
                'The Big Chill Cafe', 'Bukhara', 'Saravana Bhavan', 'Social'
            ];
            this.init();
        }

        init() {
            if (this.searchInput) {
                this.searchInput.addEventListener('input',
                    utils.debounce(this.handleSearch.bind(this), CONFIG.searchDebounceDelay));
                this.searchInput.addEventListener('focus', this.showSuggestions.bind(this));
                document.addEventListener('click', (e) => {
                    if (!e.target.closest('.search-field')) {
                        this.hideSuggestions();
                    }
                });
            }

            if (this.locationInput) {
                this.locationInput.addEventListener('focus', () => {
                    this.showLocationSuggestions();
                });
            }
        }

        handleSearch(e) {
            const query = e.target.value.trim().toLowerCase();
            if (query.length < 2) {
                this.hideSuggestions();
                return;
            }

            const filtered = this.searchQueries.filter(item =>
                item.toLowerCase().includes(query)
            );

            this.showSearchSuggestions(filtered, query);
        }

        showSuggestions() {
            if (this.searchInput && this.searchInput.value.trim().length === 0) {
                this.showSearchSuggestions(this.searchQueries.slice(0, 5), '');
            }
        }

        showSearchSuggestions(items, query) {
            if (!this.suggestionsContainer) return;

            if (items.length === 0) {
                this.hideSuggestions();
                return;
            }

            const html = items.map(item => {
                const highlighted = query
                    ? item.replace(new RegExp(`(${query})`, 'gi'), '<strong>$1</strong>')
                    : item;
                return `
                    <div class="suggestion-item" role="option" aria-selected="false">
                        <i class="fas fa-search" aria-hidden="true"></i>
                        <span>${highlighted}</span>
                    </div>
                `;
            }).join('');

            this.suggestionsContainer.innerHTML = html;
            this.suggestionsContainer.classList.add('active');

            // Add click handlers
            this.suggestionsContainer.querySelectorAll('.suggestion-item').forEach(item => {
                item.addEventListener('click', () => {
                    this.searchInput.value = item.querySelector('span').textContent;
                    this.hideSuggestions();
                    this.performSearch();
                });
            });
        }

        showLocationSuggestions() {
            if (!this.suggestionsContainer) return;

            const html = this.locations.map(location => `
                <div class="suggestion-item" role="option" aria-selected="false">
                    <i class="fas fa-map-marker-alt" aria-hidden="true"></i>
                    <span>${location}</span>
                </div>
            `).join('');

            this.suggestionsContainer.innerHTML = html;
            this.suggestionsContainer.classList.add('active');

            this.suggestionsContainer.querySelectorAll('.suggestion-item').forEach(item => {
                item.addEventListener('click', () => {
                    this.locationInput.value = item.querySelector('span').textContent;
                    this.hideSuggestions();
                });
            });
        }

        hideSuggestions() {
            if (this.suggestionsContainer) {
                this.suggestionsContainer.classList.remove('active');
            }
        }

        performSearch() {
            const query = this.searchInput.value.trim();
            if (query) {
                const toast = new Toast();
                toast.info(`Searching for "${query}"...`);
                // In a real app, this would redirect to search results
                // window.location.href = `/search?q=${encodeURIComponent(query)}`;
            }
        }
    }

    // ==========================================================================
    // Mobile Navigation
    // ==========================================================================

    class MobileNav {
        constructor() {
            this.menuBtn = $('.mobile-menu-btn');
            this.mobileNav = $('.mobile-nav');
            this.closeBtn = $('.close-btn');
            this.init();
        }

        init() {
            if (this.menuBtn && this.mobileNav) {
                this.menuBtn.addEventListener('click', () => this.open());
                this.closeBtn.addEventListener('click', () => this.close());

                // Close on link click
                this.mobileNav.querySelectorAll('.mobile-nav-item').forEach(item => {
                    item.addEventListener('click', () => this.close());
                });
            }
        }

        open() {
            this.mobileNav.classList.add('active');
            this.mobileNav.setAttribute('aria-hidden', 'false');
            this.menuBtn.setAttribute('aria-expanded', 'true');
            document.body.style.overflow = 'hidden';
        }

        close() {
            this.mobileNav.classList.remove('active');
            this.mobileNav.setAttribute('aria-hidden', 'true');
            this.menuBtn.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        }
    }

    // ==========================================================================
    // Horizontal Scroll Navigation
    // ==========================================================================

    class ScrollNavigator {
        constructor(containerSelector, prevBtnSelector, nextBtnSelector) {
            this.container = $(containerSelector);
            this.prevBtn = $(prevBtnSelector);
            this.nextBtn = $(nextBtnSelector);
            this.scrollAmount = 280;
            this.init();
        }

        init() {
            if (!this.container || !this.prevBtn || !this.nextBtn) return;

            this.prevBtn.addEventListener('click', () => this.scrollLeft());
            this.nextBtn.addEventListener('click', () => this.scrollRight());

            // Update button visibility on scroll
            this.container.addEventListener('scroll',
                utils.throttle(() => this.updateButtons(), 100));
        }

        scrollLeft() {
            this.container.scrollBy({ left: -this.scrollAmount, behavior: 'smooth' });
        }

        scrollRight() {
            this.container.scrollBy({ left: this.scrollAmount, behavior: 'smooth' });
        }

        updateButtons() {
            // Could add logic to disable buttons at scroll boundaries
        }
    }

    // ==========================================================================
    // Accordion Component
    // ==========================================================================

    class Accordion {
        constructor(selector = '.accordion') {
            this.accordions = $$(selector);
            this.init();
        }

        init() {
            this.accordions.forEach(accordion => {
                const header = accordion.querySelector('.accordion-header');
                if (header) {
                    header.addEventListener('click', () => this.toggle(accordion));

                    // Keyboard accessibility
                    header.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            this.toggle(accordion);
                        }
                    });
                }
            });
        }

        toggle(accordion) {
            const header = accordion.querySelector('.accordion-header');
            const content = accordion.querySelector('.accordion-content');
            const isActive = header.classList.contains('active');

            // Close all accordions in same group
            this.accordions.forEach(acc => {
                if (acc !== accordion) {
                    acc.querySelector('.accordion-header').classList.remove('active');
                    const accContent = acc.querySelector('.accordion-content');
                    if (accContent) {
                        accContent.classList.remove('open');
                        accContent.hidden = true;
                    }
                }
            });

            // Toggle current accordion
            header.classList.toggle('active');
            if (content) {
                content.classList.toggle('open');
                content.hidden = !content.hidden;
            }

            // Update aria-expanded
            header.setAttribute('aria-expanded', !isActive);
        }
    }

    // ==========================================================================
    // Restaurant Card Interactions
    // ==========================================================================

    class RestaurantCards {
        constructor() {
            this.init();
        }

        init() {
            // Bookmark buttons
            document.addEventListener('click', (e) => {
                const bookmarkBtn = e.target.closest('.bookmark-btn');
                if (bookmarkBtn) {
                    e.preventDefault();
                    this.toggleBookmark(bookmarkBtn);
                }

                const quickViewBtn = e.target.closest('.quick-view-btn');
                if (quickViewBtn) {
                    e.preventDefault();
                    const card = quickViewBtn.closest('.restaurant-card');
                    this.showQuickView(card);
                }
            });
        }

        toggleBookmark(btn) {
            btn.classList.toggle('active');
            const icon = btn.querySelector('i');
            const isSaved = btn.classList.contains('active');

            if (isSaved) {
                icon.classList.remove('far');
                icon.classList.add('fas');
                new Toast().success('Restaurant saved!');
            } else {
                icon.classList.remove('fas');
                icon.classList.add('far');
            }
        }

        showQuickView(card) {
            if (!card) return;

            const name = card.querySelector('.restaurant-name')?.textContent;
            const cuisine = card.querySelector('.restaurant-cuisine')?.textContent;
            const rating = card.querySelector('.rating-badge')?.textContent;
            const ratings = card.querySelector('.rating-count')?.textContent;
            const cost = card.querySelector('.cost')?.textContent;
            const time = card.querySelector('.delivery-time')?.textContent;
            const offer = card.querySelector('.discount-badge')?.textContent;
            const imgSrc = card.querySelector('.restaurant-image img')?.dataset.src;

            // Update modal content
            const modal = $('#restaurant-modal');
            if (modal) {
                modal.querySelector('#modal-restaurant-name').textContent = name;
                modal.querySelector('#modal-cuisine').textContent = cuisine;
                modal.querySelector('#modal-rating').textContent = rating;
                modal.querySelector('#modal-ratings').textContent = ratings;
                modal.querySelector('#modal-cost').textContent = cost;
                modal.querySelector('#modal-time').textContent = time;
                modal.querySelector('#modal-offer-text').textContent = offer || 'No current offers';

                const modalImg = modal.querySelector('#modal-restaurant-image');
                if (modalImg) {
                    modalImg.src = imgSrc;
                    modalImg.alt = name;
                }

                // Open modal
                const modalManager = new ModalManager();
                modalManager.open('restaurant-modal');
            }
        }
    }

    // ==========================================================================
    // App Download Form
    // ==========================================================================

    class AppDownloadForm {
        constructor() {
            this.form = $('.app-download-form');
            this.emailInput = $('.email-input-container');
            this.phoneInput = $('.phone-input-container');
            this.radioButtons = $$('input[name="contact-method"]');
            this.init();
        }

        init() {
            if (!this.form) return;

            // Radio button change handler
            this.radioButtons.forEach(radio => {
                radio.addEventListener('change', (e) => {
                    if (e.target.value === 'email') {
                        this.emailInput.classList.remove('hidden');
                        this.phoneInput.classList.add('hidden');
                    } else {
                        this.emailInput.classList.add('hidden');
                        this.phoneInput.classList.remove('hidden');
                    }
                });
            });

            // Form submission
            this.form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSubmit();
            });
        }

        handleSubmit() {
            const selectedMethod = $('input[name="contact-method"]:checked')?.value;
            const toast = new Toast();

            if (selectedMethod === 'email') {
                const email = $('#app-email')?.value;
                if (email && this.validateEmail(email)) {
                    toast.success(`App link sent to ${email}!`);
                    this.form.reset();
                } else {
                    toast.error('Please enter a valid email address');
                }
            } else {
                const phone = $('#app-phone')?.value;
                if (phone && this.validatePhone(phone)) {
                    toast.success(`App link sent to ${phone}!`);
                    this.form.reset();
                } else {
                    toast.error('Please enter a valid phone number');
                }
            }
        }

        validateEmail(email) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        }

        validatePhone(phone) {
            return /^\+?[\d\s-]{10,}$/.test(phone);
        }
    }

    // ==========================================================================
    // Auth Forms
    // ==========================================================================

    class AuthForms {
        constructor() {
            this.loginForm = $('#login-form');
            this.signupForm = $('#signup-form');
            this.passwordToggles = $$('.password-toggle');
            this.init();
        }

        init() {
            // Password visibility toggle
            this.passwordToggles.forEach(btn => {
                btn.addEventListener('click', () => this.togglePassword(btn));
            });

            // Login form
            if (this.loginForm) {
                this.loginForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleLogin();
                });
            }

            // Signup form
            if (this.signupForm) {
                this.signupForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleSignup();
                });
            }
        }

        togglePassword(btn) {
            const input = btn.parentElement.querySelector('input');
            const icon = btn.querySelector('i');

            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        }

        handleLogin() {
            const email = $('#login-email')?.value;
            const password = $('#login-password')?.value;
            const toast = new Toast();

            if (email && password) {
                // Simulate login
                toast.success('Login successful!');
                setTimeout(() => {
                    new ModalManager().close();
                }, 1500);
            } else {
                toast.error('Please fill in all fields');
            }
        }

        handleSignup() {
            const name = $('#signup-name')?.value;
            const email = $('#signup-email')?.value;
            const phone = $('#signup-phone')?.value;
            const password = $('#signup-password')?.value;
            const toast = new Toast();

            if (name && email && phone && password) {
                if (password.length < 6) {
                    toast.error('Password must be at least 6 characters');
                    return;
                }
                toast.success('Account created successfully!');
                setTimeout(() => {
                    new ModalManager().close();
                }, 1500);
            } else {
                toast.error('Please fill in all fields');
            }
        }
    }

    // ==========================================================================
    // Navbar Scroll Handler
    // ==========================================================================

    class NavbarScrollHandler {
        constructor() {
            this.navbar = $('.navbar');
            this.scrollThreshold = 50;
            this.init();
        }

        init() {
            if (!this.navbar) return;

            window.addEventListener('scroll',
                utils.throttle(() => this.handleScroll(), 100));
        }

        handleScroll() {
            if (window.pageYOffset > this.scrollThreshold) {
                this.navbar.classList.add('scrolled');
            } else {
                this.navbar.classList.remove('scrolled');
            }
        }
    }

    // ==========================================================================
    // Back to Top Button
    // ==========================================================================

    class BackToTop {
        constructor() {
            this.btn = $('.back-to-top');
            this.threshold = CONFIG.scrollThreshold;
            this.init();
        }

        init() {
            if (!this.btn) return;

            window.addEventListener('scroll',
                utils.throttle(() => this.handleScroll(), 100));

            this.btn.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }

        handleScroll() {
            if (window.pageYOffset > this.threshold) {
                this.btn.classList.add('show');
            } else {
                this.btn.classList.remove('show');
            }
        }
    }

    // ==========================================================================
    // Food Categories Filter
    // ==========================================================================

    class CategoryFilter {
        constructor() {
            this.categories = $$('.food-category');
            this.init();
        }

        init() {
            this.categories.forEach(category => {
                category.addEventListener('click', () => this.select(category));
                category.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        this.select(category);
                    }
                });
            });
        }

        select(category) {
            this.categories.forEach(c => c.classList.remove('active'));
            category.classList.add('active');

            const categoryName = category.querySelector('.category-name')?.textContent;
            const toast = new Toast();
            toast.info(`Showing ${categoryName} restaurants...`);
        }
    }

    // ==========================================================================
    // Loading Manager
    // ==========================================================================

    class LoadingManager {
        constructor() {
            this.overlay = $('.loading-overlay');
        }

        show() {
            if (this.overlay) {
                this.overlay.classList.add('active');
            }
        }

        hide() {
            if (this.overlay) {
                this.overlay.classList.remove('active');
            }
        }
    }

    // ==========================================================================
    // Localities Show More
    // ==========================================================================

    class LocalitiesToggle {
        constructor() {
            this.btn = $('.show-more-btn');
            this.expanded = false;
            this.init();
        }

        init() {
            if (this.btn) {
                this.btn.addEventListener('click', () => this.toggle());
            }
        }

        toggle() {
            this.expanded = !this.expanded;
            this.btn.classList.toggle('expanded', this.expanded);

            const icon = this.btn.querySelector('i');
            const text = this.btn.querySelector('span');

            if (this.expanded) {
                icon.classList.remove('fa-chevron-down');
                icon.classList.add('fa-chevron-up');
                text.textContent = 'see less';
            } else {
                icon.classList.remove('fa-chevron-up');
                icon.classList.add('fa-chevron-down');
                text.textContent = 'see more';
            }
        }
    }

    // ==========================================================================
    // Image Error Handler
    // ==========================================================================

    class ImageErrorHandler {
        constructor() {
            this.init();
        }

        init() {
            document.addEventListener('error', (e) => {
                if (e.target.tagName === 'IMG') {
                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23f8f8f8" width="400" height="300"/%3E%3Ctext fill="%23bbb" font-family="sans-serif" font-size="18" x="50%25" y="50%25" text-anchor="middle"%3EImage unavailable%3C/text%3E%3C/svg%3E';
                    e.target.classList.add('loaded');
                }
            }, true);
        }
    }

    // ==========================================================================
    // Newsletter/Footer Form
    // ==========================================================================

    class NewsletterForm {
        constructor() {
            // Could be extended for newsletter subscription
        }
    }

    // ==========================================================================
    // Smooth Scroll for Anchor Links
    // ==========================================================================

    class SmoothScroll {
        constructor() {
            this.init();
        }

        init() {
            document.addEventListener('click', (e) => {
                const link = e.target.closest('a[href^="#"]');
                if (link) {
                    e.preventDefault();
                    const target = $(link.getAttribute('href'));
                    if (target) {
                        utils.scrollToElement(target, 80);
                    }
                }
            });
        }
    }

    // ==========================================================================
    // Initialization
    // ==========================================================================

    class App {
        constructor() {
            this.toast = new Toast();
            this.modal = new ModalManager();
            this.loading = new LoadingManager();
            this.init();
        }

        init() {
            // Initialize all components
            document.addEventListener('DOMContentLoaded', () => {
                new LazyLoader();
                new SearchHandler();
                new MobileNav();
                new RestaurantCards();
                new AppDownloadForm();
                new AuthForms();
                new BackToTop();
                new CategoryFilter();
                new Accordion();
                new LocalitiesToggle();
                new ImageErrorHandler();
                new SmoothScroll();

                // Initialize navbar scroll handler
                new NavbarScrollHandler();

                // Initialize scroll navigators
                new ScrollNavigator('.category-scroll-container', '.category-nav .prev-btn', '.category-nav .next-btn');
                new ScrollNavigator('.collections-scroll-container', '.collection-nav .prev-btn', '.collection-nav .next-btn');
                new ScrollNavigator('.restaurant-scroll-container', '.restaurant-nav .prev-btn', '.restaurant-nav .next-btn');
                new ScrollNavigator('.testimonials-scroll-container', '.testimonial-nav .prev-btn', '.testimonial-nav .next-btn');

                // Console welcome message
                console.log('%c🍔 Zomato Clone', 'font-size: 24px; font-weight: bold; color: #ef4f5f;');
                console.log('%cMade with ❤️ by Developer', 'font-size: 12px; color: #696969;');
            });
        }
    }

    // Initialize app
    new App();

})();
