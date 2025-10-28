document.addEventListener("DOMContentLoaded", () => {
    let isScrolling = false;

    // Detect scrolling
    document.addEventListener("scroll", () => {
        isScrolling = true;
        setTimeout(() => (isScrolling = false), 200); // Reset after scrolling stops
    });

    // Add touchstart event listener to all elements
    document.querySelectorAll("*").forEach((element) => {
        element.addEventListener("touchstart", () => {
            if (isScrolling) {
                element.classList.add("hover-effect");

                // Remove the hover-effect class after a short delay
                setTimeout(() => element.classList.remove("hover-effect"), 500);
            }
        });
    });

// Global Loading Screen Injection and Controls
(() => {
	// Resolve correct logo path using the existing favicon (works for nested pages)
	function resolveLogoSrc() {
		const favicon = document.querySelector('link[rel="shortcut icon"], link[rel="icon"]');
		if (favicon && favicon.getAttribute('href')) return favicon.getAttribute('href');
		return 'icons and images/biggerstakes v2 logo icon.png';
	}

	function injectLoader() {
		if (document.getElementById('global-loader')) return;

		const style = document.createElement('style');
		style.setAttribute('data-loader-style', '');
		style.textContent = `
			#global-loader { position: fixed; inset: 0; background: rgba(0,0,0,0.92); display: none; align-items: center; justify-content: center; z-index: 99999; }
			#global-loader.visible { display: flex; }
			#global-loader .loader-content { text-align: center; color: #fff; font-family: 'Pixeloid Bold', 'Retro Gaming', Arial, sans-serif; letter-spacing: 1px; }
			#global-loader .logo { width: 120px; height: 120px; object-fit: contain; filter: drop-shadow(0 0 12px rgba(255,255,255,0.15)); animation: bs-pulse 1.4s ease-in-out infinite; }
			#global-loader .tagline { margin-top: 14px; font-size: 18px; opacity: 0.9; }
			@keyframes bs-pulse { 0% { transform: scale(0.96); } 50% { transform: scale(1.05); } 100% { transform: scale(0.96); } }
		`;

		const overlay = document.createElement('div');
		overlay.id = 'global-loader';
		overlay.innerHTML = `
			<div class="loader-content" aria-live="polite" aria-busy="true">
				<img class="logo" alt="BiggerStakes" src="${resolveLogoSrc()}">
				<div class="tagline">Smarter Bets</div>
			</div>
		`;

		document.head.appendChild(style);
		document.body.appendChild(overlay);
	}

	let pendingRequests = 0;
	let loaderShowTimeout = null;

	function showLoader(immediate = false) {
		injectLoader();
		const overlay = document.getElementById('global-loader');
		if (!overlay) return;
		clearTimeout(loaderShowTimeout);
		const reveal = () => overlay.classList.add('visible');
		if (immediate) reveal(); else loaderShowTimeout = setTimeout(reveal, 120);
	}

	function hideLoader() {
		clearTimeout(loaderShowTimeout);
		const overlay = document.getElementById('global-loader');
		if (overlay) overlay.classList.remove('visible');
	}

	// Expose for manual control if needed
	window.BSLoader = { show: showLoader, hide: hideLoader };

	// Show on same-tab navigations
	document.addEventListener('click', (e) => {
		const anchor = e.target.closest('a');
		if (!anchor) return;
		const href = anchor.getAttribute('href');
		const target = anchor.getAttribute('target');
		const isModifier = e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;
		if (!href || href.startsWith('#') || target === '_blank' || isModifier) return;
		// Likely a same-tab navigation
		showLoader(true);
	});

	// Show during form submissions
	document.addEventListener('submit', (e) => {
		const form = e.target;
		if (!(form instanceof HTMLFormElement)) return;
		showLoader(true);
	}, true);

	// Also show on beforeunload as a fallback
	window.addEventListener('beforeunload', () => {
		showLoader(true);
	});

	// Wrap fetch
	if (window.fetch) {
		const originalFetch = window.fetch.bind(window);
		window.fetch = function(...args) {
			pendingRequests++;
			showLoader();
			return originalFetch(...args)
				.finally(() => {
					pendingRequests = Math.max(0, pendingRequests - 1);
					if (pendingRequests === 0) hideLoader();
				});
		};
	}

	// Wrap XMLHttpRequest
	const OriginalXHR = window.XMLHttpRequest;
	if (OriginalXHR) {
		function WrappedXHR() {
			const xhr = new OriginalXHR();
			let opened = false;
			const increment = () => {
				if (!opened) return;
				pendingRequests++;
				showLoader();
			};
			xhr.addEventListener('loadstart', increment);
			xhr.addEventListener('loadend', () => {
				pendingRequests = Math.max(0, pendingRequests - 1);
				if (pendingRequests === 0) hideLoader();
			});
			const originalOpen = xhr.open;
			xhr.open = function(...args) {
				opened = true;
				return originalOpen.apply(xhr, args);
			};
			return xhr;
		}
		window.XMLHttpRequest = WrappedXHR;
	}
})();
});
