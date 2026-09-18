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
