// Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyDlK6wJrOHVMYK1rHad2PiSj-X-GJYZjEI",
    authDomain: "birthdayinvi-cc08f.firebaseapp.com",
    databaseURL: "https://birthdayinvi-cc08f-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "birthdayinvi-cc08f",
    storageBucket: "birthdayinvi-cc08f.firebasestorage.app",
    messagingSenderId: "111670688222",
    appId: "1:111670688222:web:89a90a8f2a2d9c0465054f",
    measurementId: "G-LPY8B5FY1B"
};

// Khởi tạo Firebase
let database = null;

// Đợi Firebase SDK load xong
function initializeFirebase() {
    if (typeof firebase !== 'undefined') {
        try {
            // Kiểm tra xem app đã được khởi tạo chưa
            let app;
            try {
                app = firebase.app();
                console.log('Firebase app đã tồn tại, sử dụng app hiện có');
            } catch (e) {
                // App chưa tồn tại, khởi tạo mới
                app = firebase.initializeApp(firebaseConfig);
                console.log('Firebase app đã được khởi tạo mới');
            }
            
            // Khởi tạo database
            database = firebase.database(app);
            
            // Test connection
            database.ref('.info/connected').once('value')
                .then(() => {
                    console.log('Firebase Realtime Database đã kết nối thành công');
                })
                .catch((error) => {
                    console.error('Lỗi kết nối Firebase Database:', error);
                    console.log('Vui lòng kiểm tra:');
                    console.log('1. Realtime Database đã được tạo trong Firebase Console chưa?');
                    console.log('2. Database URL có đúng không?');
                    console.log('3. Rules có cho phép truy cập không?');
                });
        } catch (error) {
            console.error('Lỗi khởi tạo Firebase:', error);
            if (error.code === 'app/duplicate-app') {
                // App đã tồn tại, lấy app hiện có
                const app = firebase.app();
                database = firebase.database(app);
                console.log('Sử dụng Firebase app đã tồn tại');
            }
        }
    } else {
        // Nếu chưa có, thử lại sau 100ms
        setTimeout(initializeFirebase, 100);
    }
}

// Khởi tạo khi DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeFirebase);
} else {
    initializeFirebase();
}

// YouTube Player
let youtubePlayer = null;
let isMusicPlaying = false;
let shouldAutoPlay = false; // Flag để tự động phát khi player ready
let isPlayerReady = false; // Flag để biết player đã sẵn sàng chưa
let retryCount = 0; // Đếm số lần retry
let youtubeAPILoaded = false; // Flag để biết YouTube API đã load chưa
const MAX_RETRY = 5; // Số lần retry tối đa
const YOUTUBE_VIDEO_ID = 'jq2pn8b6q-A'; // ID từ link: https://www.youtube.com/watch?v=jq2pn8b6q-A

// Hàm load YouTube API khi user tương tác
function loadYouTubeAPI() {
    if (youtubeAPILoaded) return;
    
    youtubeAPILoaded = true;
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    document.head.appendChild(script);
}

// Hàm khởi tạo YouTube Player khi API sẵn sàng
// Phải là global function để YouTube API có thể gọi
window.onYouTubeIframeAPIReady = function() {
    if (typeof YT !== 'undefined' && YT.Player) {
        youtubePlayer = new YT.Player('youtube-player', {
            height: '0',
            width: '0',
            videoId: YOUTUBE_VIDEO_ID,
            playerVars: {
                'autoplay': 0, // Tắt autoplay để tránh Zalo preview
                'controls': 0,
                'disablekb': 1,
                'enablejsapi': 1,
                'fs': 0,
                'iv_load_policy': 3,
                'loop': 1,
                'modestbranding': 1,
                'playsinline': 1,
                'rel': 0,
                'showinfo': 0,
                'mute': 0 // Không mute
            },
            events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange
            }
        });
    } else {
        console.error('YouTube API chưa sẵn sàng');
    }
};

// Khi player sẵn sàng
function onPlayerReady(event) {
    console.log('YouTube Player đã sẵn sàng');
    isPlayerReady = true;
    retryCount = 0; // Reset retry count
    
    // Kiểm tra xem card đã mở chưa
    const card = document.getElementById('card');
    const isCardOpened = card && card.classList.contains('opened');
    
    // Nếu cần tự động phát hoặc card đã mở, thử phát nhạc
    if (shouldAutoPlay || isCardOpened) {
        attemptPlayMusic(event.target, true);
    }
}

