import logging
import os
from pathlib import Path

import orjson
from fastapi import FastAPI, Form, UploadFile, Depends, HTTPException,Request
from fastapi.staticfiles import StaticFiles
from fastapi.security import OAuth2PasswordBearer, HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from datetime import datetime, timedelta
from pymongo import MongoClient
import jwt

from app.api import router as api_router
from app.lifespan import lifespan
from app.upload import ingest_runnable


logger = logging.getLogger(__name__)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/token")

app = FastAPI(title="OpenGPTs API", lifespan=lifespan)

# Get root of app, used to point to directory containing static files
ROOT = Path(__file__).parent.parent

SECRET_KEY = "secret-key"
# JWT expair time 
EXPIRATION_TIME = timedelta(hours=1)

# MongoDB Connection
MONGO_HOST = "mongodb"
MONGO_PORT = 27017
MONGO_USERNAME = "admin"
MONGO_PASSWORD = "password"
MONGO_DB = "UserInfo"

client = MongoClient(f"mongodb://{MONGO_HOST}:{MONGO_PORT}/{MONGO_DB}")
print("client",client)
db = client[MONGO_DB]
users_collection = db["user"]
login_record_collection = db["login_records"]

auth = HTTPBearer()

class User(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/token")


def authenticate_user(username: str, password: str):
    user = users_collection.find_one({"username": username, "password": password})
    return user


def create_access_token(data: dict):
    # set expiration time
    expiration = datetime.utcnow() + EXPIRATION_TIME
    data["exp"] = expiration

    # generate JWT
    token = jwt.encode(data, SECRET_KEY, algorithm="HS256")
    return token

@app.post("/verify-token")
def verify_token(token: HTTPAuthorizationCredentials = Depends(auth)):
    try:
        # verify and decode JWT
        decoded_token = jwt.decode(token.credentials, SECRET_KEY, algorithms=["HS256"])
        return decoded_token
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
@app.post("/token", response_model=Token)
def login(user: User,request: Request):
    print(user)
    authenticated_user = authenticate_user(user.username, user.password)
    if not authenticated_user:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    access_token = create_access_token({"username": authenticated_user["username"]})
    
    # get user app address
    ip_address = request.client.host

    # save login record
    login_record = {
        "username": authenticated_user["username"],
        "login_time": datetime.now(),
        "ip_address": ip_address
    }
    login_record_collection.insert_one(login_record)

    return Token(access_token=access_token, token_type="bearer")

# In case other route need to verify token, exsiting route are not been protect for safety .
# @app.get("/protected")
# def protected_route(token: str = Depends(oauth2_scheme)):
#     verify_token(token)
#     return {"message": f"Hello. You've accessed a protected route."}

app.include_router(api_router)


@app.post("/ingest", description="Upload files to the given assistant.")
def ingest_files(files: list[UploadFile], config: str = Form(...)) -> None:
    """Ingest a list of files."""
    config = orjson.loads(config)
    return ingest_runnable.batch([file.file for file in files], config)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}

ui_dir = str(ROOT / "ui")

if os.path.exists(ui_dir):
    app.mount("", StaticFiles(directory=ui_dir, html=True), name="ui")
else:
    logger.warn("No UI directory found, serving API only.")

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8100)