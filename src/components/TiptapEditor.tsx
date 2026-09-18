import Link from "@tiptap/extension-link";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";

const extensions = [
  StarterKit.configure({
    codeBlock: {
      HTMLAttributes: {
        class: "tiptap-code-block",
      },
    },
  }),
  Link.configure({
    openOnClick: false,
    autolink: true,
  }),
  TaskList,
  TaskItem.configure({
    nested: true,
  }),
  Underline,
  TextAlign.configure({
    types: ["heading", "paragraph"],
  }),
];

type TiptapEditorProps = {
  content: string;
  editable: boolean;
  onChange?: (html: string) => void;
};

export function TiptapEditor({
  content,
  editable,
  onChange,
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions,
    content,
    editable,
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
  });

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(editable);
  }, [editable, editor]);

  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() !== content) {
      editor.commands.setContent(content || "<p></p>", { emitUpdate: false });
    }
  }, [content, editor]);

  return (
    <div className={`tiptap-shell ${editable ? "is-editable" : "is-readonly"}`}>
      {editable && editor && <TiptapToolbar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}

function TiptapToolbar({ editor }: { editor: Editor }) {
  return (
    <div className="tiptap-toolbar" aria-label="문서 편집 도구">
      <button
        className={editor.isActive("bold") ? "is-active" : ""}
        type="button"
        title="굵게"
        aria-label="굵게"
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <strong>B</strong>
      </button>
      <button
        className={editor.isActive("italic") ? "is-active" : ""}
        type="button"
        title="기울임"
        aria-label="기울임"
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <em>I</em>
      </button>
      <button
        className={editor.isActive("underline") ? "is-active" : ""}
        type="button"
        title="밑줄"
        aria-label="밑줄"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <span className="toolbar-underlined">U</span>
      </button>
      <button
        className={editor.isActive("heading", { level: 1 }) ? "is-active" : ""}
        type="button"
        title="제목"
        aria-label="제목"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        H1
      </button>
      <button
        className={editor.isActive("heading", { level: 2 }) ? "is-active" : ""}
        type="button"
        title="제목"
        aria-label="제목"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        H2
      </button>
      <button
        className={editor.isActive("bulletList") ? "is-active" : ""}
        type="button"
        title="글머리 목록"
        aria-label="글머리 목록"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        •
      </button>
      <button
        className={editor.isActive("orderedList") ? "is-active" : ""}
        type="button"
        title="번호 목록"
        aria-label="번호 목록"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        1.
      </button>
      <button
        className={editor.isActive("taskList") ? "is-active" : ""}
        type="button"
        title="체크리스트"
        aria-label="체크리스트"
        onClick={() => editor.chain().focus().toggleTaskList().run()}
      >
        ☑
      </button>
      <button
        className={editor.isActive("blockquote") ? "is-active" : ""}
        type="button"
        title="인용문"
        aria-label="인용문"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        ❝
      </button>
      <button
        type="button"
        title="구분선"
        aria-label="구분선"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        —
      </button>
      <button
        className={editor.isActive("codeBlock") ? "is-active" : ""}
        type="button"
        title="코드 블록"
        aria-label="코드 블록"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      >
        &lt;/&gt;
      </button>
    </div>
  );
}
