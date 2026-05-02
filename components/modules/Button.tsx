import * as React from "react";

/**
 * A button component with a default style that can be used throughout the website.
 * @param {object} props The properties passed.
 * @param {string} props.className The additional classes passed.
 * @param {React.Fragment} props.children The content of the button.
 * @returns {React.Fragment} The button component.
 */
type ButtonProps = {
  children: React.ReactNode;
  className?: string;
};

export default function Button({ children, className }: ButtonProps) {
  return (
    <button
      className={`flex items-center gap-2 rounded-md border border-footloose px-4 py-2 text-white bg-footloose hover:bg-white hover:border-footloose hover:text-footloose transition-colors duration-300 hover:cursor-pointer ${className}`}
    >
      {children}
    </button>
  );
}
