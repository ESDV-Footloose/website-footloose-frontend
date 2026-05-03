import * as React from "react";
import Image from "next/image";
import Link from "next/link";

import Container from "@/components/containers/Container";

type TextDecorationNode = {
  type?: "text";
  text: string;
  code?: boolean;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
};

type LinkNode = {
  type: "link";
  url?: string;
  children?: RichTextNode[];
};

type ListItemNode = {
  type: "list-item";
  children?: RichTextNode[];
};

type NestedNode = {
  type: string;
  children?: RichTextNode[];
};

type RichTextNode = TextDecorationNode | LinkNode | ListItemNode | NestedNode;

type ParagraphBlock = {
  type: "paragraph";
  children?: RichTextNode[];
};

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

type HeadingBlock = {
  type: "heading";
  level?: HeadingLevel;
  children?: RichTextNode[];
};

type ListBlock = {
  type: "list";
  format?: "ordered" | "unordered";
  children?: ListItemNode[];
};

type QuoteBlock = {
  type: "quote";
  children?: RichTextNode[];
};

type CodeBlock = {
  type: "code";
  children?: TextDecorationNode[];
};

type RichTextImage = {
  url: string;
  alternativeText: string;
  width: number;
  height: number;
  caption?: string;
};

type ImageBlock = {
  type: "image";
  image?: RichTextImage;
};

type RichTextBlock =
  | ParagraphBlock
  | HeadingBlock
  | ListBlock
  | QuoteBlock
  | CodeBlock
  | ImageBlock;

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
 * @param {TextDecorationNode} node The text node with formatting flags
 * @param {React.Key} key React key for the returned element
 * @returns {React.ReactNode} The rendered text node with appropriate HTML tags for formatting, or a line break if the text is a newline character.
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
 * Render an array of pieces (nodes) of text, where every index contains the same formatting.
 * @param {RichTextNode[] | undefined} children Array of text nodes, split on different formatting.
 * @returns {React.ReactNode | null} Rendered inline content or null if the input is not a valid array of nodes.
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
 * Render a single rich text block. A block represents one of the following:
 * - Paragraph
 * - Heading (levels 1-6)
 * - Ordered list
 * - Unordered list
 * - Quote
 * - Code block
 * - Image
 * @param {RichTextBlock} block Block node to render.
 * @param {React.Key} key React key for the block element.
 * @returns {React.ReactNode | null} Rendered block element or null if the block type is unrecognized or invalid.
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
 * Render the RichText component from Strapi.
 * @param {{ content: RichTextBlock[] }} props The content prop containing the rich text component, consisting of an array of rich text blocks.
 * @returns {JSX.Element} The rendered RichText component wrapped in a container.
 */
export default function RichText({ content }: { content: RichTextBlock[] }) {
  return (
    <Container>
      {content.map((block, key: React.Key) => renderBlock(block, key))}
    </Container>
  );
}
