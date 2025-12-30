document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const useDefaultBtn = document.getElementById('useDefaultBtn');

    if (useDefaultBtn) {
        useDefaultBtn.addEventListener('click', () => {
            document.getElementById('username').value = 'admin';
            document.getElementById('password').value = '123';
            // Optional: Auto submit or let user click login
            // loginForm.dispatchEvent(new Event('submit')); // Uncomment to auto submit
            Swal.fire({
                icon: 'info',
                title: 'Credentials Filled',
                text: 'Username: admin, Password: 123',
                timer: 1000,
                showConfirmButton: false
            });
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            // Simple demo authentication
            if (username.toLowerCase() === 'admin' && password === '123') {
                Swal.fire({
                    icon: 'success',
                    title: 'Welcome!',
                    text: 'Logging in...',
                    timer: 1500,
                    showConfirmButton: false
                }).then(() => {
                    localStorage.setItem('isLoggedIn', 'true');
                    window.location.href = 'dashboard.html';
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Login Failed',
                    text: 'Invalid Credentials! Try admin / 123',
                    confirmButtonColor: '#D32F2F'
                });
            }
        });
    }
});