// Hàm thử phát nhạc với retry
function attemptPlayMusic(player, isAutoPlay = false) {
    if (!player || !isPlayerReady) {
        console.log('Player chưa sẵn sàng');
        return;
    }
    
    try {
        const currentState = player.getPlayerState();
        console.log('Player state:', currentState);
        
        // Nếu đang phát rồi thì không cần làm gì
        if (currentState === YT.PlayerState.PLAYING) {
            isMusicPlaying = true;
            updateMusicButton(true);
            return;
        }
        
        // Thử phát video
        player.playVideo();
        retryCount = 0;
        
        // Kiểm tra lại sau 1 giây
        setTimeout(() => {
            const state = player.getPlayerState();
            if (state === YT.PlayerState.PLAYING) {
                isMusicPlaying = true;
                updateMusicButton(true);
                console.log('Nhạc đã phát thành công');
            } else if (state === YT.PlayerState.UNSTARTED || 
                      state === YT.PlayerState.CUED || 
                      state === YT.PlayerState.PAUSED) {
                // Nếu chưa phát được và chưa vượt quá số lần retry
                if (retryCount < MAX_RETRY) {
                    retryCount++;
                    console.log(`Retry phát nhạc lần ${retryCount}`);
                    setTimeout(() => {
                        attemptPlayMusic(player, isAutoPlay);
                    }, 1000 * retryCount); // Tăng delay mỗi lần retry
                } else {
                    console.log('Không thể phát nhạc sau nhiều lần thử');
                }
            }
        }, 1000);
    } catch (error) {
        console.error('Lỗi phát nhạc:', error);
        if (retryCount < MAX_RETRY) {
            retryCount++;
            setTimeout(() => {
                attemptPlayMusic(player, isAutoPlay);
            }, 1000 * retryCount);
        }
    }
}

// Hàm cập nhật trạng thái nút nhạc
function updateMusicButton(playing) {
    const musicBtn = document.getElementById('musicBtn');
    if (musicBtn) {
        if (playing) {
            musicBtn.classList.add('playing');
        } else {
            musicBtn.classList.remove('playing');
        }
    }
}

// Khi trạng thái player thay đổi
function onPlayerStateChange(event) {
    const state = event.data;
    
    if (state === YT.PlayerState.PLAYING) {
        isMusicPlaying = true;
        updateMusicButton(true);
        retryCount = 0; // Reset retry khi đã phát thành công
    } else if (state === YT.PlayerState.PAUSED || 
               state === YT.PlayerState.ENDED) {
        isMusicPlaying = false;
        updateMusicButton(false);
    } else if (state === YT.PlayerState.BUFFERING) {
        // Đang buffer, giữ nguyên trạng thái
        console.log('Đang tải nhạc...');
    } else if (state === YT.PlayerState.CUED) {
        // Video đã được cue, thử phát
        if (shouldAutoPlay) {
            setTimeout(() => {
                if (youtubePlayer) {
                    youtubePlayer.playVideo();
                }
            }, 500);
        }
    }
}

// Hàm phát nhạc
function playMusic() {
    if (!youtubePlayer) {
        console.log('YouTube player chưa được khởi tạo');
        shouldAutoPlay = true;
        return;
    }
    
    if (!isPlayerReady) {
        console.log('Player chưa sẵn sàng, sẽ phát sau');
        shouldAutoPlay = true;
        return;
    }
    
    attemptPlayMusic(youtubePlayer, false);
}

// Hàm dừng nhạc
function pauseMusic() {
    if (youtubePlayer && youtubePlayer.pauseVideo) {
        try {
            youtubePlayer.pauseVideo();
            isMusicPlaying = false;
            const musicBtn = document.getElementById('musicBtn');
            if (musicBtn) {
                musicBtn.classList.remove('playing');
            }
        } catch (error) {
            console.error('Lỗi dừng nhạc:', error);
        }
    }
}

// Hàm toggle nhạc
function toggleMusic() {
    if (isMusicPlaying) {
        pauseMusic();
    } else {
        playMusic();
    }
}

// Hàm lấy tên từ URL parameter
function getGuestName() {
    const urlParams = new URLSearchParams(window.location.search);
    const name = urlParams.get('name');
    return name ? decodeURIComponent(name) : '';
}

