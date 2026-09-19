#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
골목 컴퍼스 — 계정 생성 (운영자용)

서비스에 로그인할 계정을 하나 만든다. 아직 회원가입을 열지 않았거나,
관리자 계정을 먼저 넣어 두고 싶을 때 쓴다.

    cd backend
    python scripts/create_user.py admin@example.com

비밀번호는 화면에 입력한다(입력 중 표시되지 않는다). 스크립트는 비밀번호를
어디에도 기록하지 않고 Supabase 로 바로 넘긴다. 명령행 인자로 받지 않는 이유는
셸 히스토리와 프로세스 목록에 그대로 남기 때문이다.

`--confirm` 없이 만들면 Supabase 가 확인 메일을 보낸다. 기본값은 확인 완료
상태로 만드는 것이다 — 운영자가 직접 만드는 계정이라 메일 확인 단계가 의미 없다.

필요한 것: alley_compass_etl/.env 의 SUPABASE_URL, SUPABASE_SECRET_KEY
(secret key 는 서버 전용이다. 프론트엔드에 넣지 않는다.)
"""

from __future__ import annotations

import argparse
import getpass
import os
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
ETL_DIR = BACKEND_DIR.parent / "alley_compass_etl"
sys.path.insert(0, str(ETL_DIR))

from dotenv import load_dotenv  # noqa: E402
from supabase import create_client  # noqa: E402

load_dotenv(ETL_DIR / ".env")

MIN_PASSWORD_LENGTH = 8


def main() -> int:
    parser = argparse.ArgumentParser(description="골목 컴퍼스 로그인 계정 생성")
    parser.add_argument("email", help="로그인에 쓸 이메일")
    parser.add_argument(
        "--no-confirm",
        action="store_true",
        help="이메일 확인을 거치게 한다 (기본값: 확인 완료 상태로 생성)",
    )
    args = parser.parse_args()

    url = os.getenv("SUPABASE_URL", "").strip()
    secret = os.getenv("SUPABASE_SECRET_KEY", "").strip()

    if not url or not secret:
        print(
            "SUPABASE_URL 과 SUPABASE_SECRET_KEY 가 필요합니다.\n"
            f"  {ETL_DIR / '.env'} 를 확인하세요.",
            file=sys.stderr,
        )
        return 1

    # 비밀번호는 두 번 받아 오타를 막는다. 한 번 틀리면 로그인이 안 되는데
    # 원인을 찾기 어렵다.
    password = getpass.getpass("비밀번호: ")
    if len(password) < MIN_PASSWORD_LENGTH:
        print(f"비밀번호는 {MIN_PASSWORD_LENGTH}자 이상이어야 합니다.", file=sys.stderr)
        return 1
    if password != getpass.getpass("비밀번호 확인: "):
        print("두 번 입력한 비밀번호가 다릅니다.", file=sys.stderr)
        return 1

    supabase = create_client(url, secret)

    try:
        response = supabase.auth.admin.create_user(
            {
                "email": args.email,
                "password": password,
                "email_confirm": not args.no_confirm,
            }
        )
    except Exception as exc:  # noqa: BLE001 — 원인을 그대로 보여주는 편이 낫다
        message = str(exc)
        if "already" in message.lower():
            print(f"{args.email} 는 이미 등록된 계정입니다.", file=sys.stderr)
        else:
            print(f"계정 생성 실패: {message}", file=sys.stderr)
        return 1
    finally:
        del password  # 메모리에 오래 남기지 않는다

    user = response.user
    if user is None:
        print("계정이 생성되지 않았습니다. Supabase 대시보드를 확인하세요.", file=sys.stderr)
        return 1

    print(f"생성 완료 — {user.email}")
    print(f"  user_id: {user.id}")
    if args.no_confirm:
        print("  확인 메일을 보냈습니다. 링크를 눌러야 로그인할 수 있습니다.")
    else:
        print("  바로 로그인할 수 있습니다.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
