from firebase_admin import firestore
from config.firebase_init import initialize_firebase

class FirebaseService:
    def __init__(self):
        initialize_firebase()
        self.db = firestore.client()

    def get_collection_ref(self, collection_name: str):
        return self.db.collection(collection_name)