// Hàm hiển thị tên trong envelope
function displayGuestName() {
    const name = getGuestName();
    const envelopeName = document.getElementById('envelopeName');
    const guestNameOutside = document.getElementById('guestNameOutside');
    const guestNameInside = document.getElementById('guestNameInside');
    
    if (name) {
        // Hiển thị tên trong envelope
        if (envelopeName) {
            envelopeName.textContent = name;
        }
        
        // Hiển thị tên bên ngoài thiệp
        if (guestNameOutside) {
            guestNameOutside.textContent = name;
            guestNameOutside.style.display = 'block';
        }
        
        // Hiển thị tên bên trong thiệp
        if (guestNameInside) {
            guestNameInside.textContent = name;
            guestNameInside.style.display = 'block';
        }
    } else {
        // Nếu không có tên, ẩn các phần tử
        if (envelopeName) envelopeName.style.display = 'none';
        if (guestNameOutside) guestNameOutside.style.display = 'none';
        if (guestNameInside) guestNameInside.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Hiển thị tên khách mời
    displayGuestName();
    
    const card = document.getElementById('card');
    const closeBtn = document.getElementById('closeBtn');
    const rejectBtn = document.getElementById('rejectBtn');
    const shinCImage = document.getElementById('shinCImage');
    const shinCContainer = document.getElementById('shinCContainer');
    const musicBtn = document.getElementById('musicBtn');
    const wishContainer = document.getElementById('wishContainer');
    const wishCloseBtn = document.getElementById('wishCloseBtn');
    const wishForm = document.getElementById('wishForm');
    const wishSubmitBtn = document.getElementById('wishSubmitBtn');
    const wishSuccess = document.getElementById('wishSuccess');

    // Xử lý click vào hình shin_c
    shinCImage.addEventListener('click', function() {
        // Load YouTube API khi user tương tác lần đầu (tránh Zalo preview)
        loadYouTubeAPI();
        
        // Ẩn hình shin_c
        shinCContainer.style.display = 'none';
        // Hiện envelope trực tiếp
        const envelopeContainer = document.getElementById('envelopeContainer');
        envelopeContainer.style.display = 'flex';
    });

    // Xử lý nút đóng thiệp - mở form gửi lời chúc
    closeBtn.addEventListener('click', function() {
        // Mở form gửi lời chúc
        if (wishContainer) {
            wishContainer.style.display = 'flex';
        }
    });
    
    // Hàm đóng thiệp và reset
    function closeCardAndReset() {
        // Đóng thiệp
        card.classList.remove('opened');
        
        // Dừng hiệu ứng tuyết rơi
        stopSnowfall();
        
        // Dừng nhạc và reset flag
        pauseMusic();
        shouldAutoPlay = false;
        
        // Reset story scroll về đầu
        const storyScroll = document.getElementById('storyScroll');
        if (storyScroll) {
            storyScroll.scrollTop = 0;
        }
        
        // Reset thiep scroll về đầu
        const thiepScrollContainer = document.getElementById('thiepScrollContainer');
        if (thiepScrollContainer) {
            thiepScrollContainer.scrollTop = 0;
        }
        
        // Reset scroll indicator
        const scrollIndicatorThiep = document.getElementById('scrollIndicatorThiep');
        if (scrollIndicatorThiep) {
            scrollIndicatorThiep.classList.remove('hidden');
        }
        
        // Reset envelope
        const envelopeContainer = document.getElementById('envelopeContainer');
        const envelopeFlap = document.getElementById('envelopeFlap');
        const envelopeHint = document.querySelector('.envelope-hint');
        if (envelopeContainer && envelopeFlap) {
            envelopeContainer.style.display = 'none';
            envelopeFlap.classList.remove('opened');
            envelopeContainer.classList.remove('opened');
            if (envelopeHint) {
                envelopeHint.style.opacity = '1';
            }
        }
        
        // Hiện lại hình shin_c
        shinCContainer.style.display = 'flex';
    }

    // Hàm hiển thị hiệu ứng cảm ơn
    function showThankEffect() {
        const thankContainer = document.getElementById('thankContainer');
        const thankHeart = document.getElementById('thankHeart');
        const thankText = document.getElementById('thankText');
        
        if (!thankContainer) return;
        
        // Hiển thị container cảm ơn
        thankContainer.style.display = 'flex';
        
        // Sau 3 giây, đóng thiệp và reset
        setTimeout(() => {
            thankContainer.style.display = 'none';
            closeCardAndReset();
        }, 3000);
    }

    // Xử lý scroll indicator cho story
    const storyScroll = document.getElementById('storyScroll');
    const scrollIndicator = document.querySelector('.scroll-indicator');
    
    if (storyScroll && scrollIndicator) {
        storyScroll.addEventListener('scroll', function() {
            // Ẩn indicator khi scroll xuống
            if (storyScroll.scrollTop > 20) {
                scrollIndicator.style.opacity = '0';
            } else {
                scrollIndicator.style.opacity = '0.7';
            }
        });
    }

    // Xử lý scroll cho thiep sections với hiệu ứng parallax
    const thiepScrollContainer = document.getElementById('thiepScrollContainer');
    const scrollIndicatorThiep = document.getElementById('scrollIndicatorThiep');
    const thiepSections = document.querySelectorAll('.thiep-section');
    const thiepImages = document.querySelectorAll('.thiep-image');
    
    if (thiepScrollContainer && thiepSections.length > 0) {
        // Section đầu tiên hiển thị ngay từ đầu
        if (thiepSections[0]) {
            thiepSections[0].classList.add('visible', 'active');
        }
        
        let lastScrollTop = 0;
        let ticking = false;
        
        // Hàm kiểm tra và thêm hiệu ứng cho các section khi scroll
        function handleThiepScroll() {
            const scrollTop = thiepScrollContainer.scrollTop;
            const containerHeight = thiepScrollContainer.clientHeight;
            const scrollDirection = scrollTop > lastScrollTop ? 'down' : 'up';
            lastScrollTop = scrollTop;
            
            // Ẩn scroll indicator khi đã cuộn xuống
            if (scrollTop > 50) {
                if (scrollIndicatorThiep) {
                    scrollIndicatorThiep.classList.add('hidden');
                }
            } else {
                if (scrollIndicatorThiep) {
                    scrollIndicatorThiep.classList.remove('hidden');
                }
            }
            
            // Kiểm tra từng section và thêm hiệu ứng
            thiepSections.forEach((section, index) => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.offsetHeight;
                const sectionBottom = sectionTop + sectionHeight;
                const sectionCenter = sectionTop + sectionHeight / 2;
                const viewportCenter = scrollTop + containerHeight / 2;
                
                // Tính toán vị trí tương đối của section trong viewport
                const distanceFromCenter = viewportCenter - sectionCenter;
                const maxDistance = containerHeight / 2 + sectionHeight / 2;
                const scrollProgress = Math.min(Math.abs(distanceFromCenter) / maxDistance, 1);
                
                // Nếu section nằm trong viewport
                if (scrollTop + containerHeight >= sectionTop - 150 && 
                    scrollTop <= sectionBottom + 150) {
                    section.classList.add('visible');
                    
                    // Thêm class scrolling-in nếu section đang ở giữa viewport
                    if (Math.abs(distanceFromCenter) < sectionHeight / 2) {
                        section.classList.add('scrolling-in');
                        section.classList.remove('scrolling-out', 'scroll-past');
                    } else if (scrollDirection === 'down' && scrollTop > sectionBottom - containerHeight) {
                        section.classList.add('scroll-past');
                        section.classList.remove('scrolling-in', 'scrolling-out');
                    } else {
                        section.classList.add('scrolling-out');
                        section.classList.remove('scrolling-in', 'scroll-past');
                    }
                    
                    // Hiệu ứng parallax cho ảnh
                    const image = section.querySelector('.thiep-image');
                    if (image) {
                        // Tính toán offset parallax dựa trên vị trí scroll
                        const parallaxOffset = distanceFromCenter * 0.3;
                        const scale = 1 - scrollProgress * 0.1;
                        const opacity = 1 - scrollProgress * 0.3;
                        
                        image.style.transform = `translateY(${parallaxOffset}px) scale(${Math.max(scale, 0.9)})`;
                        image.style.opacity = Math.max(opacity, 0.7);
                    }
                } else {
                    // Reset khi section ra khỏi viewport
                    section.classList.remove('scrolling-in', 'scrolling-out', 'scroll-past');
                    const image = section.querySelector('.thiep-image');
                    if (image && index > 0) { // Giữ section đầu tiên
                        image.style.transform = '';
                        image.style.opacity = '';
                    }
                }
            });
            
            ticking = false;
        }
        
        // Tối ưu hiệu năng với requestAnimationFrame
        function requestTick() {
            if (!ticking) {
                requestAnimationFrame(handleThiepScroll);
                ticking = true;
            }
        }
        
        // Gọi hàm khi scroll
        thiepScrollContainer.addEventListener('scroll', requestTick, { passive: true });
        
        // Gọi hàm lần đầu để kiểm tra section đầu tiên
        handleThiepScroll();
    }

    // Xử lý click vào envelope để mở nắp
    const envelope = document.getElementById('envelope');
    const envelopeFlap = document.getElementById('envelopeFlap');
    const envelopeContainer = document.getElementById('envelopeContainer');
    
    if (envelope && envelopeFlap && envelopeContainer) {
        envelope.addEventListener('click', function() {
            // Đánh dấu cần tự động phát nhạc
            shouldAutoPlay = true;
            
            // Đánh dấu cần tự động phát nhạc
            shouldAutoPlay = true;
            
            // Thử phát nhạc ngay khi có tương tác (để bypass autoplay policy)
            if (isPlayerReady && youtubePlayer) {
                attemptPlayMusic(youtubePlayer, true);
            }
            
            // Mở nắp envelope
            envelopeFlap.classList.add('opened');
            envelopeContainer.classList.add('opened');
            
            // Ẩn hint khi đã mở
            const envelopeHint = document.querySelector('.envelope-hint');
            if (envelopeHint) {
                envelopeHint.style.opacity = '0';
            }
            
            // Sau khi mở nắp và bông hoa mọc lên, hiện card-back
            setTimeout(() => {
                envelopeContainer.style.display = 'none';
                card.classList.add('opened');
                // Bắt đầu hiệu ứng tuyết rơi
                startSnowfall();
                
                // Đảm bảo nhạc phát sau khi card mở
                if (isPlayerReady && youtubePlayer) {
                    setTimeout(() => {
                        attemptPlayMusic(youtubePlayer, true);
                    }, 500);
                } else {
                    // Nếu player chưa ready, sẽ tự động phát trong onPlayerReady
                    shouldAutoPlay = true;
                }
            }, 2000);
        });
    }

    // Xử lý nút điều khiển nhạc
    if (musicBtn) {
        musicBtn.addEventListener('click', function() {
            toggleMusic();
        });
    }

    // Xử lý form gửi lời chúc
    // Thêm nút mở form vào nút đóng thiệp
    if (closeBtn) {
        const originalCloseHandler = closeBtn.onclick;
        closeBtn.addEventListener('click', function(e) {
            // Mở form gửi lời chúc trước khi đóng thiệp
            if (wishContainer) {
                wishContainer.style.display = 'flex';
            }
        });
    }

    // Đóng form gửi lời chúc
    if (wishCloseBtn) {
        wishCloseBtn.addEventListener('click', function() {
            if (wishContainer) {
                wishContainer.style.display = 'none';
                wishForm.reset();
                wishSuccess.style.display = 'none';
            }
        });
    }

    // Xử lý submit form
    if (wishForm) {
        wishForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const wishMessage = document.getElementById('wishMessage').value.trim();
            const wishName = document.getElementById('wishName').value.trim();
            
            if (!wishMessage) {
                alert('Vui lòng nhập lời chúc!');
                return;
            }

            // Disable nút submit
            if (wishSubmitBtn) {
                wishSubmitBtn.disabled = true;
                wishSubmitBtn.textContent = 'Đang gửi...';
            }

            // Lấy tên khách mời từ URL
            const guestName = getGuestName() || 'Khách';

            // Tạo dữ liệu để lưu
            const wishData = {
                message: wishMessage,
                name: wishName || 'Ẩn danh',
                guestName: guestName,
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                date: new Date().toISOString()
            };

            // Kiểm tra Firebase đã sẵn sàng chưa
            if (!database) {
                // Nếu chưa có, thử khởi tạo lại
                if (typeof firebase !== 'undefined') {
                    try {
                        firebase.initializeApp(firebaseConfig);
                        database = firebase.database();
                    } catch (error) {
                        console.error('Lỗi khởi tạo Firebase:', error);
                        alert('Lỗi kết nối Firebase. Vui lòng kiểm tra cấu hình!');
                        if (wishSubmitBtn) {
                            wishSubmitBtn.disabled = false;
                            wishSubmitBtn.textContent = 'Gửi lời chúc';
                        }
                        return;
                    }
                } else {
                    alert('Firebase SDK chưa được tải. Vui lòng tải lại trang!');
                    if (wishSubmitBtn) {
                        wishSubmitBtn.disabled = false;
                        wishSubmitBtn.textContent = 'Gửi lời chúc';
                    }
                    return;
                }
            }

            // Kiểm tra database có sẵn sàng không
            if (!database) {
                alert('Database chưa sẵn sàng. Vui lòng thử lại!');
                if (wishSubmitBtn) {
                    wishSubmitBtn.disabled = false;
                    wishSubmitBtn.textContent = 'Gửi lời chúc';
                }
                return;
            }

            // Lưu vào Firebase Realtime Database
            const wishesRef = database.ref('wishes');
            wishesRef.push(wishData)
                .then(() => {
                    // Thành công
                    wishSuccess.style.display = 'block';
                    wishForm.reset();
                    
                    // Ẩn form sau 2 giây và hiện hiệu ứng cảm ơn
                    setTimeout(() => {
                        wishContainer.style.display = 'none';
                        wishSuccess.style.display = 'none';
                        
                        // Hiển thị hiệu ứng cảm ơn
                        showThankEffect();
                    }, 2000);
                })
                .catch((error) => {
                    console.error('Lỗi khi gửi lời chúc:', error);
                    let errorMessage = 'Có lỗi xảy ra khi gửi lời chúc. ';
                    
                    if (error.code === 'PERMISSION_DENIED') {
                        errorMessage += 'Lỗi: Không có quyền ghi dữ liệu. Vui lòng kiểm tra Firebase Rules!';
                    } else if (error.code === 'UNAVAILABLE') {
                        errorMessage += 'Lỗi: Database không khả dụng. Vui lòng kiểm tra Firebase Console!';
                    } else {
                        errorMessage += 'Chi tiết: ' + error.message;
                    }
                    
                    alert(errorMessage);
                })
                .finally(() => {
                    // Enable lại nút submit
                    if (wishSubmitBtn) {
                        wishSubmitBtn.disabled = false;
                        wishSubmitBtn.textContent = 'Gửi lời chúc';
                    }
                });
        });
    }

    // Xử lý nút từ chối
    if (rejectBtn) {
        rejectBtn.addEventListener('click', function() {
            showRejectEffect();
        });
    }

    // Hàm hiển thị hiệu ứng từ chối
    function showRejectEffect() {
        const rejectContainer = document.getElementById('rejectContainer');
        const rejectFist = document.getElementById('rejectFist');
        const cayDaoImage = document.getElementById('cayDaoImage');
        const rejectFinger = document.getElementById('rejectFinger');
        const rejectMeme4 = document.getElementById('rejectMeme4');
        const rejectMeme5 = document.getElementById('rejectMeme5');
        const rejectText = document.getElementById('rejectText');
        const bloodSplatter = document.getElementById('bloodSplatter');
        
        if (!rejectContainer) return;
        
        // Reset tất cả về trạng thái ban đầu
        if (rejectFist) rejectFist.style.display = 'block';
        if (cayDaoImage) cayDaoImage.style.display = 'none';
        if (rejectFinger) rejectFinger.style.display = 'none';
        if (rejectMeme4) rejectMeme4.style.display = 'none';
        if (rejectMeme5) rejectMeme5.style.display = 'none';
        if (rejectText) rejectText.style.display = 'none';
        if (bloodSplatter) bloodSplatter.innerHTML = '';
        
        // Hiển thị container
        rejectContainer.style.display = 'flex';
        
        // Bước 1: Hiện meme_1 (0s)
        // Đã hiện với animation
        
        // Bước 2: Ẩn meme_1, hiện meme_2 (sau 1s)
        setTimeout(() => {
            if (rejectFist) rejectFist.style.display = 'none';
            if (cayDaoImage) {
                cayDaoImage.style.display = 'block';
                // Tạo máu phun khi meme_2 xuất hiện
                if (bloodSplatter) createBloodSplatter(bloodSplatter);
            }
        }, 1000);
        
        // Bước 3: Ẩn meme_2, hiện meme_3 (sau 2s)
        setTimeout(() => {
            if (cayDaoImage) cayDaoImage.style.display = 'none';
            if (rejectFinger) rejectFinger.style.display = 'block';
        }, 2000);
        
        // Bước 4: Ẩn meme_3, hiện meme_4 (sau 3s)
        setTimeout(() => {
            if (rejectFinger) rejectFinger.style.display = 'none';
            if (rejectMeme4) rejectMeme4.style.display = 'block';
        }, 3000);
        
        // Bước 5: Ẩn meme_4, hiện meme_5 (sau 4s)
        setTimeout(() => {
            if (rejectMeme4) rejectMeme4.style.display = 'none';
            if (rejectMeme5) rejectMeme5.style.display = 'block';
        }, 4000);
        
        // Bước 6: Hiện chữ (sau 5s)
        setTimeout(() => {
            if (rejectText) rejectText.style.display = 'block';
        }, 5000);
        
        // Tự động đóng sau 8 giây
        setTimeout(() => {
            rejectContainer.style.display = 'none';
            if (bloodSplatter) bloodSplatter.innerHTML = '';
            // Reset lại
            if (rejectFist) rejectFist.style.display = 'block';
            if (cayDaoImage) cayDaoImage.style.display = 'none';
            if (rejectFinger) rejectFinger.style.display = 'none';
            if (rejectMeme4) rejectMeme4.style.display = 'none';
            if (rejectMeme5) rejectMeme5.style.display = 'none';
            if (rejectText) rejectText.style.display = 'none';
        }, 8000);
    }

    // Hàm tạo hiệu ứng máu phun
    function createBloodSplatter(container) {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const numDrops = 50; // Số lượng giọt máu
        
        for (let i = 0; i < numDrops; i++) {
            const drop = document.createElement('div');
            drop.className = 'blood-drop';
            
            // Tính toán góc và khoảng cách ngẫu nhiên
            const angle = (Math.PI * 2 * i) / numDrops + Math.random() * 0.5;
            const distance = 200 + Math.random() * 300;
            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance;
            
            drop.style.left = centerX + 'px';
            drop.style.top = centerY + 'px';
            drop.style.setProperty('--splash-x', x + 'px');
            drop.style.setProperty('--splash-y', y + 'px');
            drop.style.animationDelay = (Math.random() * 0.3) + 's';
            
            // Kích thước ngẫu nhiên
            const size = 6 + Math.random() * 8;
            drop.style.width = size + 'px';
            drop.style.height = size + 'px';
            
            container.appendChild(drop);
        }
    }

    // Hàm tạo hiệu ứng tuyết rơi
    function createSnowflake() {
        const snowContainer = document.getElementById('snowContainer');
        if (!snowContainer) return;

        const snowflake = document.createElement('div');
        snowflake.className = 'snowflake';
        
        // Ký tự tuyết
        const snowChars = ['❄', '❅', '❆', '✻', '✼', '❉'];
        snowflake.textContent = snowChars[Math.floor(Math.random() * snowChars.length)];
        
        // Kích thước ngẫu nhiên
        const sizes = ['small', 'medium', 'large', 'xlarge'];
        const size = sizes[Math.floor(Math.random() * sizes.length)];
        snowflake.classList.add(size);
        
        // Vị trí ngẫu nhiên từ trên
        snowflake.style.left = Math.random() * 100 + '%';
        
        // Độ drift (lệch ngang) ngẫu nhiên
        const drift = (Math.random() - 0.5) * 100;
        snowflake.style.setProperty('--drift', drift + 'px');
        
        // Thời gian animation ngẫu nhiên
        const duration = 8 + Math.random() * 7; // 8-15 giây
        snowflake.style.animationDuration = duration + 's';
        snowflake.style.animationDelay = Math.random() * 2 + 's';
        
        snowContainer.appendChild(snowflake);
        
        // Xóa snowflake sau khi rơi xong
        setTimeout(() => {
            if (snowflake.parentNode) {
                snowflake.remove();
            }
        }, (duration + 2) * 1000);
    }

    // Bắt đầu hiệu ứng tuyết rơi
    function startSnowfall() {
        const snowContainer = document.getElementById('snowContainer');
        if (!snowContainer) return;
        
        // Xóa tuyết cũ nếu có
        snowContainer.innerHTML = '';
        
        // Tạo tuyết liên tục
        const createInterval = setInterval(() => {
            // Tạo 2-4 hạt tuyết mỗi lần
            const count = 2 + Math.floor(Math.random() * 3);
            for (let i = 0; i < count; i++) {
                createSnowflake();
            }
        }, 500); // Tạo mới mỗi 500ms
        
        // Lưu interval để có thể dừng sau
        snowContainer.dataset.interval = createInterval;
    }

    // Dừng hiệu ứng tuyết rơi
    function stopSnowfall() {
        const snowContainer = document.getElementById('snowContainer');
        if (!snowContainer) return;
        
        if (snowContainer.dataset.interval) {
            clearInterval(parseInt(snowContainer.dataset.interval));
            snowContainer.dataset.interval = '';
        }
        snowContainer.innerHTML = '';
    }

    // Xử lý nút lời nhắn - hiện/ẩn input
    const messageBtn = document.getElementById('messageBtn');
    const messageInputContainer = document.getElementById('messageInputContainer');
    
    if (messageBtn && messageInputContainer) {
        messageBtn.addEventListener('click', function() {
            // Toggle hiện/ẩn input
            if (messageInputContainer.style.display === 'none') {
                messageInputContainer.style.display = 'block';
                // Focus vào input tên sau khi hiện
                setTimeout(() => {
                    const nameInput = document.getElementById('nameInput');
                    if (nameInput) {
                        nameInput.focus();
                    }
                }, 100);
            } else {
                messageInputContainer.style.display = 'none';
            }
        });
    }

    // Xử lý gửi lời nhắn đến Google Sheets
    const sendMessageBtn = document.getElementById('sendMessageBtn');
    const messageInput = document.getElementById('messageInput');
    const nameInput = document.getElementById('nameInput');
    const messageStatus = document.getElementById('messageStatus');
    
    // URL của Google Apps Script Web App (bạn cần thay thế bằng URL của bạn)
    const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzPREMV2wNM_aVRZaZjk3K4d5uwaUaipuikgzg6RkjTDYahuSZoeoBdXK-C7zDMqTGKvg/exec';
    
    if (sendMessageBtn && messageInput && nameInput) {
        sendMessageBtn.addEventListener('click', function() {
            const name = nameInput.value.trim();
            const message = messageInput.value.trim();
            
            if (!name) {
                showStatus('Vui lòng nhập tên của bạn!', 'error');
                nameInput.focus();
                return;
            }
            
            if (!message) {
                showStatus('Vui lòng nhập lời nhắn!', 'error');
                messageInput.focus();
                return;
            }
            
            if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL === 'https://script.google.com/macros/s/AKfycbzPREMV2wNM_aVRZaZjk3K4d5uwaUaipuikgzg6RkjTDYahuSZoeoBdXK-C7zDMqTGKvg/exe') {
                showStatus('Vui lòng cấu hình Google Script URL!', 'error');
                return;
            }
            
            // Disable nút khi đang gửi
            sendMessageBtn.disabled = true;
            sendMessageBtn.textContent = 'Đang gửi...';
            showStatus('Đang gửi lời nhắn...', 'loading');
            
            // Gửi dữ liệu đến Google Sheets (dưới dạng form data để phù hợp với e.parameter)
            const formData = new URLSearchParams();
            formData.append('name', name);
            formData.append('message', message);
            formData.append('Date', new Date().toLocaleString('vi-VN'));
            
            console.log('Đang gửi dữ liệu:', { name, message, Date: new Date().toLocaleString('vi-VN') });
            console.log('URL:', GOOGLE_SCRIPT_URL);
            
            fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData.toString()
            })
            .then(() => {
                // Vì no-cors mode, chúng ta không thể nhận response
                // Giả sử thành công sau 1 giây
                console.log('Request đã được gửi');
                setTimeout(() => {
                    showStatus('Gửi lời nhắn thành công! ❤️', 'success');
                    nameInput.value = '';
                    messageInput.value = '';
                    sendMessageBtn.disabled = false;
                    sendMessageBtn.textContent = 'Gửi';
                    
                    // Ẩn input sau 2 giây
                    setTimeout(() => {
                        messageInputContainer.style.display = 'none';
                    }, 2000);
                }, 1000);
            })
            .catch((error) => {
                console.error('Error:', error);
                showStatus('Có lỗi xảy ra. Vui lòng thử lại!', 'error');
                sendMessageBtn.disabled = false;
                sendMessageBtn.textContent = 'Gửi';
            });
        });
    }
    
    // Hàm hiển thị trạng thái
    function showStatus(text, type) {
        if (messageStatus) {
            messageStatus.textContent = text;
            messageStatus.className = 'message-status ' + type;
            messageStatus.style.display = 'block';
        }
    }

});

