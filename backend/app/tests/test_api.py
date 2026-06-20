from fastapi.testclient import TestClient
from app.main import app
from app.core.security import get_password_hash, verify_password, create_access_token, decode_access_token

client = TestClient(app)

def test_read_root():
    """
    Verifies that the API root endpoint responds with status 200 and details.
    """
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "online"
    assert "service" in response.json()

def test_password_hashing():
    """
    Ensures that security bcrypt hashing functions hash and verify values correctly.
    """
    password = "SuperSecretPassword123"
    hashed = get_password_hash(password)
    assert hashed != password
    assert verify_password(password, hashed) is True
    assert verify_password("wrong_password", hashed) is False

def test_jwt_token_handling():
    """
    Validates that signed JWT tokens encode claims and decode correctly.
    """
    data = {"sub": "64a4b27ef3e218206d860d10"}
    token = create_access_token(data=data)
    decoded = decode_access_token(token)
    assert decoded is not None
    assert decoded["sub"] == "64a4b27ef3e218206d860d10"
