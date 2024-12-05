from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from firebase_admin import credentials
import uvicorn
from routes.pointofinterest_route import router as poi_router
from routes.userhistory_route import router as userhistory_router
from routes.geoapify_route import router as geoapify_router
from config.firebase_init import initialize_firebase

# Initialize Firebase Admin
initialize_firebase()

app = FastAPI()

# CORS configuration
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "API is running"}
# Include routers
app.include_router(poi_router)
app.include_router(userhistory_router)
app.include_router(geoapify_router)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)