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
    let isEditMode = false;

    // =========================================================================
    // 0. INISIALISASI FIREBASE (PROJECT: BIODATA-FESY)
    // =========================================================================
    const firebaseConfig = {
        apiKey: "AIzaSyAwbcrtT3f0y7kkfXHWsdXUQo7BDDtwHxs",
        authDomain: "biodata-fesy.firebaseapp.com",
        projectId: "biodata-fesy",
        storageBucket: "biodata-fesy.firebasestorage.app",
        messagingSenderId: "528895519069",
        appId: "1:528895519069:web:32522d86593791928a60b4"
    };

    let db = null;
    if (typeof firebase !== 'undefined') {
        try {
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }
            if (firebase.firestore) {
                db = firebase.firestore();
            }
            console.log("🔥 [Firebase] Terhubung ke project: biodata-fesy");
        } catch (fbErr) {
            console.info("🔥 [Firebase Note]:", fbErr.message);
        }
    }

    // =========================================================================
    // 1. INISIALISASI & MEMUAT DATA DARI LOCALSTORAGE
    // =========================================================================
    const BUILD_VERSION = 'v2.4_cute_features_fix';
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

        // Sinkronisasi foto asli (Kerudung Biru = Syifa, Kerudung Coklat = Febri)
        if (profileViews.syifa) {
            const imgSyifa = profileViews.syifa.querySelector('.avatar-img');
            if (imgSyifa) {
                imgSyifa.src = 'images/syifa.jpg?v=2';
            }
        }
        if (profileViews.fesya) {
            const imgFebri = profileViews.fesya.querySelector('.avatar-img');
            if (imgFebri) {
                imgFebri.src = 'images/febri.jpg?v=2';
            }
        }
    } catch (e) {
        console.warn('Gagal membaca LocalStorage:', e);
    }

    // =========================================================================
    // 1.1 REAL-TIME SYNC FIREBASE FIRESTORE (SINKRONISASI HP <-> LAPTOP OTOMATIS)
    // =========================================================================
    if (db) {
        try {
            db.collection('biodata').doc('profiles').onSnapshot((doc) => {
                if (doc && doc.exists) {
                    const data = doc.data();
                    // Jangan timpa saat pengguna sedang aktif mengetik di mode edit
                    if (isEditMode) return;

                    if (data && data.syifa && data.syifa.trim().length > 200 && profileViews.syifa) {
                        profileViews.syifa.innerHTML = data.syifa;
                        const imgSyifa = profileViews.syifa.querySelector('.avatar-img');
                        if (imgSyifa && !imgSyifa.src.startsWith('data:')) {
                            imgSyifa.src = 'images/syifa.jpg?v=2';
                        }
                        try { localStorage.setItem('biodata_html_syifa', data.syifa); } catch(e){}
                    }

                    if (data && data.fesya && data.fesya.trim().length > 200 && profileViews.fesya) {
                        profileViews.fesya.innerHTML = data.fesya;
                        const imgFebri = profileViews.fesya.querySelector('.avatar-img');
                        if (imgFebri && !imgFebri.src.startsWith('data:')) {
                            imgFebri.src = 'images/febri.jpg?v=2';
                        }
                        try { localStorage.setItem('biodata_html_fesya', data.fesya); } catch(e){}
                    }

                    console.log("🔥 [Firebase Real-Time Sync] Biodata berhasil disinkronkan secara online!");
                }
            }, (error) => {
                console.info("Firestore live listener info:", error.message);
            });
        } catch (syncErr) {
            console.warn("Firestore live listener exception:", syncErr);
        }
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
            document.title = 'Biodata Pribadi - Febriani Isnaini Murath (XII RPL 1)';
        } else {
            if (logoBadge) logoBadge.textContent = 'S';
            if (logoText) logoText.innerHTML = 'Syifa<span>.dev</span>';
            document.title = 'Biodata Pribadi - Syifa Anggita Ramadani (XII RPL 1)';
        }

        if (typeof updateCheerWidget === 'function') {
            updateCheerWidget(profileId);
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

    isEditMode = false;

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

            let htmlSyifaClean = '';
            let htmlFesyaClean = '';

            if (profileViews.syifa) {
                const html = getCleanHTML(profileViews.syifa);
                if (html && html.trim().length > 200) {
                    htmlSyifaClean = html;
                    localStorage.setItem('biodata_html_syifa', html);
                }
            }
            if (profileViews.fesya) {
                const html = getCleanHTML(profileViews.fesya);
                if (html && html.trim().length > 200) {
                    htmlFesyaClean = html;
                    localStorage.setItem('biodata_html_fesya', html);
                }
            }

            // Sinkronisasi Online ke Cloud Firestore jika aktif
            if (db && (htmlSyifaClean || htmlFesyaClean)) {
                try {
                    const batchData = {};
                    if (htmlSyifaClean) batchData.syifa = htmlSyifaClean;
                    if (htmlFesyaClean) batchData.fesya = htmlFesyaClean;
                    batchData.updatedAt = new Date().toISOString();

                    db.collection('biodata').doc('profiles').set(batchData, { merge: true })
                        .catch(() => {});
                } catch (e) {
                    // Abaikan jika permission Firestore belum diatur di Console
                }
            }

            if (!silent) {
                showToast('✅ Semua perubahan biodata berhasil disimpan!');
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

    // =========================================================================
    // 7. POP-UP MODAL KARTU TANDA PELAJAR (STUDENT ID CARD)
    // =========================================================================
    const idCardModal = document.getElementById('id-card-modal');
    const idCardBadge = document.getElementById('idcard-badge');
    const idCardPhoto = document.getElementById('idcard-photo');
    const idCardName = document.getElementById('idcard-name');
    const idCardNis = document.getElementById('idcard-nis');
    const idCardTtl = document.getElementById('idcard-ttl');
    const idCardAgama = document.getElementById('idcard-agama');
    const idCardHobi = document.getElementById('idcard-hobi');
    const idCardCita = document.getElementById('idcard-cita');
    const idCardIg = document.getElementById('idcard-ig');
    const idCardSerial = document.getElementById('idcard-serial');
    const idCardCloseBtn = document.getElementById('idcard-close-btn');
    const idCardCloseBtnBottom = document.getElementById('idcard-close-btn-bottom');
    const idCardPrintBtn = document.getElementById('idcard-print-btn');

    // Handler klik tombol "Lihat Biodata"
    document.addEventListener('click', (e) => {
        const trigger = e.target.closest('.open-idcard-trigger');
        if (trigger) {
            e.preventDefault();
            const currentProfile = htmlElement.getAttribute('data-active-profile') || 'syifa';
            openIdCardModal(currentProfile);
        }
    });

    function getFieldValueFromView(view, labelText, fallback) {
        if (!view) return fallback;
        const listItems = view.querySelectorAll('.info-list li');
        for (let li of listItems) {
            const lbl = li.querySelector('.label');
            const val = li.querySelector('.value');
            if (lbl && val && lbl.textContent.toLowerCase().includes(labelText.toLowerCase())) {
                return val.textContent.trim();
            }
        }
        return fallback;
    }

    function openIdCardModal(profileId) {
        if (!idCardModal) return;
        const isFebri = profileId === 'fesya';
        const activeView = isFebri ? profileViews.fesya : profileViews.syifa;

        if (isFebri) {
            if (idCardBadge) idCardBadge.setAttribute('data-idcard-theme', 'febri');
            if (idCardPhoto) idCardPhoto.src = 'images/febri.jpg?v=2';
            if (idCardName) idCardName.textContent = getFieldValueFromView(activeView, 'Nama Lengkap', 'Febriani Isnaini Murath');
            if (idCardNis) idCardNis.textContent = 'SISWA KELAS XII RPL 1';
            if (idCardTtl) idCardTtl.textContent = getFieldValueFromView(activeView, 'Tempat, Tanggal Lahir', 'Karawang, 05 Februari 2009');
            if (idCardAgama) idCardAgama.textContent = getFieldValueFromView(activeView, 'Agama', 'Islam') + ' / ' + getFieldValueFromView(activeView, 'Jenis Kelamin', 'Perempuan');
            if (idCardHobi) idCardHobi.textContent = getFieldValueFromView(activeView, 'Hobi', 'Main Badmintoon, Mendengarkan Musik Dan Main Game');
            if (idCardCita) idCardCita.textContent = getFieldValueFromView(activeView, 'Cita-Cita', 'Ceo');
            if (idCardIg) idCardIg.textContent = '@fbri_nxzz';
            if (idCardSerial) idCardSerial.textContent = 'ID: SMKN1BYS-2024-FEBRI-002';
        } else {
            if (idCardBadge) idCardBadge.setAttribute('data-idcard-theme', 'syifa');
            if (idCardPhoto) idCardPhoto.src = 'images/syifa.jpg?v=2';
            if (idCardName) idCardName.textContent = getFieldValueFromView(activeView, 'Nama Lengkap', 'Syifa Anggita Ramadani');
            if (idCardNis) idCardNis.textContent = 'SISWA KELAS XII RPL 1';
            if (idCardTtl) idCardTtl.textContent = getFieldValueFromView(activeView, 'Tempat, Tanggal Lahir', 'Sumedang, 06 September 2008');
            if (idCardAgama) idCardAgama.textContent = getFieldValueFromView(activeView, 'Agama', 'Islam') + ' / ' + getFieldValueFromView(activeView, 'Jenis Kelamin', 'Perempuan');
            if (idCardHobi) idCardHobi.textContent = getFieldValueFromView(activeView, 'Hobi', 'Menonton Dan Mendengarkan musik');
            if (idCardCita) idCardCita.textContent = getFieldValueFromView(activeView, 'Cita-Cita', 'Ceo');
            if (idCardIg) idCardIg.textContent = '@sfagta_';
            if (idCardSerial) idCardSerial.textContent = 'ID: SMKN1BYS-2024-SYIFA-001';
        }

        idCardModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    function closeIdCardModal() {
        if (!idCardModal) return;
        idCardModal.classList.add('hidden');
        document.body.style.overflow = '';
    }

    if (idCardCloseBtn) idCardCloseBtn.addEventListener('click', closeIdCardModal);
    if (idCardCloseBtnBottom) idCardCloseBtnBottom.addEventListener('click', closeIdCardModal);

    if (idCardModal) {
        idCardModal.addEventListener('click', (e) => {
            if (e.target === idCardModal) {
                closeIdCardModal();
            }
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && idCardModal && !idCardModal.classList.contains('hidden')) {
            closeIdCardModal();
        }
    });

    if (idCardPrintBtn) {
        idCardPrintBtn.addEventListener('click', () => {
            window.print();
        });
    }

    // =========================================================================
    // 7. INTERACTIVE 3D TILT & HOLOGRAPHIC REFLECTION FOR PREMIUM ID CARD
    // =========================================================================
    if (idCardBadge) {
        const shimmer = idCardBadge.querySelector('.idcard-hologram-shimmer');

        const handleTilt = (e) => {
            const rect = idCardBadge.getBoundingClientRect();
            const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : undefined);
            const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : undefined);
            if (clientX === undefined || clientY === undefined) return;

            const x = clientX - rect.left;
            const y = clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = ((centerY - y) / centerY) * 10;
            const rotateY = ((x - centerX) / centerX) * 10;

            idCardBadge.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-4px) scale(1.02)`;

            if (shimmer) {
                const percX = (x / rect.width) * 100;
                const percY = (y / rect.height) * 100;
                shimmer.style.backgroundPosition = `${percX}% ${percY}%`;
                shimmer.style.opacity = '0.75';
            }
        };

        const resetTilt = () => {
            idCardBadge.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0) scale(1)';
            if (shimmer) {
                shimmer.style.opacity = '0.35';
                shimmer.style.backgroundPosition = '50% 50%';
            }
        };

        idCardBadge.addEventListener('mousemove', handleTilt);
        idCardBadge.addEventListener('mouseleave', resetTilt);
        idCardBadge.addEventListener('touchmove', handleTilt, { passive: true });
        idCardBadge.addEventListener('touchend', resetTilt);
    }

    // =========================================================================
    // 8. FITUR-FITUR LUCU & INTERAKTIF (CUTE FEATURES EDITION)
    // =========================================================================

    // A. Efek Suara Chime Lucu (Synthesizer Web Audio API Murni - Ringan & Tanpa File)
    function playCuteChime(type = 'bell') {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            const ctx = new AudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            const now = ctx.currentTime;
            let startFreq = 523.25; // C5 (Syifa Bell)
            let endFreq = 783.99;   // G5
            if (type === 'star') {
                startFreq = 659.25; // E5 (Febri Star Chime)
                endFreq = 987.77;   // B5
            } else if (type === 'pop') {
                startFreq = 440;
                endFreq = 880;
            }

            osc.type = 'sine';
            osc.frequency.setValueAtTime(startFreq, now);
            osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.12);

            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

            osc.start(now);
            osc.stop(now + 0.35);
        } catch (e) {}
    }

    // B. Efek Klik/Tap Partikel Lucu (Tap Sparkles)
    const syifaEmojis = ['💖', '🎀', '🍓', '🌸', '✨', '🍫', '💕', '🍰', '🍒'];
    const febriEmojis = ['⭐', '🚀', '🪐', '🌟', '☄️', '✨', '🎮', '👾', '🌍'];

    function spawnCuteParticles(x, y, customEmojis = null) {
        if (!x && !y) return;
        const currentProfile = htmlElement.getAttribute('data-active-profile') || 'syifa';
        const pool = customEmojis || (currentProfile === 'fesya' ? febriEmojis : syifaEmojis);
        const count = 4 + Math.floor(Math.random() * 3); // 4 - 6 partikel

        for (let i = 0; i < count; i++) {
            const el = document.createElement('span');
            el.className = 'cute-tap-particle';
            el.textContent = pool[Math.floor(Math.random() * pool.length)];

            const dx = (Math.random() - 0.5) * 80;
            const rot = (Math.random() - 0.5) * 60;

            el.style.left = `${x}px`;
            el.style.top = `${y}px`;
            el.style.setProperty('--dx', `${dx}px`);
            el.style.setProperty('--rot', `${rot}deg`);

            document.body.appendChild(el);
            setTimeout(() => {
                if (el.parentNode) el.parentNode.removeChild(el);
            }, 1000);
        }
    }

    // Listener Ketukan di Layar (Hanya saat klik selesai, tidak mengganggu scroll di HP)
    document.addEventListener('click', (e) => {
        if (!e.clientX && !e.clientY) return;
        if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)) return;
        spawnCuteParticles(e.clientX, e.clientY);
    });

    // C. Avatar Speech Bubble Lucu saat Foto Diklik
    const syifaSpeechQuotes = [
        "Hai kamu! Lagi liat biodata Syifa ya? 🍓✨",
        "Semangat ya hari ini! Jangan lupa bahagia 💖",
        "Calon CEO masa depan nih, aamiin! 🎀💼",
        "Yuk saling support sesama anak XII RPL 1! 💻🌸",
        "Kue coklat buat nemenin ngoding hari ini 🍫😋",
        "Senyum dulu dong! Hari ini bakal menyenangkan ✨💕"
    ];

    const febriSpeechQuotes = [
        "Halo kapten! Siap meluncur ke angkasa bareng Febri? 🚀🌌",
        "Nanti sore gas main badminton gak nih? 🏸😎",
        "Leveling up coding game! Keep pushing! 🎮⚡",
        "Menuju cita-cita CEO hebat! Aamiin! ⭐🪐",
        "Semangat terus kawan pejuang RPL 1! 💻🔥",
        "Dengerin musik asik biar ngetik kode makin santai 🎵🎧"
    ];

    let speechBubbleTimer = null;

    function handleAvatarClick(profileKey) {
        const bubble = document.getElementById(profileKey === 'fesya' ? 'avatar-speech-bubble-febri' : 'avatar-speech-bubble-syifa');
        if (!bubble) return;

        const quotes = profileKey === 'fesya' ? febriSpeechQuotes : syifaSpeechQuotes;
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

        const textSpan = bubble.querySelector('.speech-text');
        if (textSpan) textSpan.textContent = randomQuote;

        bubble.classList.remove('hidden');
        bubble.style.display = 'block';
        playCuteChime(profileKey === 'fesya' ? 'star' : 'bell');

        clearTimeout(speechBubbleTimer);
        speechBubbleTimer = setTimeout(() => {
            bubble.classList.add('hidden');
            bubble.style.display = 'none';
        }, 4000);
    }

    // D. Kotak Kejutan & Pesan Keberuntungan Lucu
    const fortuneQuotes = [
        { text: "Jangan pernah meremehkan setiap baris kode yang kamu tulis. Sukses besar dimulai dari 'Hello World' yang sederhana!", author: "— Syifa & Febri (XII RPL 1)" },
        { text: "Hari ini keberuntunganmu 100%! Kesulitan apa pun pasti bisa kamu selesaikan dengan senyuman. 🌟", author: "— Syifa & Febri (XII RPL 1)" },
        { text: "Istirahat sebentar, minum air putih, dan dengarkan lagu favoritmu. Otakmu butuh istirahat manis! 🍫", author: "— Syifa (XII RPL 1)" },
        { text: "Fokus ke tujuanmu! Kita berdua sama-sama berjuang menuju cita-cita menjadi CEO handal. 💼🚀", author: "— Febri (XII RPL 1)" },
        { text: "Error dan bug bukan kegagalan, itu cuma tanda kalau kamu selangkah lebih dekat ke solusi terbaik! 💻✨", author: "— Semangat XII RPL 1" },
        { text: "Kamu lebih hebat dari yang kamu kira. Tetap percaya diri dan terus melangkah! 💖", author: "— Syifa & Febri (XII RPL 1)" },
        { text: "Game yang seru itu yang punya banyak rintangan, sama kayak hidup. Selesaikan setiap quest dengan bangga! 🎮", author: "— Febri (XII RPL 1)" },
        { text: "Hari ini adalah hari yang manis! Luangkan waktu untuk mengapresiasi dirimu sendiri. 🌸🍓", author: "— Syifa (XII RPL 1)" }
    ];

    // E. Floating Cute Cheer Booster Widget Helper
    function getCheerCount(profileId) {
        return parseInt(localStorage.getItem(`cheer_count_${profileId}`) || '12', 10);
    }

    function setCheerCount(profileId, val) {
        try {
            localStorage.setItem(`cheer_count_${profileId}`, val);
            if (db) {
                db.collection('biodata').doc('cheers').set({
                    [profileId]: val,
                    lastCheer: new Date().toISOString()
                }, { merge: true }).catch(() => {});
            }
        } catch(e) {}
    }

    function updateCheerWidget(profileId) {
        const cheerBtnEl = document.getElementById('cheer-btn');
        if (!cheerBtnEl) return;
        const iconEl = document.getElementById('cheer-icon');
        const labelEl = document.getElementById('cheer-label');
        const counterEl = document.getElementById('cheer-counter');

        const isFebri = profileId === 'fesya';
        if (iconEl) iconEl.textContent = isFebri ? '⭐' : '💖';
        if (labelEl) labelEl.textContent = isFebri ? 'Beri Bintang' : 'Kirim Semangat';
        if (counterEl) counterEl.textContent = getCheerCount(profileId);
    }

    // Ambil data awal cheer dari Firebase jika ada
    if (db) {
        db.collection('biodata').doc('cheers').get().then(doc => {
            if (doc.exists) {
                const data = doc.data();
                if (data.syifa) localStorage.setItem('cheer_count_syifa', data.syifa);
                if (data.fesya) localStorage.setItem('cheer_count_fesya', data.fesya);
                const currentProfile = htmlElement.getAttribute('data-active-profile') || 'syifa';
                updateCheerWidget(currentProfile);
            }
        }).catch(() => {});
    }

    // Inisialisasi tampilan awal cheer widget
    const initProfile = htmlElement.getAttribute('data-active-profile') || 'syifa';
    updateCheerWidget(initProfile);

    // =========================================================================
    // F. UNIFIED EVENT DELEGATION UNTUK SEMUA ELEMEN LUCU & KLIK
    // =========================================================================
    document.addEventListener('click', (e) => {
        // 1. Klik Foto Avatar Profil
        const avatarTarget = e.target.closest('.avatar-ring, .avatar-clickable');
        if (avatarTarget) {
            const currentProfile = htmlElement.getAttribute('data-active-profile') || 'syifa';
            const rect = avatarTarget.getBoundingClientRect();
            spawnCuteParticles(rect.left + rect.width / 2, rect.top + rect.height / 2);
            handleAvatarClick(currentProfile);
            return;
        }

        // 2. Klik Tombol Buka Amplop Kejutan
        const fortuneBtn = e.target.closest('#cute-fortune-btn, .cute-envelope-btn');
        if (fortuneBtn) {
            const random = fortuneQuotes[Math.floor(Math.random() * fortuneQuotes.length)];
            const textEl = document.getElementById('cute-fortune-text');
            const authorEl = document.getElementById('cute-fortune-author');
            const cardEl = document.getElementById('cute-fortune-card');

            if (textEl) textEl.textContent = `"${random.text}"`;
            if (authorEl) authorEl.textContent = random.author;
            if (cardEl) {
                cardEl.classList.remove('hidden');
                cardEl.style.display = 'block';
            }

            playCuteChime('bell');
            const rect = fortuneBtn.getBoundingClientRect();
            spawnCuteParticles(rect.left + rect.width / 2, rect.top, ['💌', '✨', '🌸', '💖', '⭐', '🎉']);
            return;
        }

        // 3. Klik Tombol Cheer Booster (Pojok Bawah)
        const cheerTrigger = e.target.closest('#cheer-btn, .cheer-btn');
        if (cheerTrigger) {
            const currentProfile = htmlElement.getAttribute('data-active-profile') || 'syifa';
            const isFebri = currentProfile === 'fesya';
            let currentVal = getCheerCount(currentProfile);
            currentVal += 1;
            setCheerCount(currentProfile, currentVal);

            const counterEl = document.getElementById('cheer-counter');
            if (counterEl) counterEl.textContent = currentVal;
            playCuteChime(isFebri ? 'star' : 'bell');

            const rect = cheerTrigger.getBoundingClientRect();
            spawnCuteParticles(
                rect.left + rect.width / 2, 
                rect.top, 
                isFebri ? ['⭐', '🌟', '🚀', '✨', '🪐'] : ['💖', '💕', '🎀', '🍓', '✨']
            );

            showToast(isFebri ? '⭐ Terima kasih bintangnya! Semangat! 🚀' : '💖 Terima kasih cintanya! Semangat! 🌸');
            return;
        }

        // 4. Klik Sembarang Tempat untuk Hujan Partikel Lucu
        if (!e.clientX && !e.clientY) return;
        if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)) return;
        spawnCuteParticles(e.clientX, e.clientY);
    });

    console.log(
        "%c✨ Website Biodata Interaktif Siap Digunakan! ✨\n%cReal-Time Auto-Save aktif: Semua editan tidak akan hilang saat di-refresh.",
        "color: #10b981; font-size: 15px; font-weight: bold;",
        "color: #6495ed; font-size: 12px;"
    );
});
