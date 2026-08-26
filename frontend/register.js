const form = document.getElementById("registerForm");

const username =
    document.getElementById("username");

const password =
    document.getElementById("password");

const confirmPassword =
    document.getElementById("confirmPassword");

const role =
    document.getElementById("role");


const usernameError =
    document.getElementById("usernameError");

const passwordError =
    document.getElementById("passwordError");

const confirmPasswordError =
    document.getElementById("confirmPasswordError");

const message =
    document.getElementById("message");


form.addEventListener("submit", async function (event) {

    event.preventDefault();


    // Clear previous messages

    usernameError.textContent = "";
    passwordError.textContent = "";
    confirmPasswordError.textContent = "";
    message.textContent = "";


    let valid = true;


    // =====================================================
    // USERNAME
    // =====================================================

    const usernameValue =
        username.value.trim();


    if (usernameValue === "") {

        usernameError.textContent =
            "Username is required.";

        valid = false;

    }
    else if (usernameValue.length < 3) {

        usernameError.textContent =
            "Username must contain at least 3 characters.";

        valid = false;

    }
    else if (usernameValue.length > 30) {

        usernameError.textContent =
            "Username cannot exceed 30 characters.";

        valid = false;

    }
    else if (!/^[A-Za-z0-9_]+$/.test(usernameValue)) {

        usernameError.textContent =
            "Username can contain only letters, numbers and underscore.";

        valid = false;

    }


    // =====================================================
    // PASSWORD
    // =====================================================

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


    // =====================================================
    // CONFIRM PASSWORD
    // =====================================================

    if (confirmPassword.value === "") {

        confirmPasswordError.textContent =
            "Please confirm your password.";

        valid = false;

    }
    else if (
        password.value !==
        confirmPassword.value
    ) {

        confirmPasswordError.textContent =
            "Passwords do not match.";

        valid = false;

    }


    // =====================================================
    // ROLE
    // =====================================================

    if (
        role.value !== "student" &&
        role.value !== "admin"
    ) {

        message.textContent =
            "Invalid account type.";

        message.style.color = "red";

        valid = false;
    }


    // =====================================================
    // STOP IF INVALID
    // =====================================================

    if (!valid) {
        return;
    }


    // =====================================================
    // CALL REGISTER API
    // =====================================================

    try {

        const response = await fetch(
            "http://127.0.0.1:5000/api/register",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                credentials: "include",

                body: JSON.stringify({

                    username: usernameValue,

                    password:
                        password.value,

                    role: role.value

                })
            }
        );


        const data =
            await response.json();


        // =================================================
        // SUCCESS
        // =================================================

        if (response.ok) {

            message.textContent =
                "Registration successful! Redirecting to login...";

            message.style.color =
                "green";


            setTimeout(function () {

                window.location.href =
                    "login.html";

            }, 1000);

        }


        // =================================================
        // ERROR
        // =================================================

        else {

            message.textContent =
                data.message ||
                "Registration failed.";

            message.style.color =
                "red";
        }

    }


    catch (error) {

        console.error(error);

        message.textContent =
            "Unable to connect to the server.";

        message.style.color =
            "red";
    }

});