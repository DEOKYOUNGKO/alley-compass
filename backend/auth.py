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

import logging
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

# uvicorn 콘솔에 함께 찍히도록 uvicorn 로거를 쓴다
_log = logging.getLogger("uvicorn.error")


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


ASYMMETRIC_ALGS = ("ES256", "RS256")

# 서버 시계가 Supabase 보다 몇 초 늦으면 막 발급된 토큰의 iat 가 "미래"로 보여
# ImmatureSignatureError 가 난다. 로그인 직후마다 튕기는 증상이 되므로 여유를 둔다.
CLOCK_LEEWAY_SECONDS = 30


def _decode(token: str) -> dict[str, Any]:
    """서명·만료·audience 를 검증하고 payload 를 돌려준다.

    검증 경로는 토큰 헤더의 alg 로 고른다. JWKS 가 있다고 해서 토큰이 비대칭
    서명이라는 보장은 없다 — 새 키가 standby 인 프로젝트는 공개키를 JWKS 에
    미리 올려 두고도 실제 토큰은 아직 구형 HS256 으로 서명한다. JWKS 부터
    무조건 시도하면 그 토큰은 전부 "키를 찾을 수 없음"으로 거절된다.
    """
    options = {"verify_aud": True, "require": ["exp", "sub"]}
    alg = jwt.get_unverified_header(token).get("alg")

    # ① 비대칭 (ES256 / RS256) — SUPABASE_URL 의 JWKS 공개키로 검증
    if alg in ASYMMETRIC_ALGS:
        client = _jwks_client()
        if client is None:
            raise AuthNotConfigured(
                f"{alg} 토큰을 검증하려면 SUPABASE_URL 이 필요합니다 (JWKS 공개키 조회)."
            )
        signing_key = client.get_signing_key_from_jwt(token)
        return jwt.decode(
            token,
            signing_key.key,
            algorithms=list(ASYMMETRIC_ALGS),
            audience=AUDIENCE,
            options=options,
            leeway=CLOCK_LEEWAY_SECONDS,
        )

    # ② 대칭 (HS256) — 구형 방식. 대시보드의 Legacy JWT Secret 이 필요하다
    if alg == "HS256":
        secret = os.getenv("SUPABASE_JWT_SECRET", "").strip()
        if not secret:
            raise AuthNotConfigured(
                "이 Supabase 프로젝트는 로그인 토큰을 HS256(구형)으로 서명합니다. "
                "대시보드 → Project Settings → JWT Keys 의 Legacy JWT Secret 을 "
                ".env 의 SUPABASE_JWT_SECRET 에 넣거나, JWT Keys 에서 비대칭 키로 "
                "전환(rotate)하세요."
            )
        return jwt.decode(
            token,
            secret,
            algorithms=["HS256"],
            audience=AUDIENCE,
            options=options,
            leeway=CLOCK_LEEWAY_SECONDS,
        )

    raise jwt.InvalidAlgorithmError(f"지원하지 않는 서명 방식입니다: {alg}")


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
        # 화면에는 뭉뚱그린 문구만 주되, 원인은 서버 로그에 남긴다 — 이게 없으면
        # "로그인할 때마다 튕긴다"의 이유(키 불일치·시계·audience)를 알 방법이 없다.
        # 토큰 원문은 찍지 않는다. 헤더(alg·kid)만으로 원인 구분에 충분하다.
        try:
            header = jwt.get_unverified_header(token)
        except jwt.PyJWTError:
            header = {}
        _log.warning(
            "로그인 토큰 검증 실패: %s: %s (alg=%s, kid=%s)",
            type(exc).__name__, exc, header.get("alg"), header.get("kid"),
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="로그인 정보를 확인할 수 없습니다.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="잘못된 토큰입니다.")

    return CurrentUser(user_id=str(user_id), email=payload.get("email"), token=token)
