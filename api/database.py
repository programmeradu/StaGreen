from pymongo import MongoClient
from pymongo.database import Database
from pymongo.collection import Collection
from .config import settings # Import the settings instance

class MongoDBConnection:
    client: MongoClient = None
    db: Database = None

db_connection = MongoDBConnection() # Global instance to hold the client and db

def connect_to_mongo():
    """
    Establishes a connection to MongoDB using the URI from settings.
    Initializes the global db_connection.client and db_connection.db.
    This function should ideally be called once when the FastAPI app starts up.
    """
    if db_connection.client is None: # Connect only if not already connected
        try:
            print(f"Attempting to connect to MongoDB URI: {settings.MONGODB_URI[:50]}...") # Log partial URI for security
            db_connection.client = MongoClient(settings.MONGODB_URI)
            # Ping the server to verify connection
            db_connection.client.admin.command('ping')

            # Extract database name from URI if possible, or use a default/specific one
            # For simplicity, let's assume the DB name is part of the URI or we can use client.get_default_database()
            # If your MONGODB_URI includes the database name (e.g. .../MyDatabase?retryWrites...),
            # client.get_database() without arguments will get it.
            # Otherwise, you might need another env var for DB_NAME or parse it from URI.
            # The URI provided by user includes /WMS, so get_default_database() should work.
            db_connection.db = db_connection.client.get_default_database()

            if db_connection.db is None:
                # This case might occur if the URI doesn't specify a default DB
                # and the user intends to select DBs dynamically.
                # For this app, we expect a default DB.
                # Fallback to parsing if needed, or require DB_NAME in settings.
                # For now, let's rely on get_default_database()
                db_name_from_uri = settings.MONGODB_URI.split('/')[-1].split('?')[0]
                if db_name_from_uri and db_name_from_uri != "<database_name>":
                     db_connection.db = db_connection.client[db_name_from_uri]
                else:
                    # If still no DB, raise an error or use a hardcoded default if appropriate
                    raise ValueError("MongoDB default database not found in URI and no DB_NAME specified.")

            print(f"Successfully connected to MongoDB. Database: {db_connection.db.name}")
        except Exception as e:
            print(f"Failed to connect to MongoDB: {e}")
            # Depending on app startup strategy, might want to raise this or handle gracefully
            raise # Re-raise the exception to halt startup if connection fails

def close_mongo_connection():
    """
    Closes the MongoDB connection.
    This should ideally be called when the FastAPI app shuts down.
    """
    if db_connection.client:
        db_connection.client.close()
        db_connection.client = None
        db_connection.db = None
        print("MongoDB connection closed.")

def get_db() -> Database:
    """
    Returns the MongoDB database instance.
    Ensures that the connection is established.
    """
    if db_connection.db is None:
        # This might happen if get_db is called before connect_to_mongo (e.g. in a test or script)
        # Or if the app is designed such that connect_to_mongo isn't called at startup explicitly.
        # For FastAPI, lifespan events are better for managing this.
        # For simplicity in this module, let's try to connect if db is None,
        # but this assumes settings are available.
        print("Database connection not initialized. Attempting to connect...")
        connect_to_mongo() # This will raise an error if it fails
    return db_connection.db

def get_collection(collection_name: str) -> Collection:
    """
    Returns a specific collection from the MongoDB database.
    """
    db = get_db()
    return db[collection_name]

# Example usage (optional, for testing this module directly):
# if __name__ == "__main__":
#     connect_to_mongo()
#     if db_connection.db:
#         print(f"Collections in {db_connection.db.name}: {db_connection.db.list_collection_names()}")
#     close_mongo_connection()
