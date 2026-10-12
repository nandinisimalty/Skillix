import os
import logging
from app.config import settings

logger = logging.getLogger(__name__)

firebase_app = None
db = None

try:
    import firebase_admin
    from firebase_admin import credentials, firestore

    if settings.FIREBASE_CREDENTIALS_PATH and os.path.exists(settings.FIREBASE_CREDENTIALS_PATH):
        cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
        firebase_app = firebase_admin.initialize_app(cred)
        db = firestore.client()
        logger.info("Firebase Admin initialized successfully with credentials file.")
    else:
        logger.info("Firebase Admin credentials not provided. Backend running in standard API mode.")
except Exception as e:
    logger.warning(f"Firebase Admin initialization skipped or failed: {str(e)}")

def get_db():
    return db
