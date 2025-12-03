// YouTube Player
let youtubePlayer = null;
let isMusicPlaying = false;
let shouldAutoPlay = false; // Flag để tự động phát khi player ready
let isPlayerReady = false; // Flag để biết player đã sẵn sàng chưa
let retryCount = 0; // Đếm số lần retry
const MAX_RETRY = 5; // Số lần retry tối đa
const YOUTUBE_VIDEO_ID = 'jq2pn8b6q-A'; // ID từ link: https://www.youtube.com/watch?v=jq2pn8b6q-A

// Hàm khởi tạo YouTube Player khi API sẵn sàng
// Phải là global function để YouTube API có thể gọi
window.onYouTubeIframeAPIReady = function() {
    if (typeof YT !== 'undefined' && YT.Player) {
        youtubePlayer = new YT.Player('youtube-player', {
            height: '0',
            width: '0',
            videoId: YOUTUBE_VIDEO_ID,
            playerVars: {
                'autoplay': 1, // Bật autoplay
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

document.addEventListener('DOMContentLoaded', function() {
    const card = document.getElementById('card');
    const closeBtn = document.getElementById('closeBtn');
    const shinCImage = document.getElementById('shinCImage');
    const shinCContainer = document.getElementById('shinCContainer');
    const musicBtn = document.getElementById('musicBtn');

    // Xử lý click vào hình shin_c
    shinCImage.addEventListener('click', function() {
        // Ẩn hình shin_c
        shinCContainer.style.display = 'none';
        // Hiện envelope trực tiếp
        const envelopeContainer = document.getElementById('envelopeContainer');
        envelopeContainer.style.display = 'flex';
    });

    // Xử lý nút đóng thiệp
    closeBtn.addEventListener('click', function() {
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
        
        // Thêm hiệu ứng khi đóng
        closeBtn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            closeBtn.style.transform = 'scale(1)';
        }, 200);
    });

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

