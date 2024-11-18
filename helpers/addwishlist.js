// export function showToast(message, duration = 3000) {
//     const toastContainer = document.getElementById('toast-container');

//     // Create the toast element
//     const toast = document.createElement('div');
//     toast.className = 'toast-message';
//     toast.textContent = message;

//     // Add the toast to the container
//     toastContainer.appendChild(toast);

//     // Show the toast with animation
//     setTimeout(() => {
//         toast.classList.add('show');
//     }, 100);

//     // Hide the toast after the specified duration
//     setTimeout(() => {
//         toast.classList.remove('show');
//         setTimeout(() => {
//             toastContainer.removeChild(toast);
//         }, 300); // Match the transition duration for smooth removal
//     }, duration);
// }

function addtowishlist(productId) {
    fetch(`/addwish/${productId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ productId })  // Check if the server expects this in the body
    })
    .then(response => {
        console.log('Response headers:', response.headers);
        console.log('Response status:', response.status);

        if (response.headers.get('content-type').includes('application/json')) {
            return response.json();
        } else {
            return response.text().then(text => {
                throw new Error(`Unexpected response format: ${text}`);
            });
        }
    })
    .then(data => {
        const button = document.querySelector(`button[onclick='addtowishlist("${productId}")']`);
        if (button) {
            if (data.message.includes("added")) {
                button.classList.add('in-wishlist');
            } else {
                button.classList.remove('in-wishlist');
            }
        }
        Swal.fire({
            icon: 'success',
            title: data.message,
            showConfirmButton: false,
            timer: 1500
        }); 
    })
    .catch(error => {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message,
            showConfirmButton: false,
            timer: 2000
        });   
        console.log('Error message:', error.message);
    });
}



module.exports = { addtowishlist };
