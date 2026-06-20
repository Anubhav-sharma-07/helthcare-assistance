import logging
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
from bson import ObjectId

logger = logging.getLogger("uvicorn.error")

class MockCursor:
    def __init__(self, data):
        self.data = data
        self.index = 0
        
    def sort(self, key, direction=-1):
        try:
            self.data = sorted(self.data, key=lambda x: x.get(key) or 0, reverse=(direction == -1))
        except Exception:
            pass
        return self
        
    def limit(self, limit_num):
        self.data = self.data[:limit_num]
        return self
        
    def __aiter__(self):
        return self
        
    async def __anext__(self):
        if self.index >= len(self.data):
            raise StopAsyncIteration
        val = self.data[self.index]
        self.index += 1
        return val

class MockCollection:
    def __init__(self, name):
        self.name = name
        self.store = []
        
    async def find_one(self, query):
        for doc in self.store:
            match = True
            for k, v in query.items():
                if k == "_id":
                    if str(doc.get("_id")) != str(v):
                        match = False
                elif doc.get(k) != v:
                    match = False
            if match:
                return doc
        return None
        
    async def insert_one(self, doc):
        if "_id" not in doc:
            doc["_id"] = ObjectId()
        self.store.append(doc)
        class InsertResult:
            inserted_id = doc["_id"]
        return InsertResult()
        
    async def update_one(self, query, update):
        doc = await self.find_one(query)
        if doc and "$push" in update:
            for k, v in update["$push"].items():
                if k not in doc:
                    doc[k] = []
                if isinstance(v, dict) and "$each" in v:
                    doc[k].extend(v["$each"])
                    if "$slice" in v:
                        doc[k] = doc[k][v["$slice"]:]
                else:
                    doc[k].append(v)
        return doc
        
    def find(self, query):
        results = []
        for doc in self.store:
            match = True
            for k, v in query.items():
                if k == "_id":
                    if str(doc.get("_id")) != str(v):
                        match = False
                elif doc.get(k) != v:
                    match = False
            if match:
                results.append(doc)
        return MockCursor(results)

class MockDatabase:
    def __init__(self):
        self.collections = {}
        
    def __getitem__(self, name):
        if name not in self.collections:
            self.collections[name] = MockCollection(name)
        return self.collections[name]

class Database:
    client: AsyncIOMotorClient = None
    db = None

db_instance = Database()

async def init_db() -> None:
    try:
        db_instance.client = AsyncIOMotorClient(settings.MONGO_URI, serverSelectionTimeoutMS=2000)
        db_instance.db = db_instance.client[settings.DATABASE_NAME]
        # Verify connection by running a command (fails quickly if offline)
        await db_instance.db.command("ping")
        logger.info("Successfully connected to MongoDB.")
    except Exception as e:
        logger.warning(f"MongoDB not detected on local machine: {e}")
        logger.info("--- ACTIVATED IN-MEMORY DB FALLBACK MODE ---")
        db_instance.db = MockDatabase()

async def close_db() -> None:
    if db_instance.client:
        db_instance.client.close()
        logger.info("MongoDB connection closed.")

def get_db():
    return db_instance.db
