import Link from "@tiptap/extension-link";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import { TableKit } from "@tiptap/extension-table";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import {
  EditorContent,
  useEditor,
  useEditorState,
  type Editor,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  BetweenHorizontalStart,
  BetweenVerticalStart,
  Bold,
  Columns3,
  CodeXml,
  CopyPlus,
  Image,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Rows3,
  Table2,
  Trash2,
  Underline as UnderlineIcon,
  Unlink,
  type LucideIcon,
} from "lucide-react";
import { useEffect, type ButtonHTMLAttributes } from "react";

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
  TableKit.configure({
    table: {
      resizable: true,
      HTMLAttributes: {
        class: "tiptap-table",
      },
    },
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
  const isInTable = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => currentEditor.isActive("table"),
  });

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("링크 URL을 입력하세요.", previousUrl ?? "");

    if (url === null) return;
    if (url.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div className="tiptap-toolbar" aria-label="문서 편집 도구">
      <ToolbarButton
        className={editor.isActive("bold") ? "is-active" : ""}
        title="굵게"
        aria-label="굵게"
        onClick={() => editor.chain().focus().toggleBold().run()}
        icon={Bold}
      />
      <ToolbarButton
        className={editor.isActive("italic") ? "is-active" : ""}
        title="기울임"
        aria-label="기울임"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        icon={Italic}
      />
      <ToolbarButton
        className={editor.isActive("underline") ? "is-active" : ""}
        title="밑줄"
        aria-label="밑줄"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        icon={UnderlineIcon}
      />
      <button
        className={editor.isActive("heading", { level: 1 }) ? "is-active" : ""}
        type="button"
        title="제목 1"
        aria-label="제목 1"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        H1
      </button>
      <button
        className={editor.isActive("heading", { level: 2 }) ? "is-active" : ""}
        type="button"
        title="제목 2"
        aria-label="제목 2"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        H2
      </button>
      <button
        className={editor.isActive("heading", { level: 3 }) ? "is-active" : ""}
        type="button"
        title="제목 3"
        aria-label="제목 3"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        H3
      </button>
      <ToolbarButton
        className={editor.isActive("bulletList") ? "is-active" : ""}
        title="글머리 목록"
        aria-label="글머리 목록"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        icon={List}
      />
      <ToolbarButton
        className={editor.isActive("orderedList") ? "is-active" : ""}
        title="번호 목록"
        aria-label="번호 목록"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        icon={ListOrdered}
      />
      <ToolbarButton
        className={editor.isActive("blockquote") ? "is-active" : ""}
        title="인용문"
        aria-label="인용문"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        icon={Quote}
      />
      <ToolbarButton
        className={editor.isActive("codeBlock") ? "is-active" : ""}
        title="코드 블록"
        aria-label="코드 블록"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        icon={CodeXml}
      />
      <ToolbarButton
        className={editor.isActive({ textAlign: "left" }) ? "is-active" : ""}
        title="왼쪽 정렬"
        aria-label="왼쪽 정렬"
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        icon={AlignLeft}
      />
      <ToolbarButton
        className={editor.isActive({ textAlign: "center" }) ? "is-active" : ""}
        title="가운데 정렬"
        aria-label="가운데 정렬"
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        icon={AlignCenter}
      />
      <ToolbarButton
        className={editor.isActive({ textAlign: "right" }) ? "is-active" : ""}
        title="오른쪽 정렬"
        aria-label="오른쪽 정렬"
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        icon={AlignRight}
      />
      <ToolbarButton title="이미지" aria-label="이미지" icon={Image} disabled />
      <ToolbarButton
        className={editor.isActive("link") ? "is-active" : ""}
        title="링크"
        aria-label="링크"
        onClick={setLink}
        icon={Link2}
      />
      <ToolbarButton
        title="링크 해제"
        aria-label="링크 해제"
        onClick={() =>
          editor.chain().focus().extendMarkRange("link").unsetLink().run()
        }
        icon={Unlink}
      />
      <span className="tiptap-toolbar-divider" aria-hidden="true" />
      <ToolbarButton
        title="표 추가 (3 x 3)"
        aria-label="표 추가"
        onClick={() =>
          editor
            .chain()
            .focus()
            .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
            .run()
        }
        disabled={
          !editor.can().insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        }
        icon={Table2}
      />
      {isInTable && (
        <div className="tiptap-table-tools" role="group" aria-label="표 편집 도구">
          <ToolbarButton
            title="아래에 빈 행 추가"
            aria-label="행 추가"
            onClick={() => editor.chain().focus().addRowAfter().run()}
            disabled={!editor.can().addRowAfter()}
            icon={BetweenHorizontalStart}
          />
          <ToolbarButton
            title="현재 행 복사"
            aria-label="행 복사"
            onClick={() => duplicateCurrentTableRow(editor)}
            disabled={!canDuplicateCurrentTableRow(editor)}
            icon={CopyPlus}
          />
          <ToolbarButton
            title="현재 행 삭제"
            aria-label="행 삭제"
            onClick={() => editor.chain().focus().deleteRow().run()}
            disabled={!editor.can().deleteRow()}
            icon={Rows3}
          />
          <ToolbarButton
            title="오른쪽에 열 추가"
            aria-label="열 추가"
            onClick={() => editor.chain().focus().addColumnAfter().run()}
            disabled={!editor.can().addColumnAfter()}
            icon={BetweenVerticalStart}
          />
          <ToolbarButton
            title="현재 열 삭제"
            aria-label="열 삭제"
            onClick={() => editor.chain().focus().deleteColumn().run()}
            disabled={!editor.can().deleteColumn()}
            icon={Columns3}
          />
          <ToolbarButton
            className="is-danger"
            title="표 삭제"
            aria-label="표 삭제"
            onClick={() => editor.chain().focus().deleteTable().run()}
            disabled={!editor.can().deleteTable()}
            icon={Trash2}
          />
        </div>
      )}
    </div>
  );
}

function findCurrentTableRow(editor: Editor) {
  const { $from } = editor.state.selection;

  for (let depth = $from.depth; depth > 0; depth -= 1) {
    const node = $from.node(depth);
    if (node.type.name === "tableRow") {
      return { node, insertPos: $from.after(depth) };
    }
  }

  return null;
}

function canDuplicateCurrentTableRow(editor: Editor) {
  return findCurrentTableRow(editor) !== null;
}

function duplicateCurrentTableRow(editor: Editor) {
  const row = findCurrentTableRow(editor);
  if (!row) return false;

  const transaction = editor.state.tr.insert(
    row.insertPos,
    row.node.copy(row.node.content),
  );
  editor.view.dispatch(transaction.scrollIntoView());
  editor.commands.focus();
  return true;
}

function ToolbarButton({
  icon: Icon,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { icon: LucideIcon }) {
  return (
    <button type="button" {...props}>
      <Icon size={15} strokeWidth={2.15} aria-hidden="true" />
    </button>
  );
}
