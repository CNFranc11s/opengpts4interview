## 新增内容
### 添加了一个 Login 页面
<p align="center">
    <img alt="Login" src="_static/Login.png" />
</p>
- 用户登录后，登录信息将存放在 MongoDB 中。
- 用户信息验证使用 OAuth 2.0，验证用户信息与 MongoDB 中的 "user" 集合中的信息是否一致。
- 如果验证成功，将向用户发送一个 Token，用户可以在 Token 的有效期内保持登录状态。

## 如何使用

1. 确保已经在本机上配置好 Docker。如果您尚未配置 Docker，请按照以下步骤进行简单配置：
   - 在您的操作系统上下载并安装 Docker。可以在 Docker 官方网站上找到适用于您操作系统的安装包。
   - 启动 Docker 服务，并确保它在后台运行。

2. 配置环境变量：

   - 名为 `.env` 的文件内已经存放了设置好的环境变量,如果需要请自行设置。
   - 打开 `.env` 文件，并根据您的需求进行以下修改：

     ```
     POSTGRES_PORT=5432
     POSTGRES_DB=postgres
     POSTGRES_USER=postgres
     POSTGRES_PASSWORD=password
     ```

     请注意，上述是 PostgreSQL 相关的信息，您可以根据您的实际情况进行修改。
     另外，`OPENAI_API_KEY` 是可选的，如果不需要使用 OpenAI 服务，也可以设置其他的LLM API。

3. 打开终端，并在项目根目录中运行以下命令：
     ```
     docker-compose up
     ```
    这将拉取所有需要的资源并在本地进行部署。
4. 部署完成后，您可以通过访问以下 URL 来访问应用程序：
     ```
     http://localhost:5173/
     ```
     注意：初始用户名和密码为 `user1` 和 `password1`。

## 后续工作

由于时间的原因,没有将这个app部署到云上方便访问,后续的话会考虑部署到Azure/AWS云上.