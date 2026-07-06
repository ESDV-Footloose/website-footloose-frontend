"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiMenu,
  FiArrowRight,
  FiX,
  FiChevronDown,
  FiUser,
} from "react-icons/fi";
import {
  useMotionValueEvent,
  AnimatePresence,
  useScroll,
  motion,
} from "framer-motion";
import useMeasure from "react-use-measure";

import Container from "@/components/containers/Container";
import Button from "@/components/modules/Button";

import Logo from "@/assets/svg/logo-no-txt.svg";

/**
 * Link inside a dropdown menu section.
 *
 * @internal
 */
export type MenuLink = {
  /**
   * Visible link text.
   */
  readonly text: string;

  /**
   * Link destination.
   */
  readonly href: string;
};

/**
 * Group of links inside a dropdown menu.
 *
 * @internal
 */
export type MenuSection = {
  /**
   * Optional title shown above the section links.
   */
  readonly title?: {
    /**
     * Visible title text.
     */
    readonly text: string;

    /**
     * Optional title destination.
     */
    readonly href?: string;
  };

  /**
   * Links shown inside the section.
   */
  readonly links: MenuLink[];
};

/**
 * Main navigation item.
 *
 * @internal
 */
export type NavItem = {
  /**
   * Visible navigation text.
   */
  readonly text: string;

  /**
   * Main link destination.
   */
  readonly href: string;

  /**
   * Optional dropdown menu sections.
   */
  readonly menu?: MenuSection[];
};

/**
 * Properties passed to the navigation link component.
 *
 * @internal
 */
export type NavLinkProps = {
  /**
   * Visible link content.
   */
  readonly children: React.ReactNode;

  /**
   * Link destination.
   */
  readonly href?: string;

  /**
   * Optional flyout menu sections.
   */
  readonly menu?: MenuSection[];
};

/**
 * Properties passed to the call-to-action component.
 *
 * @internal
 */
export type CTAsProps = {
  /**
   * Whether the navbar is in its scrolled state.
   */
  readonly scrolled?: boolean;
};

/**
 * Properties passed to the dropdown component.
 *
 * @internal
 */
export type DropdownProps = {
  /**
   * Menu sections rendered inside the dropdown.
   */
  readonly menu: MenuSection[];
};

/**
 * Properties passed to the mobile menu link component.
 *
 * @internal
 */
export type MobileMenuLinkProps = {
  /**
   * Visible link content.
   */
  readonly children: React.ReactNode;

  /**
   * Link destination.
   */
  readonly href: string;

  /**
   * Optional submenu sections.
   */
  readonly menu?: MenuSection[];

  /**
   * Setter used to close the mobile menu.
   */
  readonly setMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

/**
 * Routes where the navbar is always solid, regardless of scroll position.
 *
 * @internal
 */
const ALWAYS_SOLID_ROUTES = ["/login", "/register"];

/**
 * Main site navigation bar with desktop and mobile navigation.
 *
 * @param links Navigation structure used to build all menu items and dropdowns.
 * @returns The navbar component.
 */
export const Navbar = ({ links }: { links: NavItem[] }) => {
  const pathname = usePathname();
  const forceSolid = ALWAYS_SOLID_ROUTES.includes(pathname);

  const [scrolledPastThreshold, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 250);
  });

  const scrolled = forceSolid ? true : scrolledPastThreshold;

  return (
    <>
      <nav
        className={`fixed top-0 z-50 w-full 
      transition-all duration-300 ease-out border-b
      ${
        scrolled
          ? "bg-white text-black py-3 shadow-md border-black/20 "
          : "bg-white/0 text-white py-6 shadow-none border-black/0"
      }`}
      >
        <Container className="py-0!">
          <div className="mx-auto flex items-center justify-between">
            <Link href="/">
              <Logo className="h-8 w-auto" />
            </Link>

            <div className="hidden gap-6 lg:flex">
              <Links links={links} />
              <CTAs scrolled={scrolled} />
            </div>
            <MobileMenu links={links} />
          </div>
        </Container>
      </nav>
      {forceSolid && <div className="h-[32]" />}
    </>
  );
};

/**
 * Desktop navigation links. Renders a horizontal list of navigation items.
 *
 * @internal
 * @returns The desktop links component.
 */
export const Links = ({ links = [] }: { links?: NavItem[] }) => {
  return (
    <div className="flex items-center gap-6">
      {links.map((link) => (
        <NavLink key={link.text} href={link.href} menu={link.menu}>
          {link.text}
        </NavLink>
      ))}
    </div>
  );
};

/**
 * Single navigation link with an optional flyout menu. Opens a dropdown menu on hover.
 *
 * @internal
 * @param navLinkProps Properties passed to the navigation link component.
 * @returns The navigation link component.
 */
