(function($) {

	var	$window = $(window),
		$body = $('body'),
		$sidebar = $('#sidebar');

	// Breakpoints.
		breakpoints({
			xlarge:   [ '1281px',  '1680px' ],
			large:    [ '981px',   '1280px' ],
			medium:   [ '737px',   '980px'  ],
			small:    [ '481px',   '736px'  ],
			xsmall:   [ null,      '480px'  ]
		});

	// Hack: Enable IE flexbox workarounds.
		if (browser.name == 'ie')
			$body.addClass('is-ie');

	// Play initial animations on page load.
		$window.on('load', function() {
			window.setTimeout(function() {
				$body.removeClass('is-preload');
			}, 100);
		});

	// Forms.

		// Hack: Activate non-input submits.
			$('form').on('click', '.submit', function(event) {

				// Stop propagation, default.
					event.stopPropagation();
					event.preventDefault();

				// Submit form.
					$(this).parents('form').submit();

			});

	// Sidebar.
		if ($sidebar.length > 0) {

			var $sidebar_a = $sidebar.find('a');

			$sidebar_a
				.addClass('scrolly')
				.on('click', function() {

					var $this = $(this);

					// External link? Bail.
						if ($this.attr('href').charAt(0) != '#')
							return;

					// Deactivate all links.
						$sidebar_a.removeClass('active');

					// Activate link *and* lock it (so Scrollex doesn't try to activate other links as we're scrolling to this one's section).
						$this
							.addClass('active')
							.addClass('active-locked');

				})
				.each(function() {

					var	$this = $(this),
						id = $this.attr('href'),
						$section = $(id);

					// No section for this link? Bail.
						if ($section.length < 1)
							return;

					// Scrollex.
						$section.scrollex({
							mode: 'middle',
							top: '-20vh',
							bottom: '-20vh',
							initialize: function() {

								// Deactivate section.
									$section.addClass('inactive');

							},
							enter: function() {

								// Activate section.
									$section.removeClass('inactive');

								// No locked links? Deactivate all links and activate this section's one.
									if ($sidebar_a.filter('.active-locked').length == 0) {

										$sidebar_a.removeClass('active');
										$this.addClass('active');

									}

								// Otherwise, if this section's link is the one that's locked, unlock it.
									else if ($this.hasClass('active-locked'))
										$this.removeClass('active-locked');

							}
						});

				});

		}

	// Spotlights.
		$('.spotlights > section')
			.scrollex({
				mode: 'middle',
				top: '-10vh',
				bottom: '-10vh',
				initialize: function() {

					// Deactivate section.
						$(this).addClass('inactive');

				},
				enter: function() {

					// Activate section.
						$(this).removeClass('inactive');

				}
			})
			.each(function() {

				var	$this = $(this),
					$image = $this.find('.image'),
					$img = $image.find('img'),
					x;

				// Assign image.
					$image.css('background-image', 'url(' + $img.attr('src') + ')');

				// Set background position.
					if (x = $img.data('position'))
						$image.css('background-position', x);

				// Hide <img>.
					$img.hide();

			});

	// Features.
		$('.features')
			.scrollex({
				mode: 'middle',
				top: '-20vh',
				bottom: '-20vh',
				initialize: function() {

					// Deactivate section.
						$(this).addClass('inactive');

				},
				enter: function() {

					// Activate section.
						$(this).removeClass('inactive');

				}
			});

})(jQuery);

