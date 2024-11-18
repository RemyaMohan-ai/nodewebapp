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
        if (response.status === 401) {
            // Handle unauthorized access
            Swal.fire({
                icon: 'warning',
                title: 'Unauthorized',
                text: 'You need to log in to add items to your wishlist.',
                showConfirmButton: true
            }).then(() => {
                window.location.href = '/login'; // Redirect to login page
            });
            return;
        }
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
        }) .then(()=>{
            location.reload()
        })
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


function addtocart(productId){
    fetch(`/addcart/${productId}`,{
        method:"POST",
        headers:{
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ productId })  

    })
    .then(response => {
        console.log('Response headers:', response.headers);
        console.log('Response status:', response.status);
        if (response.redirected) {
            // Redirect the user to the login page if necessary
            window.location.href = response.url;
            return;
        }
        return response.json().then(data => {
            if (!response.ok) {
                throw new Error(data.message || 'Something went wrong');
            }
            return data;
        });
    })
    // .then(response => response.json())
    .then(data => {
        Swal.fire({
            icon: 'success',
            title: data.message,
            showConfirmButton: false,
            timer: 1500
        });
    })
    .catch(error => {
        console.log(error.message,);
        
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message,
            showConfirmButton: false,
            timer: 2000
        });
    });
    
}


function updateQuantity(productId, action) {
    fetch(`/cart/updateQuantity/${productId}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ action })
    })
    .then(response => {
        if (response.redirected) {
            // Redirect the user to the login page if necessary
            window.location.href = response.url;
            return;
        }
        // Check if response is OK
        if (response.ok) {
            return response.json(); // Parse response as JSON
        } else {
            return response.text().then(text => {
                // If the response is not JSON, throw an error with the response text
                throw new Error(text);
            });
        }
    })
    .then(data => {
        // Handle the JSON response data
        Swal.fire({
            icon: 'success',
            title: data.message,
            showConfirmButton: false,
            timer: 1500
        }).then(() => {
            location.reload(); // Optionally reload the page to reflect changes
        });
    })
    .catch(error => {
        // Handle errors
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message,
            showConfirmButton: false,
            timer: 2000
        });
    });
}


function deleteitem(productId){
    fetch(`/cart/deleteitem/${productId}`,{
        method:"DELETE",
        headers:{
            "content-Type":"application/json"
        },

    })
    .then(response => {
        if (response.ok) {
            return response.json();
        } else {
            return response.text().then(text => {
                throw new Error(`Unexpected response format: ${text}`);
            });
        }
    })
    .then(data=>{
        Swal.fire({
            icon:"success",
            title:data.message,
            showConfirmButton: false,
            timer: 2000

        }).then(() => {
            location.reload(); // Optionally reload the page to reflect changes
        });
    })
    .catch(error=>{
        console.log("Error:", error.message);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message,
            showConfirmButton: false,
            timer: 2000
        });
    })
}










if (typeof module !== 'undefined' && module.exports) {
    module.exports = { addtowishlist };
} else {
    // window.addtowishlist = addtowishlist,addtocart;
    window.addtowishlist = addtowishlist;
    window.addtocart = addtocart;
    window.updateQuantity = updateQuantity;
    window.deleteitem = deleteitem;
    
}