export const NavLink = ({ children, href, menu }: NavLinkProps) => {
  const [open, setOpen] = useState(false);

  const showFlyout = menu && open;

  return (
    <div
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      className="relative h-fit w-fit"
    >
      <Link href={href ?? "#"} className="relative flex items-center gap-1">
        {children}
        {menu && <FiChevronDown size={18} className="mt-1" />}
        <span
          style={{
            transform: open ? "scaleX(1)" : "scaleX(0)",
          }}
          className="absolute -bottom-2 -left-2 -right-2 h-0.5 origin-left scale-x-0 bg-footloose transition-transform duration-300 ease-out"
        />
      </Link>

      <AnimatePresence>
        {showFlyout && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            style={{ translateX: "-50%" }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="absolute left-1/2 top-12 bg-white text-black"
          >
            <div className="absolute -top-6 left-0 right-0 h-6 bg-transparent" />
            <div className="absolute left-1/2 top-0 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-white border border-black/5 z-10" />
            <Dropdown menu={menu} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * Membership call-to-action button.
 *
 * @internal
 * @param ctasProps Properties passed to the call-to-action component.
 * @returns The call-to-action component.
 */
export const CTAs = ({ scrolled = false }: CTAsProps) => {
  return (
    <Button className={scrolled ? "" : "hover:border-white!"}>
      <FiUser />
      <span>My Membership</span>
    </Button>
  );
};

/**
 * Desktop dropdown menu for grouped navigation links.
 *
 * @internal
 * @param dropdownProps Properties passed to the dropdown component.
 * @returns The dropdown component.
 */
export const Dropdown = ({ menu }: DropdownProps) => {
  return (
    <div className="w-full relative z-20 lg:bg-white pt-6 lg:p-6 shadow-none lg:w-62.5 lg:shadow-md">
      <div className="grid grid-cols-2 lg:grid-cols-1 lg:gap-2">
        {menu.map((submenu, key) => (
          <div
            key={key}
            className={`${key === menu.length - 1 ? "mb-0" : "mb-3"} space-y-2`}
          >
            {submenu.title &&
              (submenu.title.href ? (
                <Link className="font-semibold" href={submenu.title.href}>
                  {submenu.title.text}
                </Link>
              ) : (
                <h3 className="font-semibold">{submenu.title.text}</h3>
              ))}

            {submenu.links.map((link, key_) => (
              <Link
                href={link.href}
                key={key_}
                className="block text-sm hover:underline"
              >
                {link.text}
              </Link>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Single mobile navigation link with an optional expandable submenu.
 *
 * @internal
 * @param mobileMenuLinkProps Properties passed to the mobile menu link component.
 * @returns The mobile menu link component.
 */
export const MobileMenuLink = ({
  children,
  href,
  menu,
  setMenuOpen,
}: MobileMenuLinkProps) => {
  const [ref, { height }] = useMeasure();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative text-neutral-950">
      {menu ? (
        <div
          className="flex w-full cursor-pointer items-center justify-between border-b border-neutral-300 py-6 text-start text-2xl font-semibold"
          onClick={() => setOpen((pv) => !pv)}
        >
          <a
            onClick={(event) => {
              event.stopPropagation();
              setMenuOpen(false);
            }}
            href={href}
          >
            {children}
          </a>

          <motion.div
            animate={{ rotate: open ? "180deg" : "0deg" }}
            transition={{
              duration: 0.3,
              ease: "easeOut",
            }}
          >
            <FiChevronDown />
          </motion.div>
        </div>
      ) : (
        <a
          onClick={(event) => {
            event.stopPropagation();
            setMenuOpen(false);
          }}
          href={href}
          className="flex w-full cursor-pointer items-center justify-between border-b border-neutral-300 py-6 text-start text-2xl font-semibold"
        >
          <span>{children}</span>
          <FiArrowRight />
        </a>
      )}

      {menu && (
        <motion.div
          initial={false}
          animate={{
            height: open ? height : "0px",
            marginBottom: open ? "24px" : "0px",
            marginTop: open ? "12px" : "0px",
          }}
          className="overflow-hidden"
        >
          <div ref={ref}>
            <Dropdown menu={menu} />
          </div>
        </motion.div>
      )}
    </div>
  );
};

/**
 * Mobile slide-out navigation menu.
 *
 * @internal
 * @param links Navigation structure used to build mobile menu items.
 * @returns The mobile menu component.
 */
export const MobileMenu = ({ links = [] }: { links?: NavItem[] }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="block lg:hidden">
      <button onClick={() => setOpen(true)} className="block text-3xl">
        <FiMenu />
      </button>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ x: "100vw" }}
            animate={{ x: 0 }}
            exit={{ x: "100vw" }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="fixed left-0 top-0 flex h-screen w-full flex-col bg-white"
          >
            <div className="flex items-center justify-between p-6">
              <Logo />
              <button onClick={() => setOpen(false)}>
                <FiX className="text-3xl text-neutral-950" />
              </button>
            </div>

            <div className="h-screen overflow-y-scroll scrollbar-hide bg-neutral-100 p-6">
              {links.map((link) => (
                <MobileMenuLink
                  key={link.text}
                  href={link.href}
                  menu={link.menu}
                  setMenuOpen={setOpen}
                >
                  {link.text}
                </MobileMenuLink>
              ))}
            </div>

            <div className="flex justify-end bg-neutral-950 p-6">
              <CTAs />
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </div>
  );
};
