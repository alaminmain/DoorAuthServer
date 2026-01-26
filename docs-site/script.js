// ============================================
// NAVIGATION SCROLL EFFECT
// ============================================
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// ============================================
// SMOOTH SCROLL FOR NAVIGATION LINKS
// ============================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href !== '#' && href.startsWith('#')) {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                const navHeight = document.querySelector('.navbar').offsetHeight;
                const targetPosition = target.offsetTop - navHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });

                // Update active nav link
                updateActiveNavLink(href);
            }
        }
    });
});

// ============================================
// UPDATE ACTIVE NAVIGATION LINK
// ============================================
function updateActiveNavLink(activeHref) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === activeHref) {
            link.classList.add('active');
        }
    });
}

// ============================================
// INTERSECTION OBSERVER FOR ACTIVE SECTION
// ============================================
const sections = document.querySelectorAll('section[id]');
const observerOptions = {
    root: null,
    rootMargin: '-100px 0px -80% 0px',
    threshold: 0
};

const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');
            updateActiveNavLink(`#${id}`);
        }
    });
}, observerOptions);

sections.forEach(section => {
    sectionObserver.observe(section);
});

// ============================================
// FRAMEWORK SELECTOR
// ============================================
const frameworkButtons = document.querySelectorAll('.framework-btn');
const frameworkContents = document.querySelectorAll('.framework-content');

frameworkButtons.forEach(button => {
    button.addEventListener('click', () => {
        const framework = button.getAttribute('data-framework');
        
        // Update active button
        frameworkButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Show corresponding content
        frameworkContents.forEach(content => {
            content.classList.remove('active');
            if (content.id === `${framework}-integration`) {
                content.classList.add('active');
            }
        });
        
        // Store preference
        localStorage.setItem('preferredFramework', framework);
    });
});

// Restore framework preference
const preferredFramework = localStorage.getItem('preferredFramework');
if (preferredFramework) {
    const preferredButton = document.querySelector(`[data-framework="${preferredFramework}"]`);
    if (preferredButton) {
        preferredButton.click();
    }
}

// ============================================
// CODE COPY FUNCTIONALITY
// ============================================
function copyCode(button) {
    const codeBlock = button.parentElement;
    const code = codeBlock.querySelector('code');
    const text = code.textContent;
    
    // Copy to clipboard
    navigator.clipboard.writeText(text).then(() => {
        // Visual feedback
        const originalHTML = button.innerHTML;
        button.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
            </svg>
        `;
        button.classList.add('copied');
        
        // Reset after 2 seconds
        setTimeout(() => {
            button.innerHTML = originalHTML;
            button.classList.remove('copied');
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy code:', err);
        alert('Failed to copy code. Please copy manually.');
    });
}

// ============================================
// CHECKLIST PERSISTENCE
// ============================================
const checkboxes = document.querySelectorAll('.checkbox-item input[type="checkbox"]');

// Load saved checklist state
checkboxes.forEach((checkbox, index) => {
    const saved = localStorage.getItem(`checklist-${index}`);
    if (saved === 'true') {
        checkbox.checked = true;
    }
    
    // Save state on change
    checkbox.addEventListener('change', () => {
        localStorage.setItem(`checklist-${index}`, checkbox.checked);
        
        // Check if all are completed
        const allChecked = Array.from(checkboxes).every(cb => cb.checked);
        if (allChecked) {
            showCompletionMessage();
        }
    });
});

// ============================================
// COMPLETION MESSAGE
// ============================================
function showCompletionMessage() {
    const message = document.createElement('div');
    message.className = 'completion-toast';
    message.innerHTML = `
        <div style="
            position: fixed;
            bottom: 32px;
            right: 32px;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 20px 32px;
            border-radius: 12px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            font-weight: 600;
            font-size: 16px;
            z-index: 10000;
            animation: slideInRight 0.4s ease-out;
        ">
            🎉 Congratulations! Integration complete!
        </div>
    `;
    
    document.body.appendChild(message);
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(400px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(400px); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    // Remove after 5 seconds
    setTimeout(() => {
        message.firstElementChild.style.animation = 'slideOutRight 0.4s ease-out';
        setTimeout(() => {
            message.remove();
        }, 400);
    }, 5000);
}

// ============================================
// ANIMATE ON SCROLL
// ============================================
const animateOnScroll = () => {
    const elements = document.querySelectorAll('.feature-card, .step, .doc-card, .api-category');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, index * 100);
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    });
    
    elements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        observer.observe(element);
    });
};

// Initialize animations when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', animateOnScroll);
} else {
    animateOnScroll();
}

// ============================================
// STATS COUNTER ANIMATION
// ============================================
const animateCounters = () => {
    const counters = document.querySelectorAll('.stat-value');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = entry.target;
                const text = target.textContent;
                
                // Only animate if it's a number
                if (!isNaN(parseInt(text))) {
                    const finalValue = parseInt(text);
                    const duration = 2000;
                    const steps = 60;
                    const stepValue = finalValue / steps;
                    let currentValue = 0;
                    
                    const timer = setInterval(() => {
                        currentValue += stepValue;
                        if (currentValue >= finalValue) {
                            target.textContent = text; // Restore original (might have +, %, etc.)
                            clearInterval(timer);
                        } else {
                            target.textContent = Math.floor(currentValue);
                        }
                    }, duration / steps);
                }
                
                observer.unobserve(target);
            }
        });
    }, { threshold: 0.5 });
    
    counters.forEach(counter => observer.observe(counter));
};

/* ============================================
   LANGUAGE SWITCHER LOGIC
   ============================================ */
const initLanguageSwitcher = () => {
  const langBtns = document.querySelectorAll('.lang-btn');
  const translatableElements = document.querySelectorAll('[data-en]');
  
  const setLanguage = (lang) => {
    document.documentElement.setAttribute('lang', lang);
    localStorage.setItem('doorauth_lang', lang);
    
    // Update buttons
    langBtns.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
    });
    
    // Update text
    translatableElements.forEach(el => {
      const translation = el.getAttribute(`data-${lang}`);
      if (translation) {
        // Handle special cases like innerHTML for gradients if needed
        if (el.querySelector('.gradient-text')) {
          const gradientSpan = el.querySelector('.gradient-text').outerHTML;
          const textWithoutGradient = translation.replace('DoorAuth', '');
          el.innerHTML = `${textWithoutGradient} ${gradientSpan}`;
        } else {
          el.textContent = translation;
        }
      }
    });
  };
  
  langBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.getAttribute('data-lang');
      setLanguage(lang);
    });
  });
  
  // Initialize from storage or default
  const savedLang = localStorage.getItem('doorauth_lang') || 'en';
  setLanguage(savedLang);
};

// Initialize everything on load
document.addEventListener('DOMContentLoaded', () => {
  // Assuming these functions are defined elsewhere in the full document
  // initNavbar();
  // initFrameworkSelector(); // This is handled by the frameworkButtons.forEach at the top
  // initChecklist(); // This is handled by the checkboxes.forEach
  // initCopyButtons(); // This is handled by the copyCode function being called on click
  
  // Call the explicit initialization functions
  animateOnScroll(); // Renamed from initScrollAnimations
  animateCounters(); // Renamed from initStatsCounter
  
  initLanguageSwitcher(); // Add this
});

// ============================================
// KEYBOARD SHORTCUTS
// ============================================
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K to focus search (if you add search later)
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        // Future: Focus search input
    }
    
    // Escape to close any open modals
    if (e.key === 'Escape') {
        // Future: Close modals
    }
});

// ============================================
// EXTERNAL LINK INDICATOR
// ============================================
document.querySelectorAll('a[target="_blank"]').forEach(link => {
    if (!link.querySelector('svg')) {
        link.style.position = 'relative';
        link.style.paddingRight = '20px';
        
        const icon = document.createElement('span');
        icon.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="position: absolute; right: 0; top: 50%; transform: translateY(-50%);">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
        `;
        link.appendChild(icon);
    }
});

