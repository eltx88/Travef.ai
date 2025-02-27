from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from routes.pointofinterest_route import router as poi_router
from routes.userhistory_route import router as userhistory_router
from routes.geoapify_route import router as geoapify_router
from config.firebase_init import initialize_firebase
from routes.groq_route import router as groq_router
from routes.wikidata_route import router as wikidata_router
from routes.tripgeneration_route import router as tripgeneration_router
from routes.googleplaces_route import router as googleplaces_router
from routes.trip_route import router as trip_router
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
app.include_router(groq_router)
app.include_router(wikidata_router)
app.include_router(tripgeneration_router)
app.include_router(googleplaces_router)
app.include_router(trip_router)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)