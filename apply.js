document.addEventListener('DOMContentLoaded', () => {
    const applyForm = document.getElementById('applyForm');

    applyForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const bullName = document.getElementById('bullName').value.trim();
        const ownerName = document.getElementById('ownerName').value.trim();
        const mobileNumber = document.getElementById('mobileNumber').value.trim();
        const place = document.getElementById('place').value.trim();
        const photoFile = document.getElementById('bullPhoto').files[0];

        // Basic Validation
        if (!bullName || !ownerName || !mobileNumber || !place || !photoFile) {
            Swal.fire('Error', 'Please fill all fields', 'error');
            return;
        }

        // Image Processing
        let photoBase64 = '';
        try {
            photoBase64 = await convertToBase64(photoFile);
        } catch (err) {
            console.error("Image Error", err);
            Swal.fire('Error', 'Failed to process image. Try a smaller file.', 'error');
            return;
        }

        // Create Request Object
        const newRequest = {
            requestId: Date.now(), // Unique ID for the request
            bullName,
            ownerName,
            mobileNumber,
            place,
            photo: photoBase64,
            status: 'pending',
            timestamp: new Date().toISOString()
        };

        // Save to Pending Queue in LocalStorage
        saveRequest(newRequest);

        // Success Feedback
        Swal.fire({
            icon: 'success',
            title: 'Application Submitted!',
            text: 'Your registration is pending approval.',
            showCancelButton: true,
            confirmButtonText: 'Check Status',
            cancelButtonText: 'OK',
            confirmButtonColor: '#FBC02D',
            cancelButtonColor: '#2E7D32'
        }).then((result) => {
            applyForm.reset();
            if (result.isConfirmed) {
                window.location.href = 'status.html';
            }
        });
    });

    function saveRequest(request) {
        const pendingRequests = JSON.parse(localStorage.getItem('jallikattu_pending') || '[]');
        pendingRequests.push(request);
        localStorage.setItem('jallikattu_pending', JSON.stringify(pendingRequests));
    }

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
});
