"use client";

import React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    Strikethrough,
    List,
    ListOrdered,
    Quote,
    Undo,
    Redo,
    Link as LinkIcon,
    Image as ImageIcon,
    Unlink,
} from "lucide-react";

interface TiptapEditorProps {
    content: string;
    onChange: (_content: string) => void;
    id?: string;
}

export default function TiptapEditor({ content, onChange, id }: TiptapEditorProps) {
    const extensions = React.useMemo(() => [
        StarterKit,
        // Note: Link and Underline are removed from here as they appear to be 
        // included in the StarterKit of this TipTap version, causing duplicate warnings.
        Image.configure({
            inline: true,
            allowBase64: true,
            HTMLAttributes: {
                class: 'rounded-lg max-w-full my-4',
            }
        }),
    ], []);

    const editor = useEditor({
        extensions,
        content: (() => {
            try {
                return content ? JSON.parse(content) : "";
            } catch (_e) {
                return content; // Fallback to plain HTML/Text if invalid JSON
            }
        })(),
        editorProps: {
            attributes: {
                class:
                    "prose dark:prose-invert prose-sm sm:prose-base max-w-none m-5 focus:outline-none min-h-[400px] text-foreground font-normal",
            },
        },
        onUpdate: ({ editor }) => {
            onChange(JSON.stringify(editor.getJSON()));
        },
        immediatelyRender: false,
    }, [extensions]);

    if (!editor) {
        return null;
    }

    const setLink = () => {
        const previousUrl = editor.getAttributes("link").href;
        const url = window.prompt("URL", previousUrl);

        // cancelled
        if (url === null) {
            return;
        }

        // empty
        if (url === "") {
            (editor.chain() as any).focus().extendMarkRange("link").unsetLink().run();
            return;
        }

        // update
        (editor.chain() as any).focus().extendMarkRange("link").setLink({ href: url }).run();
    };

    const addImage = () => {
        const url = window.prompt('Image URL');

        if (url) {
            (editor.chain() as any).focus().setImage({ src: url }).run();
        }
    }

    return (
        <div className="border border-border/50 rounded-xl overflow-hidden bg-background shadow-xl transition-all focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50">
            <div className="bg-muted/5 border-b border-border/50 p-1.5 md:p-3 flex flex-nowrap overflow-x-auto gap-1 md:gap-2 sticky top-0 z-10 backdrop-blur-xl scrollbar-hide no-scrollbar">
                <style jsx>{`
                    .no-scrollbar::-webkit-scrollbar { display: none; }
                    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                `}</style>
                <div className="flex items-center gap-0.5 md:gap-1 bg-muted/10 p-0.5 md:p-1 rounded-lg md:rounded-xl flex-shrink-0">
                    <button
                        type="button"
                        onClick={() => (editor.chain() as any).focus().toggleBold().run()}
                        disabled={!editor.can().chain().focus().toggleBold().run()}
                        className={`p-1.5 md:p-2 rounded-md md:rounded-lg hover:bg-primary/10 transition-all ${editor.isActive("bold") ? "bg-primary text-primary-foreground" : "text-muted-foreground"} focus-visible:ring-2 focus-visible:ring-primary/20 outline-none`}
                        title="Bold"
                        aria-label="Bold"
                    >
                        <Bold className="w-3.5 h-3.5 md:w-[18px] md:h-[18px]" />
                    </button>
                    <button
                        type="button"
                        onClick={() => (editor.chain() as any).focus().toggleItalic().run()}
                        disabled={!editor.can().chain().focus().toggleItalic().run()}
                        className={`p-1.5 md:p-2 rounded-md md:rounded-lg hover:bg-primary/10 transition-all ${editor.isActive("italic") ? "bg-primary text-primary-foreground" : "text-muted-foreground"} focus-visible:ring-2 focus-visible:ring-primary/20 outline-none`}
                        title="Italic"
                        aria-label="Italic"
                    >
                        <Italic className="w-3.5 h-3.5 md:w-[18px] md:h-[18px]" />
                    </button>
                    <button
                        type="button"
                        onClick={() => (editor.chain() as any).focus().toggleUnderline().run()}
                        disabled={!editor.can().chain().focus().toggleUnderline().run()}
                        className={`p-1.5 md:p-2 rounded-md md:rounded-lg hover:bg-primary/10 transition-all ${editor.isActive("underline") ? "bg-primary text-primary-foreground" : "text-muted-foreground"} focus-visible:ring-2 focus-visible:ring-primary/20 outline-none`}
                        title="Underline"
                        aria-label="Underline"
                    >
                        <UnderlineIcon className="w-3.5 h-3.5 md:w-[18px] md:h-[18px]" />
                    </button>
                    <button
                        type="button"
                        onClick={() => (editor.chain() as any).focus().toggleStrike().run()}
                        disabled={!editor.can().chain().focus().toggleStrike().run()}
                        className={`p-1.5 md:p-2 rounded-md md:rounded-lg hover:bg-primary/10 transition-all ${editor.isActive("strike") ? "bg-primary text-primary-foreground" : "text-muted-foreground"} focus-visible:ring-2 focus-visible:ring-primary/20 outline-none`}
                        title="Strikethrough"
                        aria-label="Strikethrough"
                    >
                        <Strikethrough className="w-3.5 h-3.5 md:w-[18px] md:h-[18px]" />
                    </button>
                </div>

                <div className="w-px h-6 bg-border/50 mx-1 self-center flex-shrink-0" />

                <div className="flex items-center gap-0.5 md:gap-1 bg-muted/10 p-0.5 md:p-1 rounded-lg md:rounded-xl flex-shrink-0">
                    <button
                        type="button"
                        onClick={() => (editor.chain() as any).focus().toggleBulletList().run()}
                        className={`p-1.5 md:p-2 rounded-md md:rounded-lg hover:bg-primary/10 transition-all ${editor.isActive("bulletList") ? "bg-primary text-primary-foreground" : "text-muted-foreground"} focus-visible:ring-2 focus-visible:ring-primary/20 outline-none`}
                        title="Bullet List"
                        aria-label="Bullet List"
                    >
                        <List className="w-3.5 h-3.5 md:w-[18px] md:h-[18px]" />
                    </button>
                    <button
                        type="button"
                        onClick={() => (editor.chain() as any).focus().toggleOrderedList().run()}
                        className={`p-1.5 md:p-2 rounded-md md:rounded-lg hover:bg-primary/10 transition-all ${editor.isActive("orderedList") ? "bg-primary text-primary-foreground" : "text-muted-foreground"} focus-visible:ring-2 focus-visible:ring-primary/20 outline-none`}
                        title="Ordered List"
                        aria-label="Ordered List"
                    >
                        <ListOrdered className="w-3.5 h-3.5 md:w-[18px] md:h-[18px]" />
                    </button>
                    <button
                        type="button"
                        onClick={() => (editor.chain() as any).focus().toggleBlockquote().run()}
                        className={`p-1.5 md:p-2 rounded-md md:rounded-lg hover:bg-primary/10 transition-all ${editor.isActive("blockquote") ? "bg-primary text-primary-foreground" : "text-muted-foreground"} focus-visible:ring-2 focus-visible:ring-primary/20 outline-none`}
                        title="Blockquote"
                        aria-label="Blockquote"
                    >
                        <Quote className="w-3.5 h-3.5 md:w-[18px] md:h-[18px]" />
                    </button>
                    <button
                        type="button"
                        onClick={setLink}
                        className={`p-1.5 md:p-2 rounded-md md:rounded-lg hover:bg-primary/10 transition-all ${editor.isActive("link") ? "bg-primary text-primary-foreground" : "text-muted-foreground"} focus-visible:ring-2 focus-visible:ring-primary/20 outline-none`}
                        title="Add Link"
                        aria-label="Add Link"
                    >
                        <LinkIcon className="w-3.5 h-3.5 md:w-[18px] md:h-[18px]" />
                    </button>
                </div>

                <div className="w-px h-6 bg-border/50 mx-1 self-center flex-shrink-0" />

                <div className="flex items-center gap-0.5 md:gap-1 bg-muted/10 p-0.5 md:p-1 rounded-lg md:rounded-xl flex-shrink-0">
                    <button
                        type="button"
                        onClick={() => (editor.chain() as any).focus().unsetLink().run()}
                        disabled={!editor.isActive('link')}
                        className="p-1.5 md:p-2 rounded-md md:rounded-lg hover:bg-primary/10 transition-all text-muted-foreground disabled:opacity-30 focus-visible:ring-2 focus-visible:ring-primary/20 outline-none"
                        title="Remove Link"
                        aria-label="Remove Link"
                    >
                        <Unlink className="w-3.5 h-3.5 md:w-[18px] md:h-[18px]" />
                    </button>
                    <button
                        type="button"
                        onClick={addImage}
                        className="p-1.5 md:p-2 rounded-md md:rounded-lg hover:bg-primary/10 transition-all text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/20 outline-none"
                        title="Add Image"
                        aria-label="Add Image"
                    >
                        <ImageIcon className="w-3.5 h-3.5 md:w-[18px] md:h-[18px]" />
                    </button>
                </div>

                <div className="w-px h-6 bg-border/50 mx-1 self-center flex-shrink-0" />

                <div className="flex items-center gap-0.5 md:gap-1 bg-muted/10 p-0.5 md:p-1 rounded-lg md:rounded-xl flex-shrink-0">
                    <button
                        type="button"
                        onClick={() => (editor.chain() as any).focus().undo().run()}
                        disabled={!editor.can().chain().focus().undo().run()}
                        className="p-1.5 md:p-2 rounded-md md:rounded-lg hover:bg-primary/10 transition-all text-muted-foreground disabled:opacity-30 focus-visible:ring-2 focus-visible:ring-primary/20 outline-none"
                        title="Undo"
                        aria-label="Undo"
                    >
                        <Undo className="w-3.5 h-3.5 md:w-[18px] md:h-[18px]" />
                    </button>
                    <button
                        type="button"
                        onClick={() => (editor.chain() as any).focus().redo().run()}
                        disabled={!editor.can().chain().focus().redo().run()}
                        className="p-1.5 md:p-2 rounded-md md:rounded-lg hover:bg-primary/10 transition-all text-muted-foreground disabled:opacity-30 focus-visible:ring-2 focus-visible:ring-primary/20 outline-none"
                        title="Redo"
                        aria-label="Redo"
                    >
                        <Redo className="w-3.5 h-3.5 md:w-[18px] md:h-[18px]" />
                    </button>
                </div>
            </div>
            <EditorContent editor={editor} className="min-h-[400px] cursor-text" id={id} />
        </div>
    );
}
