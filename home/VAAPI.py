import time
import uuid
import jwt # PyJWT library
from pathlib import Path

def get_assertion_private_key(client_id: str, key_path: str, audience: str) -> str:
    """
    Generates a signed JWT assertion using a private key, mirroring the JS logic.

    Args:
        client_id: The client ID, used as the issuer and subject.
        key_path: The file path to the PEM-encoded private key.
        audience: The audience URL for the token (the token endpoint).

    Returns:
        A signed JWT as a compact string.
        
    Raises:
        FileNotFoundError: If the private key file cannot be found.
        IOError: If there is an error reading the key file.
    """
    seconds_since_epoch = int(time.time())

    # 1. Define the claims (payload) for the JWT
    # These claims match the structure in your JavaScript code.
    claims = {
        "aud": audience,
        "iss": client_id,
        "sub": client_id,
        "iat": seconds_since_epoch,
        "exp": seconds_since_epoch + 3600,  # Token expires in 1 hour
        "jti": str(uuid.uuid4()) # Generates a unique token ID
    }

    # 2. Read the private key from the specified file path
    try:
        private_key_pem = Path(key_path).read_text()
    except FileNotFoundError:
        # Raise an error if the key file doesn't exist to avoid confusion.
        raise FileNotFoundError(f"Private key file not found at: {key_path}")
    except Exception as e:
        raise IOError(f"An error occurred while reading the private key file: {e}")

    # 3. Sign the JWT using the private key and the RS256 algorithm
    # The jwt.encode function creates the token and signs it in one step.
    token = jwt.encode(
        payload=claims,
        key=private_key_pem,
        algorithm="RS256"
    )

    return token


