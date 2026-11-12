/**
 * BIODATA INTERAKTIF SISWA XII RPL 1 (SYIFA & FEBRI)
 * Fitur:
 * 1. Switcher Profil Instan (Syifa & Febri) dengan tema dinamis
 * 2. Mode Live Edit (Bisa edit teks langsung di web + upload foto)
 * 3. REAL-TIME AUTO-SAVE ke LocalStorage (Tidak hilang saat halaman di-refresh!)
 * 4. Dark / Light Mode Toggle
 * 5. Cetak / Simpan ke PDF
 * 6. Navigasi Halus Sinkron Desktop & Smartphone
 */

document.addEventListener('DOMContentLoaded', () => {
    const htmlElement = document.documentElement;

    // =========================================================================
    // 1. INISIALISASI & MEMUAT DATA DARI LOCALSTORAGE
    // =========================================================================
    const BUILD_VERSION = 'v1.2_syifa_lengkap';
    if (localStorage.getItem('biodata_build_version') !== BUILD_VERSION) {
        localStorage.removeItem('biodata_html_syifa');
        localStorage.removeItem('biodata_html_fesya');
        localStorage.setItem('biodata_build_version', BUILD_VERSION);
    }

    const profileViews = {
        syifa: document.getElementById('view-syifa'),
        fesya: document.getElementById('view-fesya')
    };

    // Muat editan kustom yang tersimpan permanen di browser (hanya jika valid)
    try {
        const savedSyifaHTML = localStorage.getItem('biodata_html_syifa');
        if (savedSyifaHTML && savedSyifaHTML.trim().length > 200 && profileViews.syifa) {
            profileViews.syifa.innerHTML = savedSyifaHTML;
        }
        const savedFesyaHTML = localStorage.getItem('biodata_html_fesya');
        if (savedFesyaHTML && savedFesyaHTML.trim().length > 200 && profileViews.fesya) {
            profileViews.fesya.innerHTML = savedFesyaHTML;
        }

        // Sinkronisasi foto asli (ganti placeholder unsplash lama secara otomatis)
        if (profileViews.syifa) {
            const imgSyifa = profileViews.syifa.querySelector('.avatar-img');
            if (imgSyifa && (imgSyifa.src.includes('unsplash.com') || !imgSyifa.src)) {
                imgSyifa.src = 'images/syifa.jpg';
            }
        }
        if (profileViews.fesya) {
            const imgFebri = profileViews.fesya.querySelector('.avatar-img');
            if (imgFebri && (imgFebri.src.includes('unsplash.com') || !imgFebri.src)) {
                imgFebri.src = 'images/febri.jpg';
            }
        }
    } catch (e) {
        console.warn('Gagal membaca LocalStorage:', e);
    }

    // =========================================================================
    // 2. PROFILE SWITCHER (SYIFA <-> FEBRI)
    // =========================================================================
    const profileTabs = document.querySelectorAll('.profile-tab-btn');
    const logoBadge = document.getElementById('logo-badge');
    const logoText = document.getElementById('logo-text');

    let savedProfile = localStorage.getItem('active-profile') || 'syifa';
    if (savedProfile !== 'fesya' && savedProfile !== 'syifa') {
        savedProfile = 'syifa';
    }
    switchProfile(savedProfile);

    profileTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const selectedProfile = tab.dataset.profile;
            switchProfile(selectedProfile);
        });
    });

    function switchProfile(profileId) {
        if (profileId !== 'fesya' && profileId !== 'syifa') {
            profileId = 'syifa';
        }

        htmlElement.setAttribute('data-active-profile', profileId);
        try {
            localStorage.setItem('active-profile', profileId);
        } catch (e) {
            console.warn(e);
        }

        profileTabs.forEach(tab => {
            const isActive = tab.dataset.profile === profileId;
            tab.classList.toggle('active', isActive);
            tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });

        Object.keys(profileViews).forEach(id => {
            if (profileViews[id]) {
                const isActive = id === profileId;
                profileViews[id].classList.toggle('active', isActive);
            }
        });

        if (profileId === 'fesya') {
            if (logoBadge) logoBadge.textContent = 'F';
            if (logoText) logoText.innerHTML = 'Febri<span>.dev</span>';
            document.title = 'Biodata Pribadi - Febri (XII RPL 1)';
        } else {
            if (logoBadge) logoBadge.textContent = 'S';
            if (logoText) logoText.innerHTML = 'Syifa<span>.dev</span>';
            document.title = 'Biodata Pribadi - Syifa Anggita Ramadani (XII RPL 1)';
        }
    }

    // =========================================================================
    // 3. TEMA DARK / LIGHT MODE DENGAN LOCALSTORAGE
    // =========================================================================
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeIcon = themeToggleBtn.querySelector('i');

    const savedTheme = localStorage.getItem('syifa-theme') || 'light';
    setTheme(savedTheme);

    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = htmlElement.getAttribute('data-theme');
        const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
        setTheme(nextTheme);
    });

    function setTheme(theme) {
        htmlElement.setAttribute('data-theme', theme);
        localStorage.setItem('syifa-theme', theme);

        if (theme === 'dark') {
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
            themeToggleBtn.setAttribute('title', 'Ganti ke Mode Terang');
        } else {
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
            themeToggleBtn.setAttribute('title', 'Ganti ke Mode Gelap');
        }
    }

    // =========================================================================
    // 4. TOMBOL CETAK / SIMPAN KE PDF
    // =========================================================================
    const printBtn = document.getElementById('print-btn');
    if (printBtn) {
        printBtn.addEventListener('click', () => {
            if (isEditMode) {
                saveCurrentData(true);
                setElementsEditable(false);
                isEditMode = false;
            }
            window.print();
        });
    }

    // =========================================================================
    // 5. LIVE EDIT MODE DENGAN REAL-TIME AUTO-SAVE
    // =========================================================================
    const editToggleBtn = document.getElementById('edit-toggle-btn');
    const exitEditBtn = document.getElementById('exit-edit-btn');
    const saveBtn = document.getElementById('save-btn');
    const resetDefaultBtn = document.getElementById('reset-default-btn');
    const editToolbar = document.getElementById('edit-toolbar');
    const avatarInput = document.getElementById('avatar-input');
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-msg');

    let isEditMode = false;

    // Elemen teks yang dapat diedit langsung
    const editableSelectors = [
        '.hero-title',
        '.highlight-text',
        '.hero-subtitle',
        '.hero-bio',
        '.badge-pill',
        '.status-pill',
        '.info-list .value',
        '.timeline-school',
        '.timeline-major',
        '.timeline-year',
        '.contact-handle',
        '.subsection-title',
        '.section-title',
        '.section-subtitle'
    ].join(', ');

    function setElementsEditable(enable) {
        const editables = document.querySelectorAll(editableSelectors);
        editables.forEach(el => {
            el.setAttribute('contenteditable', enable ? 'true' : 'false');
            el.setAttribute('spellcheck', 'false');
        });

        if (enable) {
            document.body.classList.add('editing-active');
            editToolbar.classList.remove('hidden');
            editToggleBtn.classList.remove('btn-outline');
            editToggleBtn.classList.add('btn-primary');
            editToggleBtn.innerHTML = '<i class="fa-solid fa-check"></i> <span class="btn-text">Selesai</span>';
        } else {
            document.body.classList.remove('editing-active');
            editToolbar.classList.add('hidden');
            editToggleBtn.classList.add('btn-outline');
            editToggleBtn.classList.remove('btn-primary');
            editToggleBtn.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> <span class="btn-text">Edit</span>';
        }
    }

    // FUNGSI SIMPAN PERMANEN KE LOCALSTORAGE (AUTO-SAVE)
    function saveCurrentData(silent = false) {
        try {
            updateContactLinks(profileViews.syifa);
            updateContactLinks(profileViews.fesya);

            function getCleanHTML(container) {
                if (!container) return '';
                const clone = container.cloneNode(true);
                const editables = clone.querySelectorAll('[contenteditable]');
                editables.forEach(el => {
                    el.removeAttribute('contenteditable');
                    el.removeAttribute('spellcheck');
                });
                return clone.innerHTML;
            }

            if (profileViews.syifa) {
                const html = getCleanHTML(profileViews.syifa);
                if (html && html.trim().length > 200) {
                    localStorage.setItem('biodata_html_syifa', html);
                }
            }
            if (profileViews.fesya) {
                const html = getCleanHTML(profileViews.fesya);
                if (html && html.trim().length > 200) {
                    localStorage.setItem('biodata_html_fesya', html);
                }
            }

            if (!silent) {
                showToast('✅ Semua perubahan biodata berhasil disimpan di browser!');
            }
        } catch (err) {
            console.warn('Gagal menyimpan ke LocalStorage:', err);
            if (!silent) {
                showToast('⚠️ Memori browser penuh, gunakan foto lebih kecil.');
            }
        }
    }

    // Toggle Mode Edit
    if (editToggleBtn) {
        editToggleBtn.addEventListener('click', () => {
            isEditMode = !isEditMode;
            setElementsEditable(isEditMode);
            if (!isEditMode) {
                saveCurrentData(false);
            } else {
                showToast('✏️ Mode Edit Aktif! Editan kamu tersimpan otomatis.');
            }
        });
    }

    if (exitEditBtn) {
        exitEditBtn.addEventListener('click', () => {
            isEditMode = false;
            setElementsEditable(false);
            saveCurrentData(false);
        });
    }

    // AUTO-SAVE SETIAP KALI PENGGUNA MENGETIK (DEBOUNCED 350ms)
    let autoSaveTimer;
    document.addEventListener('input', () => {
        if (isEditMode) {
            clearTimeout(autoSaveTimer);
            autoSaveTimer = setTimeout(() => {
                saveCurrentData(true);
            }, 350);
        }
    });

    // AUTO-SAVE SAAT PENGGUNA PINDAH DARI SATU ELEMEN TEKS KE ELEMEN LAIN
    document.addEventListener('focusout', (e) => {
        if (isEditMode && e.target && e.target.getAttribute && e.target.getAttribute('contenteditable') === 'true') {
            saveCurrentData(true);
        }
    });

    // AUTO-SAVE OTOMATIS SEBELUM HALAMAN DI-REFRESH ATAU DITUTUP (DESKTOP & HP)
    window.addEventListener('beforeunload', () => {
        if (isEditMode) saveCurrentData(true);
    });
    window.addEventListener('pagehide', () => {
        if (isEditMode) saveCurrentData(true);
    });
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden' && isEditMode) {
            saveCurrentData(true);
        }
    });

    // Tombol Simpan Manual
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            saveCurrentData(false);
        });
    }

    // Ganti Foto Profil
    document.addEventListener('click', (e) => {
        if (!isEditMode) return;
        const avatarRing = e.target.closest('.avatar-ring');
        if (avatarRing) {
            avatarInput.click();
        }
    });

    // Kompresi foto otomatis agar ukuran sangat ringan (< 45KB) dan tidak melampaui kuota browser
    function compressAndSetAvatar(file, targetImg) {
        const reader = new FileReader();
        reader.onload = function(evt) {
            const tempImg = new Image();
            tempImg.onload = function() {
                const maxDim = 400;
                let width = tempImg.width;
                let height = tempImg.height;

                if (width > maxDim || height > maxDim) {
                    if (width > height) {
                        height = Math.round((height * maxDim) / width);
                        width = maxDim;
                    } else {
                        width = Math.round((width * maxDim) / height);
                        height = maxDim;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(tempImg, 0, 0, width, height);

                const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
                targetImg.src = compressedDataUrl;
                saveCurrentData(true);
                showToast('📷 Foto profil baru terpasang & otomatis tersimpan!');
            };
            tempImg.src = evt.target.result;
        };
        reader.readAsDataURL(file);
    }

    avatarInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const activeProfile = htmlElement.getAttribute('data-active-profile') || 'syifa';
            const activeView = profileViews[activeProfile];
            if (activeView) {
                const img = activeView.querySelector('.avatar-img');
                if (img) {
                    compressAndSetAvatar(file, img);
                }
            }
        }
    });

    // Sinkronisasi link Instagram saat username diubah
    function updateContactLinks(container) {
        if (!container) return;
        const igBox = container.querySelector('.contact-box.instagram');
        if (igBox) {
            const handle = igBox.querySelector('.contact-handle');
            if (handle) {
                const user = handle.textContent.replace('@', '').trim();
                if (user) igBox.setAttribute('href', `https://instagram.com/${user}`);
            }
        }
    }

    // Tombol Reset kembali ke template bawaan asli
    if (resetDefaultBtn) {
        resetDefaultBtn.addEventListener('click', () => {
            if (confirm('Kembalikan seluruh isi biodata ke data awal bawaan? Semua editan Anda akan dihapus.')) {
                localStorage.removeItem('biodata_html_syifa');
                localStorage.removeItem('biodata_html_fesya');
                showToast('Mengembalikan data bawaan...');
                setTimeout(() => {
                    window.location.reload();
                }, 400);
            }
        });
    }

    // Helper Pop-up Toast
    let toastTimer;
    function showToast(msg, duration = 3000) {
        if (!toast) return;
        toastMsg.textContent = msg;
        toast.classList.remove('hidden');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
            toast.classList.add('hidden');
        }, duration);
    }

    // =========================================================================
    // 6. NAVIGASI HALUS ANTARA DESKTOP & MOBILE BOTTOM BAR
    // =========================================================================
    const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-item');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const targetHref = link.getAttribute('href');
            if (!targetHref || !targetHref.startsWith('#')) return;

            e.preventDefault();
            const sectionTarget = targetHref.replace('#', '');

            const activeProfile = htmlElement.getAttribute('data-active-profile') || 'syifa';
            const activeView = profileViews[activeProfile];
            if (!activeView) return;

            const targetSection = activeView.querySelector(`#${sectionTarget}`) || 
                                  activeView.querySelector(`section.${sectionTarget}-section`) ||
                                  findSectionByTopic(activeView, sectionTarget);

            if (targetSection) {
                const headerOffset = 80;
                const elementPosition = targetSection.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    function findSectionByTopic(container, topic) {
        const sections = container.querySelectorAll('section');
        const topicMap = {
            'about': 0,
            'personal-info': 1,
            'education': 2,
            'contact': 3
        };
        const index = topicMap[topic];
        if (index !== undefined && sections[index]) {
            return sections[index];
        }
        return null;
    }

    // Update active link saat scroll
    window.addEventListener('scroll', () => {
        const activeProfile = htmlElement.getAttribute('data-active-profile') || 'syifa';
        const activeView = profileViews[activeProfile];
        if (!activeView) return;

        const sections = activeView.querySelectorAll('section');
        const topicKeys = ['about', 'personal-info', 'education', 'contact'];
        let currentTopic = 'about';
        const scrollPosition = window.scrollY + 140;

        sections.forEach((section, index) => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;

            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                currentTopic = topicKeys[index] || 'about';
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentTopic}`) {
                link.classList.add('active');
            }
        });
    });

    console.log(
        "%c✨ Website Biodata Interaktif Siap Digunakan! ✨\n%cReal-Time Auto-Save aktif: Semua editan tidak akan hilang saat di-refresh.",
        "color: #10b981; font-size: 15px; font-weight: bold;",
        "color: #6495ed; font-size: 12px;"
    );
});