$(document).ready(function(){
	// Navigation and section switching scripts
	$('#nav > ul').dropotron({
		alignment: 'left',
		hideDelay: 350,
		baseZIndex: 100000,
		mode: 'fade'
	});
	window.addEventListener('popstate', function(e) {
		var currentHash = location.hash || '#home';
		$('.section.active').fadeOut(300, function(){
			$(this).removeClass('active');
			$(currentHash).fadeIn(300, function(){
				$(this).addClass('active');
			});
		});
		$('.nav-link').removeClass('active');
		$('.nav-link[href="'+currentHash+'"]').addClass('active');
	});
	
	// Initialize default section display (#home or hash)
	var initialSection = location.hash || '#home';
	$('.section').hide().removeClass('active');
	$(initialSection).fadeIn(300, function(){
		$(this).addClass('active');
	});
	$('.nav-link').removeClass('active');
	$('.nav-link[href="'+initialSection+'"]').addClass('active');
	
	// Navigation click handler for internal links
	$('.nav-link').on('click', function(e){
		var href = $(this).attr('href');
		if(href === "#" || href === "") return;
		// For external links or .html links, navigate normally
		if(href.indexOf('http') === 0 || href.indexOf('.html') !== -1){
			if($(this).attr('target') === '_blank'){
				window.open(href, '_blank');
			} else {
				window.location.href = href;
			}
			return;
		}
		e.preventDefault();
		history.pushState({}, '', href);
		$('.section.active').fadeOut(300, function(){
			$(this).removeClass('active');
			$(href).fadeIn(300, function(){
				$(this).addClass('active');
			});
		});
		$('.nav-link').removeClass('active');
		$('.nav-link[href="'+href+'"]').addClass('active');
	});
	
	// Publications loader: Fetch and display the three most recent publications.
	$.getJSON('data/publications.json', function(data){
		var publications = data.publications;
		// Sort publications by year (assuming year is numeric)
		publications.sort(function(a, b){
			return b.year - a.year;
		});
		// Take the three most recent publications
		var recentPubs = publications.slice(0, 3);
		recentPubs.forEach(function(pub){
			var li = $('<li></li>');
			var title = $('<h3></h3>');
			if(pub.link){
				title.append($('<a></a>').attr('href', pub.link).attr('target', '_blank').text(pub.title));
			} else {
				title.text(pub.title);
			}
			li.append(title);
			
			var meta = $('<div class="pub-meta"></div>');
			meta.html('<span><strong>Authors:</strong> ' + pub.authors.replace(/Hamed Khakzad|Yasaman Karami/g, '<b>$&</b>') + '</span><br>' +
					  '<span><strong>Year:</strong> ' + pub.year + '</span><br>' +
					  (pub.journal ? '<span><strong>Source:</strong> ' + pub.journal + '</span>' : ''));
			li.append(meta);
			
			$('.publication-list').append(li);
		});
	}).fail(function(jqxhr, textStatus, error){
		console.error("Error loading publications:", textStatus, error);
	});
	
	// --- Research Slider Functionality ---
	let currentSlide = 0;
	const slides = $('.research-slider .slide');
	const totalSlides = slides.length;
	
	function showSlide(index) {
		slides.removeClass('active').fadeOut(600);
		slides.eq(index).addClass('active').fadeIn(600);
	}
	
	$('.next').click(function(){
		currentSlide = (currentSlide + 1) % totalSlides;
		showSlide(currentSlide);
	});
	
	$('.prev').click(function(){
		currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
		showSlide(currentSlide);
	});
	
	// Auto-rotate slides every 5 seconds
	setInterval(function(){
		currentSlide = (currentSlide + 1) % totalSlides;
		showSlide(currentSlide);
	}, 5000);
	
	// --- Modal Functionality for Research Topics ---
	// Define detailed content for each topic
	const modalContent = {
		'ai': {
			title: 'Artificial Intelligence',
			description: 'Our AI research dives into cutting-edge neural networks and machine learning techniques, aiming to replicate and surpass human cognitive abilities. This includes advanced research in deep learning and reinforcement learning.',
			image: 'images/research/ai_detail.jpg',
			projects: [
				{ name: 'Project Alpha', members: 'Hamed Khakzad, Omid Mokhtari', details: 'Developing innovative neural architectures for predictive analytics.' },
				{ name: 'Project Beta', members: 'Yasaman Karami', details: 'Exploring ethical AI and its social impact.' }
			]
		},
		'cb': {
			title: 'Computational Biology',
			description: 'In Computational Biology, our team integrates computational methods with biological research to decode genetic information and understand complex biological systems at a deeper level.',
			image: 'images/research/cb_detail.jpg',
			projects: [
				{ name: 'Genome Analysis Project', members: 'Luiz Felipe Piochi, Omid Mokhtari', details: 'Utilizing algorithmic approaches to analyze genomic data.' }
			]
		},
		're': {
			title: 'Renewable Energy',
			description: 'Our renewable energy research focuses on sustainable technology solutions that integrate solar, wind, and other green energy sources into modern infrastructures for a cleaner future.',
			image: 'images/research/re_detail.jpg',
			projects: [
				{ name: 'Solar Integration Initiative', members: 'Margot Weber, Hamed Khakzad', details: 'Designing efficient solar power systems for urban settings.' }
			]
		}
	};
	
	function openModal(topic) {
		const content = modalContent[topic];
		if (!content) return;
		
		let html = `<h2>${content.title}</h2>`;
		html += `<p>${content.description}</p>`;
		if (content.image) {
			html += `<div style="text-align: center; margin: 1rem 0;">
						<img src="${content.image}" alt="${content.title}" style="max-width: 100%; border-radius: 8px;">
					</div>`;
		}
		if (content.projects && content.projects.length > 0) {
			html += `<h3>Ongoing Projects</h3>`;
			content.projects.forEach(proj => {
				html += `<div style="margin-bottom: 1rem; padding: 0.5rem; border-bottom: 1px solid #ffffff33;">
							<strong>${proj.name}</strong><br>
							<em>Members:</em> ${proj.members}<br>
							<span>${proj.details}</span>
						</div>`;
			});
		}
		$('#research-modal .modal-body').html(html);
		$('#research-modal').fadeIn(300);
	}
	
	function closeModal() {
		$('#research-modal').fadeOut(300);
	}
	
	$('.research-topics li').on('click', function(){
		const topic = $(this).data('topic');
		openModal(topic);
	});
	
	$('#research-modal .close').on('click', function(){
		closeModal();
	});
	
	$(window).on('click', function(event){
		if ($(event.target).is('#research-modal')) {
			closeModal();
		}
	});
}); // end document ready

