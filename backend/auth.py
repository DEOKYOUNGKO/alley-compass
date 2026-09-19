#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
골목 컴퍼스 (Alley Compass) — 인증
Supabase Auth 가 발급한 JWT 를 FastAPI 가 검증한다.

    프론트 (Supabase Auth 로그인)
        -> access_token
        -> Authorization: Bearer <token>
        -> 이 모듈이 서명 검증 + user_id 추출
        -> search_sessions.user_id 로 기록

왜 토큰을 여기서 직접 검증하는가
    Supabase 의 /auth/v1/user 를 호출해 확인할 수도 있지만, 그러면 모든 요청이
    네트워크 왕복을 한 번 더 한다. 서명 검증은 로컬에서 끝낼 수 있는 일이다.

두 가지 서명 방식을 모두 받는다
    신형 프로젝트  비대칭(ES256/RS256) — JWKS 를 받아 공개키로 검증
    구형 프로젝트  대칭(HS256)        — SUPABASE_JWT_SECRET 로 검증
    프로젝트마다 다르고 마이그레이션 중일 수도 있어 둘 다 지원한다.

주의: 이 모듈은 "토큰이 진짜인가"만 판단한다. "이 사용자가 이 행을 볼 수
있는가"는 Postgres RLS(auth.uid() = user_id)가 판단한다. 두 겹을 다 두는
이유는, 백엔드 코드에 버그가 생겨도 DB 가 마지막 방어선이 되기 때문이다.
"""

from __future__ import annotations

import os
from functools import lru_cache
from typing import Any

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWKClient

# Supabase 가 발급하는 토큰의 audience 고정값
AUDIENCE = "authenticated"

_bearer = HTTPBearer(auto_error=False, description="Supabase Auth access token")


class AuthNotConfigured(RuntimeError):
    """서버에 검증 수단이 없는 상태. 요청을 통과시키면 안 된다."""


@lru_cache(maxsize=1)
def _jwks_client() -> PyJWKClient | None:
    """비대칭 서명 검증용 JWKS 클라이언트. 구형(HS256) 프로젝트면 None."""
    url = os.getenv("SUPABASE_URL", "").strip().rstrip("/")
    if not url:
        return None
    try:
        # PyJWKClient 는 키를 캐시하므로 매 요청마다 받아오지 않는다.
        return PyJWKClient(f"{url}/auth/v1/.well-known/jwks.json", cache_keys=True)
    except Exception:  # noqa: BLE001 — 구형 프로젝트는 이 엔드포인트가 없다
        return None


def _decode(token: str) -> dict[str, Any]:
    """서명·만료·audience 를 검증하고 payload 를 돌려준다."""
    options = {"verify_aud": True, "require": ["exp", "sub"]}

    # ① 비대칭 — 신형 Supabase 기본값
    client = _jwks_client()
    if client is not None:
        try:
            signing_key = client.get_signing_key_from_jwt(token)
            return jwt.decode(
                token,
                signing_key.key,
                algorithms=["ES256", "RS256"],
                audience=AUDIENCE,
                options=options,
            )
        except jwt.PyJWTError:
            raise
        except Exception:  # noqa: BLE001 — JWKS 를 못 받으면 ②로 내려간다
            pass

    # ② 대칭 — 구형 프로젝트
    secret = os.getenv("SUPABASE_JWT_SECRET", "").strip()
    if secret:
        return jwt.decode(
            token, secret, algorithms=["HS256"], audience=AUDIENCE, options=options
        )

    raise AuthNotConfigured(
        "JWT 검증 수단이 없습니다. SUPABASE_URL(비대칭) 또는 "
        "SUPABASE_JWT_SECRET(대칭) 중 하나를 .env 에 설정하세요."
    )


class CurrentUser:
    """검증된 사용자. user_id 는 auth.users.id 와 같은 값이다."""

    __slots__ = ("user_id", "email", "token")

    def __init__(self, user_id: str, email: str | None, token: str) -> None:
        self.user_id = user_id
        self.email = email
        self.token = token

    def __repr__(self) -> str:  # 로그에 토큰이 찍히지 않게 한다
        return f"CurrentUser(user_id={self.user_id!r})"


def require_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> CurrentUser:
    """로그인이 필요한 엔드포인트에 붙이는 의존성.

    토큰이 없거나 틀리면 401 을 준다. 프론트는 401 을 받으면 로그인 화면으로
    돌려보낸다(세션 만료 포함).
    """
    if credentials is None or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="로그인이 필요합니다.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials

    try:
        payload = _decode(token)
    except AuthNotConfigured as exc:
        # 설정 실수를 401 로 감추면 원인을 못 찾는다. 서버 오류로 드러낸다.
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except jwt.ExpiredSignatureError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="세션이 만료되었습니다. 다시 로그인해 주세요.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
    except jwt.PyJWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="로그인 정보를 확인할 수 없습니다.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="잘못된 토큰입니다.")

    return CurrentUser(user_id=str(user_id), email=payload.get("email"), token=token)
