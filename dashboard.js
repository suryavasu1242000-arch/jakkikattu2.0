document.addEventListener('DOMContentLoaded', () => {
    // 1. Auth Guard
    if (localStorage.getItem('isLoggedIn') !== 'true') {
        window.location.href = 'index.html';
        return;
    }

    // --- State ---
    let html5QrCode_html5QrCode_verify = null;
    let html5QrCode_verify = null;

    // --- DOM Elements ---
    const logoutBtn = document.getElementById('logoutBtn');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const registrationForm = document.getElementById('registrationForm');
    const qrTypeInputs = document.querySelectorAll('input[name="qrType"]');
    const setupScannerContainer = document.getElementById('setupScannerContainer');
    const scannedOwnerQrCodeInput = document.getElementById('scannedOwnerQrCode');
    const generatedQrResult = document.getElementById('generatedQrResult');
    const qrcodeContainer = document.getElementById('qrcode');
    const displayToken = document.getElementById('displayToken'); // Might be null now, check usage
    const bullsTableBody = document.getElementById('bullsTableBody');

    // --- Initial Load ---
    preFillToken();
    loadBullsTable();
    loadPendingRequests();

    // --- Event Listeners ---

    // Generate Token
    const generateTokenBtn = document.getElementById('generateTokenBtn');
    if (generateTokenBtn) {
        generateTokenBtn.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent form submit if inside form
            preFillToken();
        });
    }

    // Logout
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('isLoggedIn');
        window.location.href = 'index.html';
    });

    // Tab Switching
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // Add active to clicked
            btn.classList.add('active');
            const target = btn.dataset.tab;
            document.getElementById(target).classList.add('active');

            // Handle Scanner Lifecycle
            stopAllScanners();
            if (target === 'scan') {
                startVerifyScanner();
            }
        });
    });

    // Form Submission
    registrationForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const bullName = document.getElementById('bullName').value;
        const ownerName = document.getElementById('ownerName').value;

        // Use value as is
        let tokenNumber = document.getElementById('tokenNumber').value.trim();
        if (!tokenNumber) {
            tokenNumber = getNextTokenNumber();
        }

        const photoFile = document.getElementById('bullPhoto').files[0];

        const qrType = 'software'; // Default

        // Image Processing
        let photoBase64 = '';
        if (photoFile) {
            try {
                photoBase64 = await convertToBase64(photoFile);
            } catch (err) {
                console.error("Image Error", err);
                Swal.fire('Error', 'Failed to process image', 'error');
                return;
            }
        }

        // Token / QR Data Logic: Just Token Number
        const tokenDataString = tokenNumber.trim();

        // Save to LocalStorage
        const newBull = {
            id: Date.now(),
            bullName,
            ownerName,
            tokenNumber,
            photo: photoBase64 || 'https://via.placeholder.com/50',
            qrCodeData: tokenDataString,
            qrType
        };

        saveBull(newBull);

        // Show Success UI
        Swal.fire({
            icon: 'success',
            title: 'Registered Successfully!',
            text: `Bull ${bullName} added to system.`,
            timer: 2000,
            showConfirmButton: false
        });

        // If Software QR, show it
        if (qrType === 'software') {
            generatedQrResult.style.display = 'block';

            // 1. On-Screen Display
            const qrcodeContainer = document.getElementById('qrcode');
            qrcodeContainer.innerHTML = '';
            new QRCode(qrcodeContainer, {
                text: tokenDataString,
                width: 150,
                height: 150
            });

            // 2. Setup Print Area (Hidden)
            const printQrContainer = document.getElementById('printQrContainer');
            printQrContainer.innerHTML = '';
            new QRCode(printQrContainer, {
                text: tokenDataString,
                width: 200,
                height: 200,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
            document.getElementById('printTokenNo').innerText = `Token: ${tokenNumber}`;
            document.getElementById('printBullName').innerText = `Bull: ${bullName}`;
            document.getElementById('printOwnerName').innerText = `Owner: ${ownerName}`;
        } else {
            generatedQrResult.style.display = 'none'; // reset
        }

        // Reset Form
        registrationForm.reset();
        // preFillToken(); // Refresh token for next entry
        loadBullsTable();
        preFillToken();
    });


    // --- Helper Functions ---

    function getNextTokenNumber() {
        const bulls = JSON.parse(localStorage.getItem('jallikattu_bulls') || '[]');
        if (bulls.length === 0) return 'JK-001';

        let max = 0;
        bulls.forEach(b => {
            // Handle prefix 'JK-'
            let tokenStr = b.tokenNumber;
            if (tokenStr.startsWith('JK-')) {
                tokenStr = tokenStr.replace('JK-', '');
            }

            // Extract number
            const val = parseInt(tokenStr);
            if (!isNaN(val) && val > max) max = val;
        });

        // Pad to 3 digits and add prefix
        return 'JK-' + String(max + 1).padStart(3, '0');
    }

    function preFillToken() {
        const nextToken = getNextTokenNumber();
        const tokenInput = document.getElementById('tokenNumber');
        if (tokenInput) tokenInput.value = nextToken;
    }

    function saveBull(bull) {
        const bulls = JSON.parse(localStorage.getItem('jallikattu_bulls') || '[]');
        bulls.push(bull);
        localStorage.setItem('jallikattu_bulls', JSON.stringify(bulls));
    }

    // Export Excel
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            const bulls = JSON.parse(localStorage.getItem('jallikattu_bulls') || '[]');
            if (bulls.length === 0) {
                Swal.fire('No Data', 'No entries to export', 'info');
                return;
            }

            // Prepare data for clean export (exclude big photo strings if too large, but user might want them? 
            // Ideally for Excel, text data is best. Base64 in Excel is messy. We'll export text.)
            const exportData = bulls.map(b => ({
                'Token No': b.tokenNumber,
                'Bull Name': b.bullName,
                'Owner Name': b.ownerName,
                'QR Type': b.qrType,
                'Registered At': new Date(b.id).toLocaleString()
            }));

            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Bulls");
            XLSX.writeFile(wb, "Jallikattu_Token_Report.xlsx");
        });
    }

    // ... (rest of code)

    function loadBullsTable() {
        const bulls = JSON.parse(localStorage.getItem('jallikattu_bulls') || '[]');
        bullsTableBody.innerHTML = '';

        bulls.forEach((bull, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${bull.tokenNumber}</td>
                <td>${bull.bullName}</td>
                <td>${bull.ownerName}</td>
                <td>
                    ${bull.place || '-'}<br>
                    <small>${bull.mobile || '-'}</small>
                </td>
                <td><img src="${bull.photo}" class="bull-img-thumb" alt="bull"></td>
                <td>
                    <button class="btn-outline" style="padding: 5px 10px; font-size: 0.8rem; margin-right: 5px;" onclick="viewBull(${index})">View</button>
                    <button class="btn-delete" onclick="deleteBull(${index})">Delete</button>
                </td>
            `;
            bullsTableBody.appendChild(row);
        });
    }

    // Expose view to global
    window.viewBull = (index) => {
        const bulls = JSON.parse(localStorage.getItem('jallikattu_bulls') || '[]');
        const bull = bulls[index];

        Swal.fire({
            title: `<strong>Token: ${bull.tokenNumber}</strong>`,
            html: `
                <div style="text-align: left; margin-top: 10px;">
                    <img src="${bull.photo}" style="width: 100%; max-height: 200px; object-fit: cover; border-radius: 10px; margin-bottom: 15px;">
                    <p><strong>Bull Name:</strong> ${bull.bullName}</p>
                    <p><strong>Owner Name:</strong> ${bull.ownerName}</p>
                    <p><strong>Mobile:</strong> ${bull.mobile || 'N/A'}</p>
                    <p><strong>Place:</strong> ${bull.place || 'N/A'}</p>
                    <p><strong>QR Type:</strong> ${bull.qrType.toUpperCase()}</p>
                    <hr style="margin: 10px 0;">
                    <div style="text-align: center;">
                        <div id="viewQrCode" style="display: inline-block;"></div>
                    </div>
                </div>
            `,
            showCloseButton: true,
            showConfirmButton: false,
            didOpen: () => {
                // Generate QR in the popup
                new QRCode(document.getElementById('viewQrCode'), {
                    text: bull.qrCodeData,
                    width: 120,
                    height: 120
                });
            }
        });
    };

    // Expose delete to global scope
    window.deleteBull = (index) => {
        Swal.fire({
            title: 'Are you sure?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                const bulls = JSON.parse(localStorage.getItem('jallikattu_bulls') || '[]');
                bulls.splice(index, 1);
                localStorage.setItem('jallikattu_bulls', JSON.stringify(bulls));
                loadBullsTable();
                Swal.fire('Deleted!', '', 'success');
            }
        });
    };

    // --- Loading Pending Requests ---
    function loadPendingRequests() {
        // Fetch from pending storage
        const pendingRequests = JSON.parse(localStorage.getItem('jallikattu_pending') || '[]');
        const badge = document.getElementById('pendingBadge');
        if (badge) {
            badge.innerText = pendingRequests.length;
            badge.style.display = pendingRequests.length > 0 ? 'inline-block' : 'none';
        }

        const tbody = document.getElementById('pendingRequestsBody');
        if (!tbody) return;

        tbody.innerHTML = '';
        if (pendingRequests.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No pending requests</td></tr>';
            return;
        }

        pendingRequests.forEach((request, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><img src="${request.photo}" style="width:50px; height:50px; object-fit:cover; border-radius:5px;"></td>
                <td>
                    <strong>${request.bullName}</strong><br>
                    <small>${request.ownerName}</small>
                </td>
                <td>
                    ${request.place}<br>
                    <small>${request.mobileNumber}</small>
                </td>
                <td>
                    <button class="btn-primary" style="padding:5px 10px; font-size:0.8rem; background-color:#2E7D32;" onclick="approveRequest(${index})">Approve</button>
                    <button class="btn-delete" style="padding:5px 10px; font-size:0.8rem;" onclick="rejectRequest(${index})">Reject</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    // Make global for buttons
    window.loadPendingRequests = loadPendingRequests;

    window.approveRequest = (index) => {
        try {
            console.log('Approve Request Index:', index);
            const pending = JSON.parse(localStorage.getItem('jallikattu_pending') || '[]');
            const request = pending[index];
            if (!request) {
                Swal.fire('Error', 'Request not found', 'error');
                return;
            }

            // 1. Generate Token ID
            // Safety check for getNextTokenNumber
            let newToken = '001';
            if (typeof getNextTokenNumber === 'function') {
                newToken = getNextTokenNumber();
            } else {
                console.warn('getNextTokenNumber missing, using fallback');
                const bulls = JSON.parse(localStorage.getItem('jallikattu_bulls') || '[]');
                newToken = String(bulls.length + 1).padStart(3, '0');
            }

            // 2. Prepare Main Entry
            const tokenDataString = newToken;

            const newBull = {
                id: Date.now(),
                bullName: request.bullName,
                ownerName: request.ownerName,
                tokenNumber: newToken,
                photo: request.photo || 'https://via.placeholder.com/150',
                qrCodeData: tokenDataString,
                qrType: 'software',
                mobile: request.mobileNumber,
                place: request.place
            };

            // 3. Save to Main DB
            saveBull(newBull);

            // 4. Remove from Pending
            pending.splice(index, 1);
            localStorage.setItem('jallikattu_pending', JSON.stringify(pending));

            Swal.fire({
                icon: 'success',
                title: 'Approved!',
                text: `Token ${newToken} assigned to ${request.bullName}`,
                timer: 2000,
                showConfirmButton: false
            });

            // 5. Refresh Tables
            loadBullsTable();
            loadPendingRequests();
            preFillToken(); // Update next token display

        } catch (e) {
            console.error('Approval Error:', e);
            Swal.fire('System Error', e.message, 'error');
        }
    };

    window.rejectRequest = (index) => {
        Swal.fire({
            title: 'Reject Request?',
            text: "This action cannot be undone.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Yes, reject'
        }).then((result) => {
            if (result.isConfirmed) {
                const pending = JSON.parse(localStorage.getItem('jallikattu_pending') || '[]');
                pending.splice(index, 1);
                localStorage.setItem('jallikattu_pending', JSON.stringify(pending));
                loadPendingRequests();
                Swal.fire('Rejected', 'Request has been removed.', 'success');
            }
        });
    };

    function convertToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = event => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    // Compression Logic
                    const maxWidth = 600; // Resize to max 600px width
                    const quality = 0.6;  // 60% JPEG quality

                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    // Return compressed base64
                    resolve(canvas.toDataURL('image/jpeg', quality));
                };
                img.onerror = error => reject(error);
            };
            reader.onerror = error => reject(error);
        });
    }

    // --- Scanner Logic ---


    function onScanSuccess_Verify(decodedText, decodedResult) {
        console.log(`Verify result: ${decodedText}`);
        // Check DB
        const bulls = JSON.parse(localStorage.getItem('jallikattu_bulls') || '[]');

        // Loose search: Match EXACT QR Data OR Token Number
        const foundBull = bulls.find(b => b.qrCodeData === decodedText || b.tokenNumber === decodedText);

        if (foundBull) {
            // Play notification sound (if allowed)
            // const audio = new Audio('success.mp3'); audio.play().catch(e=>{}); 

            Swal.fire({
                icon: 'success',
                title: '<span style="color:#2E7D32">Verified Successfully!</span>',
                html: `
                        <div class="success-card">
                            <img src="${foundBull.photo}" style="width:120px; height:120px; border-radius:50%; object-fit:cover; border: 4px solid #FBC02D; margin-bottom:10px;">
                            <h2 style="margin:0; color:#333;">${foundBull.bullName}</h2>
                            <p style="margin:5px 0; color:#666;">Owner: <strong>${foundBull.ownerName}</strong></p>
                            <div style="background:#f1f8e9; padding:5px 15px; border-radius:20px; display:inline-block; margin-top:10px;">
                                <strong style="font-size:1.2rem; color:#2E7D32;">Token: ${foundBull.tokenNumber}</strong>
                            </div>
                        </div>
                     `,
                confirmButtonText: 'Scan Next',
                confirmButtonColor: '#2E7D32',
                allowOutsideClick: false
            }).then(() => {
                // Restart scanner for next
                startVerifyScanner();
            });

            // Don't stop scanner completely, just pause mentally - actually Swal blocks interaction.
            // But we should stop it while Swal is open to save battery/resources
            stopAllScanners();

        } else {
            Swal.fire({
                icon: 'error',
                title: 'Invalid Token',
                text: 'This QRCode/Token is not registered.',
                confirmButtonText: 'Try Again',
                confirmButtonColor: '#d32f2f'
            });
        }
    }

    // Removed dead setup scanner functions


    function startVerifyScanner() {
        if (html5QrCode_verify) return;

        const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            rememberLastUsedCamera: true,
            formatsToSupport: [
                Html5QrcodeSupportedFormats.QR_CODE,
                Html5QrcodeSupportedFormats.EAN_13,
                Html5QrcodeSupportedFormats.EAN_8,
                Html5QrcodeSupportedFormats.CODE_128,
                Html5QrcodeSupportedFormats.UPC_A,
                Html5QrcodeSupportedFormats.UPC_E,
                Html5QrcodeSupportedFormats.CODABAR
            ]
        };

        html5QrCode_verify = new Html5QrcodeScanner("verify-reader", config, /* verbose= */ false);
        html5QrCode_verify.render(onScanSuccess_Verify);
    }

    function stopAllScanners() {
        // stopSetupScanner(); // Removed
        if (html5QrCode_verify) {
            try {
                html5QrCode_verify.clear().catch(error => {
                    console.error("Failed to clear verify scanner. ", error);
                });
            } catch (e) { /* ignore */ }
            html5QrCode_verify = null;
        }
    }

});
