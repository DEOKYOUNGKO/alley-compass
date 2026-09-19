import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * 조건부 클래스를 합치고, Tailwind 충돌을 뒤에 온 것 우선으로 정리한다.
 *
 *   cn("px-3 py-2", isWide && "px-6", className)
 *   → isWide 면 "py-2 px-6", 그리고 호출자가 넘긴 className 이 항상 최종 승자
 *
 * 모든 UI 컴포넌트가 className prop 을 받아 이 함수를 거치게 해 둔다.
 * 그래야 디자인 시스템 밖에서도 예외 상황을 덧칠할 수 있다.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
