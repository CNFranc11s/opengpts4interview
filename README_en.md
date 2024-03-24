## New Content
### Added a Login Page
<p align="center">
    <img alt="Login" src="_static/Login.png" />
</p>
- After users log in, the login information will be stored in MongoDB.
- User information authentication is done using OAuth 2.0, verifying whether the user information matches the information in the "user" collection in MongoDB.
- If the verification is successful, a token will be sent to the user, allowing them to stay logged in within the token's validity period.

## How to Use

1. Make sure Docker is properly configured on your local machine. If you haven't configured Docker yet, follow these steps for a simple setup:
   - Download and install Docker on your operating system. You can find the installation package for your operating system on the official Docker website.
   - Start the Docker service and ensure it's running in the background.

2. Configure environment variables:

   - Create a file named `.env`.
   - Open the `.env` file and make the following modifications based on your needs:

     ```
     POSTGRES_PORT=5432
     POSTGRES_DB=postgres
     POSTGRES_USER=postgres
     POSTGRES_PASSWORD=password
     OPENAI_API_KEY=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
     ```

     Note that the above values are related to PostgreSQL. You can modify them according to your actual setup. Additionally, `OPENAI_API_KEY` is optional. If you don't need to use the OpenAI service, you can omit setting it.

3. Open a terminal and run the following command in the project's root directory:
     ```
     docker-compose up
     ```
    This will pull all the necessary resources and deploy them locally.

4. Once the deployment is complete, you can access the application by visiting the following URL:
     ```
     http://localhost:5173/
     ```
     Note: The initial username and password are `user1` and `password1`.

## Next Steps

Due to time constraints, the app has not been deployed to the cloud for easy access. In the future, you can consider deploying it to Azure/AWS cloud for better accessibility.