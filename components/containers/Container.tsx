/**
 * Properties passed to the container component.
 */
export type ContainerProps = {
  /**
   * Content rendered inside the container.
   */
  readonly children?: React.ReactNode;

  /**
   * Additional classes passed to the inner container.
   */
  readonly className?: string;

  /**
   * Additional classes passed to the outer wrapper.
   */
  readonly innerClassName?: string;

  /**
   * Optional id assigned to the outer wrapper.
   */
  readonly id?: string;
};

/**
 * Centered container wrapper used to constrain page content width and give default spacing.
 *
 * @param containerProps Properties passed to the container component.
 * @returns The container component.
 */
export default function Container({
  children,
  className = "",
  innerClassName = "",
  id,
}: ContainerProps) {
  return (
    <div id={id} className={`flex justify-center w-full ${innerClassName}`}>
      <div
        className={`w-full max-w-500 px-4 md:px-8 lg:px-16 py-16 ${className}`}
      >
        {children}
      </div>
    </div>
  );
}
