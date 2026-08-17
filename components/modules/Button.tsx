import * as React from "react";

/**
 * Properties passed to the button component.
 */
export type ButtonProps = {
  /**
   * Content rendered inside the button.
   */
  readonly children: React.ReactNode;

  /**
   * Type of the button, can be "button", "submit" or "reset".
   */
  readonly type?: "button" | "submit" | "reset";

  /**
   * Click event handler for the button.
   */
  readonly onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;

  /**
   * Whether the button is disabled or not.
   */
  readonly disabled?: boolean;

  /**
   * Additional classes passed to the button.
   */
  readonly className?: string;
};

/**
 * Button component with a default style that can be used throughout the website.
 *
 * @param buttonProps Properties passed to the button component.
 * @returns The button component.
 */
export default function Button({
  children,
  type = "button",
  onClick,
  disabled = false,
  className = "",
}: ButtonProps) {
  return (
    <button
      className={`flex items-center gap-2 rounded-md border border-footloose px-4 py-2 text-white bg-footloose hover:bg-white hover:border-footloose hover:text-footloose transition-colors duration-300 hover:cursor-pointer ${className}`}
      type={type}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
