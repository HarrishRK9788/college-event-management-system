const form = document.getElementById("loginForm");

const username = document.getElementById("username");
const password = document.getElementById("password");

const usernameError = document.getElementById("usernameError");
const passwordError = document.getElementById("passwordError");

const message = document.getElementById("message");


form.addEventListener("submit", async function (event) {

    event.preventDefault();

    // Clear previous messages

    usernameError.textContent = "";
    passwordError.textContent = "";
    message.textContent = "";


    let valid = true;


    // -------------------------
    // Username validation
    // -------------------------

    if (username.value.trim() === "") {

        usernameError.textContent =
            "Username is required.";

        valid = false;

    }
    else if (username.value.trim().length < 3) {

        usernameError.textContent =
            "Username must contain at least 3 characters.";

        valid = false;

    }


    // -------------------------
    // Password validation
    // -------------------------

    if (password.value === "") {

        passwordError.textContent =
            "Password is required.";

        valid = false;

    }
    else if (password.value.length < 6) {

        passwordError.textContent =
            "Password must contain at least 6 characters.";

        valid = false;

    }


    // Don't call API if form is invalid

    if (!valid) {
        return;
    }


    // -------------------------
    // Call login API
    // -------------------------

    try {

        const response = await fetch(
            "http://127.0.0.1:5000/api/login",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                credentials: "include",

                body: JSON.stringify({

                    username:
                        username.value.trim(),

                    password:
                        password.value

                })
            }
        );


        const data = await response.json();


        if (response.ok) {

            message.textContent =
                "Login successful!";

            message.style.color = "green";


            // Go to home page

            window.location.href =
                "index.html";

        }
        else {

            message.textContent =
                data.message ||
                "Invalid username or password.";

            message.style.color = "red";

        }

    }
    catch (error) {

        console.error(error);

        message.textContent =
            "Unable to connect to the server.";

        message.style.color = "red";
    }

});