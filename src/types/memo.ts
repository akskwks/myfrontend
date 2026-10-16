/**
*
* 파일명 : memo.ts
* 역할 : 메모 데이터, 분류 및 입력값의 TypeScript 타입을 정의하는 파일
* 생성일 : 2026-09-17
*
**/

export type MemoSort = "general" | "code" | "todo" | "etc";

export type Memo = {
  memoId: number;
  memoTitle: string;
  memoCnnt: string;
  memoSort: MemoSort;
  createdAt: string;
  updatedAt: string;
};

export type MemoPayload = Pick<Memo, "memoTitle" | "memoCnnt" | "memoSort">;

export type MemoTemplateOption = {
  value: MemoSort;
  label: string;
  placeholder: string;
};
