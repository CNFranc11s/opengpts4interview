import React, { useState } from "react";

export function Login({setIsTokenValid}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  // handle submit
  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const response = await fetch(`/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username,
          password: password,
        }),
      });

      if (response.ok) {

        const data = await response.json();
        const token = data.access_token;
        
        // if auth is success, set token in local storage
        localStorage.setItem("token", token);
        // change state to change page.
        setIsTokenValid(true);
        // clean input.
        setUsername("");
        setPassword("");
      } else {
        // handle login fail
        console.error("Login failed");
        alert("Login failed. Please check your username and password.");
      }
    } catch (error) {
      console.error("An error occurred during login", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">Login</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="username" className="block mb-2">
              Username:
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="password" className="block mb-2">
              Password:
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 px-4 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}