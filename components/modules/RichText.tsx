import * as React from "react";
import Image from "next/image";
import Link from "next/link";

import Container from "@/components/containers/Container";

/**
 * Text node with optional inline formatting.
 */
export type TextDecorationNode = {
  readonly type?: "text";
  readonly text: string;
  readonly code?: boolean;
  readonly bold?: boolean;
  readonly italic?: boolean;
  readonly underline?: boolean;
  readonly strikethrough?: boolean;
};

/**
 * Link node inside rich text content.
 */
export type LinkNode = {
  readonly type: "link";
  readonly url?: string;
  readonly children?: RichTextNode[];
};

/**
 * List item node inside ordered or unordered lists.
 */
export type ListItemNode = {
  readonly type: "list-item";
  readonly children?: RichTextNode[];
};

/**
 * Generic nested rich text node.
 */
export type NestedNode = {
  readonly type: string;
  readonly children?: RichTextNode[];
};

/**
 * Inline rich text node.
 */
export type RichTextNode =
  | TextDecorationNode
  | LinkNode
  | ListItemNode
  | NestedNode;

/**
 * Paragraph block in rich text content.
 */
export type ParagraphBlock = {
  readonly type: "paragraph";
  readonly children?: RichTextNode[];
};

/**
 * Supported heading levels.
 */
export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Heading block in rich text content.
 */
export type HeadingBlock = {
  readonly type: "heading";
  readonly level?: HeadingLevel;
  readonly children?: RichTextNode[];
};

/**
 * Ordered or unordered list block in rich text content.
 */
export type ListBlock = {
  readonly type: "list";
  readonly format?: "ordered" | "unordered";
  readonly children?: ListItemNode[];
};

/**
 * Quote block in rich text content.
 */
export type QuoteBlock = {
  readonly type: "quote";
  readonly children?: RichTextNode[];
};

/**
 * Code block in rich text content.
 */
export type CodeBlock = {
  readonly type: "code";
  readonly children?: TextDecorationNode[];
};

/**
 * Image data used by an image block.
 */
export type RichTextImage = {
  readonly url: string;
  readonly alternativeText: string;
  readonly width: number;
  readonly height: number;
  readonly caption?: string;
};

/**
 * Image block in rich text content.
 */
export type ImageBlock = {
  readonly type: "image";
  readonly image?: RichTextImage;
};

/**
 * Rich text block supported by the renderer.
 */
export type RichTextBlock =
  | ParagraphBlock
  | HeadingBlock
  | ListBlock
  | QuoteBlock
  | CodeBlock
  | ImageBlock;

/**
 * Properties passed to the rich text component.
 */
export type RichTextProps = {
  /**
   * Rich text blocks rendered by the component.
   */
  readonly content: RichTextBlock[];
};

const titleSizeClasses = {
  1: "text-4xl md:text-5xl font-semibold",
  2: "text-3xl md:text-4xl font-semibold",
  3: "text-2xl md:text-3xl font-semibold",
  4: "text-xl md:text-2xl font-semibold",
  5: "text-lg font-semibold",
  6: "text-lg italic",
};

/**
 * Render a single text-decoration node into React output.
 *
 * @param node Text node with formatting flags.
 * @param key React key for the returned element.
 * @returns Rendered text node.
 */
function renderTextDecoration(node: TextDecorationNode, key: React.Key) {
  if (node.text === "\n") return <br key={key} />;

  let content: React.ReactNode = node.text;

  if (node.code) content = <code>{content}</code>;
  if (node.bold) content = <strong>{content}</strong>;
  if (node.italic) content = <em>{content}</em>;
  if (node.underline) content = <u>{content}</u>;
  if (node.strikethrough) content = <s>{content}</s>;

  return <React.Fragment key={key}>{content}</React.Fragment>;
}

/**
 * Render inline rich text nodes.
 *
 * @param children Inline rich text nodes to render.
 * @returns Rendered inline content, or null when the input is invalid.
 */
function renderTextContent(children?: RichTextNode[]) {
  if (!Array.isArray(children)) return null;

  return children.map((child, index) => {
    const node = child;

    if ((node.type === "text" || node.type === undefined) && "text" in node) {
      return renderTextDecoration(node, index);
    }

    if (node.type === "link") {
      const href =
        "url" in node && typeof node.url === "string" ? node.url : "#";
      const external = /^https?:\/\//i.test(href);

      return (
        <Link
          key={index}
          href={href}
          className="underline text-footloose"
          {...(external
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {})}
        >
          {renderTextContent(node.children)}
        </Link>
      );
    }

    if (!("children" in node) || !node.children?.length) return null;

    return (
      <React.Fragment key={index}>
        {renderTextContent(node.children)}
      </React.Fragment>
    );
  });
}

/**
 * Render a single rich text block.
 *
 * @param block Rich text block to render.
 * @param key React key for the returned element.
 * @returns Rendered block element, or null when the block is invalid.
 */
function renderBlock(block: RichTextBlock, key: React.Key) {
  switch (block.type) {
    case "paragraph":
      return <p key={key}>{renderTextContent(block.children)}</p>;

    case "heading": {
      const level = block.level ?? 2;
      const Tag = `h${level}` as keyof React.JSX.IntrinsicElements;

      return (
        <Tag key={key} className={titleSizeClasses[level]}>
          {renderTextContent(block.children)}
        </Tag>
      );
    }

    case "list": {
      const items = block.children ?? [];

      if (block.format === "ordered") {
        return (
          <ol key={key} className="list-decimal list-inside">
            {items.map((item, i: number) => (
              <li key={i}>{renderTextContent(item.children)}</li>
            ))}
          </ol>
        );
      }

      return (
        <ul key={key} className="list-disc list-inside">
          {items.map((item, i: number) => (
            <li key={i}>{renderTextContent(item.children)}</li>
          ))}
        </ul>
      );
    }

    case "quote":
      return (
        <blockquote
          key={key}
          className="my-4 border-l-4 border-footloose bg-neutral-100 px-4 py-3 italic"
        >
          {renderTextContent(block.children)}
        </blockquote>
      );

    case "code":
      return (
        <pre
          key={key}
          className="my-4 overflow-auto rounded-md bg-neutral-950 p-4 text-sm text-neutral-100"
        >
          <code>{(block.children ?? []).map((c) => c.text).join("")}</code>
        </pre>
      );

    case "image": {
      const image = block.image;

      if (!image?.url || !image?.width || !image?.height) return null;

      return (
        <figure key={key} className="my-6">
          <Image
            src={image.url}
            alt={image.alternativeText}
            width={image.width}
            height={image.height}
            className="max-w-5xl"
            unoptimized
          />
          {image.caption && (
            <figcaption className="mt-2 text-sm text-neutral-500 italic">
              {image.caption}
            </figcaption>
          )}
        </figure>
      );
    }
  }
}

/**
 * Render rich text content from Strapi.
 *
 * @param richTextProps Properties passed to the rich text component.
 * @returns The rendered rich text component.
 */
export default function RichText({ content }: RichTextProps) {
  return (
    <Container>
      {content.map((block, key: React.Key) => renderBlock(block, key))}
    </Container>
  );
}