// --- Contact Popup Script ---
function copyContact(event, email, twitterURL, linkedinURL, website) {
	const existingPopup = document.querySelector('.contact-popup');
	if (existingPopup) existingPopup.remove();
	
	let popupContent = '<div class="popup-content">';
	popupContent += `<button onclick="handleContactAction('mail', '${email}')">
				<i class="fas fa-envelope"></i>
				</button>`;
	if(twitterURL && twitterURL.trim() !== ""){
		popupContent += `<button onclick="handleContactAction('twitter', '${twitterURL}')">
					<i class="fab fa-twitter"></i>
				</button>`;
	}
	if(linkedinURL && linkedinURL.trim() !== ""){
		popupContent += `<button onclick="handleContactAction('linkedin', '${linkedinURL}')">
					<i class="fab fa-linkedin"></i>
				</button>`;
	}
	if(website && website.trim() !== ""){
		popupContent += `<button onclick="handleContactAction('website', '${website}')">
					<i class="fas fa-globe"></i>
				</button>`;
	}
	popupContent += '</div>';
	
	const popup = document.createElement('div');
	popup.className = 'contact-popup';
	popup.innerHTML = popupContent;

	if (!document.getElementById('contact-popup-styles')) {
		const style = document.createElement('style');
		style.id = 'contact-popup-styles';
		style.textContent = `
		.contact-popup {
			position: fixed;
			z-index: 1000;
			background: rgba(32, 49, 61, 0.95);
			border-radius: 8px;
			backdrop-filter: blur(4px);
			box-shadow: 0 4px 12px rgba(0,0,0,0.2);
			transition: opacity 0.2s ease;
			padding: 8px;
		}
		.popup-content {
			display: flex;
			gap: 8px;
		}
		.contact-popup button {
			background: transparent;
			color: white;
			border: 1px solid rgba(255,255,255,0.2);
			padding: 8px 16px;
			border-radius: 4px;
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
			transition: all 0.2s ease;
		}
		.contact-popup button:hover {
			background: rgba(255,255,255,0.1);
			border-color: rgba(255,255,255,0.3);
		}
		.notification {
			position: fixed;
			bottom: 20px;
			right: 20px;
			padding: 12px 24px;
			background: rgba(46, 150, 146, 0.95);
			color: white;
			border-radius: 4px;
			opacity: 0;
			transform: translateY(20px);
			transition: all 0.3s ease;
		}
		.notification.show {
			opacity: 1;
			transform: translateY(0);
		}
		`;
		document.head.appendChild(style);
	}

	document.body.appendChild(popup);
	const rect = event.target.getBoundingClientRect();
	popup.style.top = `${rect.bottom + 8}px`;
	popup.style.left = `${rect.left}px`;

	function closePopup(e) {
		if (!popup.contains(e.target) && e.target !== event.target) {
			popup.style.opacity = '0';
			setTimeout(() => popup.remove(), 200);
			document.removeEventListener('click', closePopup);
		}
	}
	setTimeout(() => document.addEventListener('click', closePopup), 0);
	return false;
}

function handleContactAction(action, data) {
	if (action === 'mail') {
		window.location.href = `mailto:${data}`;
	} else if (action === 'twitter' || action === 'linkedin' || action === 'website') {
		if (data && data.trim() !== "") window.open(data, '_blank');
	}
}

function showNotification(message) {
	const notification = document.createElement('div');
	notification.className = 'notification';
	notification.textContent = message;
	document.body.appendChild(notification);
	
	setTimeout(() => notification.classList.add('show'), 10);
	setTimeout(() => {
		notification.classList.remove('show');
		setTimeout(() => notification.remove(), 300);
	}, 2000);
}
