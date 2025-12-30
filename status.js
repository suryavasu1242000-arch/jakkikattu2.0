document.addEventListener('DOMContentLoaded', () => {
    const statusForm = document.getElementById('statusForm');
    const resultDiv = document.getElementById('statusResult');
    const searchMobile = document.getElementById('searchMobile');

    statusForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const mobile = searchMobile.value.trim();

        if (!mobile) {
            Swal.fire('Error', 'Please enter a mobile number', 'error');
            return;
        }

        checkStatus(mobile);
    });

    function checkStatus(mobile) {
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = '<p style="text-align:center;">Searching...</p>';

        // 1. Check Approved List
        const bulls = JSON.parse(localStorage.getItem('jallikattu_bulls') || '[]');
        const approvedBull = bulls.find(b => b.mobile === mobile);

        if (approvedBull) {
            showApproved(approvedBull);
            return;
        }

        // 2. Check Pending List
        const pending = JSON.parse(localStorage.getItem('jallikattu_pending') || '[]');
        const pendingRequest = pending.find(r => r.mobileNumber === mobile);

        if (pendingRequest) {
            showPending(pendingRequest);
            return;
        }

        // 3. Not Found
        showNotFound();
    }

    function showApproved(bull) {
        resultDiv.innerHTML = `
            <div style="text-align: center; padding: 20px; background: #e8f5e9; border-radius: 10px; border: 1px solid #c8e6c9;">
                <div style="width: 60px; height: 60px; background: #2E7D32; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px;">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <h3 style="color: #2E7D32; margin-bottom: 5px;">Application Approved!</h3>
                <p>Your Token Number is <strong>${bull.tokenNumber}</strong></p>
                <div style="margin: 20px 0;">
                    <img src="${bull.photo}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 50%; border: 3px solid #fff; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                </div>
                <button onclick="downloadCard('${bull.tokenNumber}')" class="btn-primary" style="background: #FBC02D; color: #333;">
                    Download Token Card ⬇️
                </button>
            </div>
        `;

        // Prepare hidden card for download
        prepareDownloadCard(bull);
    }

    function showPending(request) {
        resultDiv.innerHTML = `
             <div style="text-align: center; padding: 20px; background: #fff3e0; border-radius: 10px; border: 1px solid #ffe0b2;">
                <div style="width: 60px; height: 60px; background: #EF6C00; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px;">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                </div>
                <h3 style="color: #EF6C00; margin-bottom: 5px;">Application Under Review</h3>
                <p>Please check back later.</p>
                <p style="font-size: 0.9rem; color: #666; margin-top: 10px;">Bull: ${request.bullName}</p>
            </div>
        `;
    }

    function showNotFound() {
        resultDiv.innerHTML = `
            <div style="text-align: center; padding: 20px; background: #ffebee; border-radius: 10px; border: 1px solid #ffcdd2;">
                 <div style="width: 60px; height: 60px; background: #c62828; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px;">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                </div>
                <h3 style="color: #c62828; margin-bottom: 5px;">No Record Found</h3>
                <p>We could not find an application status for this mobile number.</p>
                <a href="apply.html" style="display: inline-block; margin-top: 15px; color: #c62828; font-weight: 600;">Submit New Application &rarr;</a>
            </div>
        `;
    }

    function prepareDownloadCard(bull) {
        document.getElementById('cardBullPhoto').src = bull.photo;
        document.getElementById('cardToken').innerText = bull.tokenNumber;
        document.getElementById('cardBullName').innerText = bull.bullName;
        document.getElementById('cardOwnerName').innerText = bull.ownerName;
        document.getElementById('cardPlace').innerText = bull.place || 'Registered Entry';
        document.getElementById('qrOverlayToken').innerText = bull.tokenNumber;

        const qrContainer = document.getElementById('cardQrCode');
        qrContainer.innerHTML = '';
        new QRCode(qrContainer, {
            text: bull.qrCodeData || bull.tokenNumber,
            width: 100,
            height: 100,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
    }

    // Expose download function
    window.downloadCard = (tokenNumber) => {
        const cardElement = document.getElementById('downloadCard');
        cardElement.style.display = 'block'; // Show temporarily for capture

        html2canvas(cardElement, {
            scale: 2, // High res
            backgroundColor: "#ffffff"
        }).then(canvas => {
            cardElement.style.display = 'none'; // Hide again

            // Trigger Download
            const link = document.createElement('a');
            link.download = `Jallikattu_Token_${tokenNumber}.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();
        }).catch(err => {
            console.error("Capture Error", err);
            cardElement.style.display = 'none';
            Swal.fire('Error', 'Failed to generate image', 'error');
        });
    };

});
