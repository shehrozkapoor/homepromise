import time
import uuid
import jwt # PyJWT library
from pathlib import Path
import requests
from django.conf import settings
import json



def get_assertion_private_key(client_id= settings.CLIENT_ID, key_path="private.pem", audience=settings.AUDIENCE) -> str:
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



def get_access_token(client_assertion: str) -> dict:
    """
    Retrieves an access token from the VA sandbox API.

    Args:
        client_assertion: The signed JWT client assertion string.

    Returns:
        A dictionary containing the JSON response from the token endpoint,
        which includes the access_token, token_type, scope, etc.
    
    Raises:
        requests.exceptions.RequestException: If the network request fails.
        ValueError: If the response is not valid JSON.
    """
    token_url = settings.TOKEN_URL

    headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
    }

    payload = {
        'grant_type': 'client_credentials',
        'client_assertion_type': 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
        'client_assertion': client_assertion,
        'scope': 'launch system.loan-review.write',
        # The launch parameter is a Base64 encoded JSON string: {"portal_id":"TEST1234567890SERVICE"}
        'launch': settings.PORTAL_ID
    }

    try:
        # The `requests` library automatically URL-encodes the payload data
        response = requests.post(token_url, headers=headers, data=payload)

        # Raise an exception for bad status codes (4xx or 5xx)
        response.raise_for_status()

        # Return the parsed JSON response
        return response.json()

    except requests.exceptions.HTTPError as http_err:
        print(f"HTTP error occurred: {http_err}")
        print(f"Response content: {response.text}")
        raise
    except requests.exceptions.RequestException as req_err:
        print(f"A network error occurred: {req_err}")
        raise
    except ValueError:
        print("Failed to decode JSON from the response.")
        raise
    
    
    

def transmit_documents(access_token: str, documents_payload: dict,request_type_transmit: bool) -> dict:
    """
    Calls the transmit-documents endpoint with the provided access token and payload.

    Args:
        access_token: The Bearer token received from the authentication step.
        documents_payload: A dictionary containing the loan data and Base64 encoded files.

    Returns:
        A dictionary containing the JSON response from the API.
    """
    if request_type_transmit:
        api_url = f'{settings.TRANSMIT_URL}transmit-documents/'
    else:
        api_url = f'{settings.TRANSMIT_URL}additional-documents/'
        
    
    # Construct the Authorization header
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json',
        'accept': 'application/json'
    }

    # The payload is sent as a JSON body, so we use the `json` parameter in requests
    response = requests.post(api_url, headers=headers, json=documents_payload)
    return response.json()



def main():
    
    client_assertion_jwt = get_assertion_private_key()
    token_data = get_access_token(client_assertion_jwt)
    access_token = token_data.get("access_token")
    
    documents_to_transmit = {
        "loanIdentifier": "101010101010",
        "loanReviewPackageFile": "dGVzdHN0cmluZw==",
        "xmlUCDBase64": "dGVzdHN0cmluZw==",
        "xmlULADBase64": "dGVzdHN0cmluZw==",
        "filename": "Evidence.pdf"
    }
    
    api_response = transmit_documents(access_token, documents_to_transmit)
    
    print("\n✅ Successfully received response from transmit-documents API:")
    print(json.dumps(api_response, indent=2))