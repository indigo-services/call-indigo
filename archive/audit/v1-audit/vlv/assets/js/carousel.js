$(function () {
    var owl = $('.client-reviews-con .owl-carousel');
    owl.owlCarousel({
        margin: 30,
        nav: false,
        loop: true,
        dots: true,
        autoplay: true,
        autoplayTimeout: 4500,
        responsive: {
            0: {
                items: 1
            },
            576: {
                items: 1
            },
            768: {
                items: 2
            },
            992: {
                items: 3
            }
        }
    })
})

$(function () {
    var owl = $('.before-after-gallery-con .owl-carousel');
    owl.owlCarousel({
        margin: 10,
        nav: false,
        loop: true,
        dots: true,
        autoplay: true,
        autoplayTimeout: 4500,
        responsive: {
            0: {
                items: 1
            },
            576: {
                items: 1
            },
            768: {
                items: 1
            },
            992: {
                items: 1
            }
        }
    })
})
$(function () {
    var owl = $('.services-con .owl-carousel');
    owl.owlCarousel({
        margin: 30,
        nav: false,
        loop: true,
        dots: true,
        autoplay: true,
        autoplayTimeout: 4500,
        responsive: {
            0: {
                items: 1
            },
            576: {
                items: 1
            },
            768: {
                items: 2
            },
            992: {
                items: 3
            },
            1200: {
                items: 4
            }
        }
    })
})
$(document).on('click', '#calcPrice', function () {
    var base = parseFloat($('#service').val());
    var urgency = parseFloat($('#urgency').val());
    var property = parseFloat($('#property').val());

    var finalPrice = Math.round(base * urgency * property);
    $('#price').text('$' + finalPrice);
});


// photo gallery script
$(document).on('click', '[data-target="#lightbox"]', function () {
    var $lightbox = $('#lightbox'),
        $img = $(this).find('img'),
        src = $img.attr('src'),
        alt = $img.attr('alt'),
        css = {
            'maxWidth': $(window).width() - 100,
            'maxHeight': $(window).height() - 100
        };
    $lightbox.find('img').attr('src', src).attr('alt', alt).css(css);
}).on('shown.bs.modal', '#lightbox', function () {
    var $img = $(this).find('img');
    $(this).find('.modal-dialog').css({
        'width': $img.width()
    });
    $(this).find('.close').removeClass('hidden');
});

// photo gallery script
if ($('#popupImage').length) {
    var images = [ /*...*/
            "assets/images/gallery-img1.jpg",
            "assets/images/gallery-img2.jpg",
            "assets/images/gallery-img3.jpg",
            "assets/images/gallery-img4.jpg",
            "assets/images/gallery-img5.jpg",
            "assets/images/gallery-img6.jpg",
            "assets/images/gallery-img7.jpg",
        ],
        currentIndex = 0;

    $(document).on('click', '#popupImage', function () {
        $(this).attr('src', images[currentIndex]);
        currentIndex = (currentIndex + 1) % images.length;
    });
}

// Grab input and button
const zipInput = document.getElementById('mail');
const checkBtn = document.getElementById('checkZipBtn');
if (checkBtn !== null) {
checkBtn.addEventListener('click', function (event) {
    event.preventDefault(); // Prevent default link behavior

    const zip = zipInput.value.trim();

    if (zip === "") {
        alert("Please enter a ZIP code.");
        return;
    }

    // Basic ZIP code validation (US ZIP 5 digits)
    const zipRegex = /^\d{5}$/;
    if (!zipRegex.test(zip)) {
        alert("Please enter a valid 5-digit ZIP code.");
        return;
    }

    // For demonstration: show a message (you can replace this with any action)
    alert("Checking services for ZIP code: " + zip);

    // Example: If you want to redirect dynamically based on ZIP
    // window.location.href = `services.html?zip=${zip}`;
});
}