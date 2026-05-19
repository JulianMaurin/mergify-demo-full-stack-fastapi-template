import uuid

from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.config import settings
from tests.utils.item import create_random_item


def test_create_comment(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    item = create_random_item(db)
    data = {"content": "Hello world"}
    response = client.post(
        f"{settings.API_V1_STR}/items/{item.id}/comments/",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["content"] == data["content"]
    assert content["item_id"] == str(item.id)
    assert "id" in content
    assert "author_id" in content
    assert "created_at" in content


def test_create_comment_item_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    response = client.post(
        f"{settings.API_V1_STR}/items/{uuid.uuid4()}/comments/",
        headers=superuser_token_headers,
        json={"content": "Hello"},
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Item not found"


def test_create_comment_not_enough_permissions(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    item = create_random_item(db)
    response = client.post(
        f"{settings.API_V1_STR}/items/{item.id}/comments/",
        headers=normal_user_token_headers,
        json={"content": "Hello"},
    )
    assert response.status_code == 403
    assert response.json()["detail"] == "Not enough permissions"


def test_read_comments(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    item = create_random_item(db)
    for text in ("first", "second"):
        client.post(
            f"{settings.API_V1_STR}/items/{item.id}/comments/",
            headers=superuser_token_headers,
            json={"content": text},
        )

    response = client.get(
        f"{settings.API_V1_STR}/items/{item.id}/comments/",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["count"] == 2
    assert len(content["data"]) == 2
    # oldest first
    assert content["data"][0]["content"] == "first"
    assert content["data"][1]["content"] == "second"


def test_read_comments_item_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    response = client.get(
        f"{settings.API_V1_STR}/items/{uuid.uuid4()}/comments/",
        headers=superuser_token_headers,
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Item not found"


def test_read_comments_not_enough_permissions(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    item = create_random_item(db)
    response = client.get(
        f"{settings.API_V1_STR}/items/{item.id}/comments/",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 403
    assert response.json()["detail"] == "Not enough permissions"


def test_create_comment_requires_auth(client: TestClient, db: Session) -> None:
    item = create_random_item(db)
    response = client.post(
        f"{settings.API_V1_STR}/items/{item.id}/comments/",
        json={"content": "Hello"},
    )
    assert response.status_code == 401