// ============================================
// PERFORMANCE MONITORING
// ============================================
if ('PerformanceObserver' in window) {
    const perfObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
            if (entry.entryType === 'largest-contentful-paint') {
                console.log('LCP:', entry.renderTime || entry.loadTime);
            }
        }
    });
    
    try {
        perfObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
        // Browser doesn't support this metric
    }
}

// ============================================
// THEME TOGGLE (Future Enhancement)
// ============================================
const initThemeToggle = () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
};

// Initialize theme
initThemeToggle();

// ============================================
// PRINT STYLES HELPER
// ============================================
window.addEventListener('beforeprint', () => {
    document.body.classList.add('printing');
});

window.addEventListener('afterprint', () => {
    document.body.classList.remove('printing');
});

// ============================================
// CONSOLE EASTER EGG
// ============================================
console.log('%c🚪 DoorAuth Documentation', 'font-size: 24px; font-weight: bold; color: #667eea;');
console.log('%cInterested in contributing? Check out our GitHub repo!', 'font-size: 14px; color: #6b7280;');
console.log('%chttps://github.com/alaminmain/DoorAuthServer', 'font-size: 14px; color: #667eea; text-decoration: underline;');

// ============================================
// SERVICE WORKER REGISTRATION (Future PWA)
// ============================================
if ('serviceWorker' in navigator) {
    // Future: Register service worker for offline support
    // navigator.serviceWorker.register('/sw.js');
}

// ============================================
// ANALYTICS (Future Enhancement)
// ============================================
const trackEvent = (category, action, label) => {
    // Future: Send to analytics
    console.log('Event:', category, action, label);
};

// Track button clicks
document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', () => {
        trackEvent('Button', 'Click', btn.textContent.trim());
    });
});

// Track framework selection
frameworkButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        trackEvent('Framework', 'Select', btn.getAttribute('data-framework'));
    });
});

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Debounce function for performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle function for scroll events
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Check if element is in viewport
function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

// ============================================
// INITIALIZATION COMPLETE
// ============================================
console.log('%c✅ DoorAuth Docs Initialized', 'color: #10b981; font-weight: bold;');
