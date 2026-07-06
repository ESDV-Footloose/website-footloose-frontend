import Container from "@/components/containers/Container";

/**
 * Properties passed to the column component.
 */
export type ColumnProps = {
  /**
   * Content to be rendered per column. Each child will be rendered in its own column
   */
  readonly children?: React.ReactNode[];
};

/**
 * Columns component that renders its children in a responsive column layout.
 *
 * @param columnProps Properties passed to the column component.
 * @returns The column component.
 */
export default function Columns({ children }: ColumnProps) {
  return (
    <Container>
      <div className={`flex w-full flex-wrap`}>
        {children?.map((child, index) => (
          <div key={index} className={`flex-1 min-w-full lg:min-w-sm`}>
            {child}
          </div>
        ))}
      </div>
    </Container>
  );
}
