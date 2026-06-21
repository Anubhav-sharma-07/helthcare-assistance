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

def test_otp_authentication_flow():
    """
    Validates the end-to-end OTP login flow:
    1. Send OTP to new email
    2. Verify OTP & Register user
    3. Log in via direct password
    4. Send OTP to returning email & login with a new password
    """
    with TestClient(app) as local_client:
        test_email = "newpatient@example.com"
        
        # 1. Send OTP
        send_res = local_client.post("/api/auth/send-otp", json={"email": test_email})
        assert send_res.status_code == 200
        send_data = send_res.json()
        assert send_data["is_registered"] is False
        assert "debug_otp" in send_data
        otp = send_data["debug_otp"]
        
        # 2. Verify OTP & Register
        verify_res = local_client.post("/api/auth/verify-otp", json={
            "email": test_email,
            "otp": otp,
            "password": "Password123!",
            "username": "TestPatient",
            "age": 28,
            "gender": "female"
        })
        assert verify_res.status_code == 200
        verify_data = verify_res.json()
        assert "access_token" in verify_data
        assert verify_data["token_type"] == "bearer"
        
        # 3. Direct Password Login
        login_res = local_client.post("/api/auth/login", json={
            "email": test_email,
            "password": "Password123!"
        })
        assert login_res.status_code == 200
        login_data = login_res.json()
        assert "access_token" in login_data
        
        # 4. OTP update password for returning user
        send_res_2 = local_client.post("/api/auth/send-otp", json={"email": test_email})
        assert send_res_2.status_code == 200
        send_data_2 = send_res_2.json()
        assert send_data_2["is_registered"] is True
        otp_2 = send_data_2["debug_otp"]
        
        verify_res_2 = local_client.post("/api/auth/verify-otp", json={
            "email": test_email,
            "otp": otp_2,
            "password": "NewPassword123!"
        })
        assert verify_res_2.status_code == 200
        
        # Verify new password works
        login_res_2 = local_client.post("/api/auth/login", json={
            "email": test_email,
            "password": "NewPassword123!"
        })
        assert login_res_2.status_code == 200


