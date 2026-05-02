/**
 * A centered container wrapper used to constrain page content width.
 * @param {object} props The properties passed to this component.
 * @param {string} props.id The optional id assigned to the outer wrapper.
 * @param {string} props.className The additional classes passed to the inner container.
 * @param {string} props.innerClassName The additional classes passed to the outer wrapper.
 * @param {React.Fragment} props.children The content rendered inside the container.
 * @returns {React.Fragment} The Container component.
 */
export default function Container({
  id,
  className,
  innerClassName,
  children,
}: {
  id?: string;
  className?: string;
  innerClassName?: string;
  children?: React.ReactNode;
}) {
  return (
    <>
      <div id={id} className={`flex justify-center w-full ${innerClassName}`}>
        <div
          className={`w-full max-w-500 px-4 md:px-8 lg:px-16 py-16 ${className}`}
        >
          {children}
        </div>
      </div>
    </>
  );
}
