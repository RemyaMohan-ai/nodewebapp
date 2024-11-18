export function showToast(message, duration = 3000) {
    const toastContainer = document.getElementById('toast-container');

    // Create the toast element
    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.textContent = message;

    // Add the toast to the container
    toastContainer.appendChild(toast);

    // Show the toast with animation
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);

    // Hide the toast after the specified duration
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toastContainer.removeChild(toast);
        }, 300); // Match the transition duration for smooth removal
    }, duration);
}


