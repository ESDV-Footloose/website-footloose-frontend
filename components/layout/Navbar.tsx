"use client";

import React, { useState } from "react";
import Link from "next/link";
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
 * The main site navigation bar with desktop and mobile navigation.
 * @returns {React.Fragment} The Navbar component.
 */
const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 250 ? true : false);
  });

  return (
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
            <Links />
            <CTAs scrolled={scrolled} />
          </div>
          <MobileMenu />
        </div>
      </Container>
    </nav>
  );
};

/**
 * The desktop navigation links.
 * @returns {React.Fragment} The Links component.
 */
const Links = () => {
  return (
    <div className="flex items-center gap-6">
      {links.map((l) => (
        <NavLink key={l.text} href={l.href} menu={l.menu}>
          {l.text}
        </NavLink>
      ))}
    </div>
  );
};

type MenuLink = {
  text: string;
  href: string;
};

type MenuSection = {
  title?: {
    text: string;
    href?: string;
  };
  links: MenuLink[];
};

type NavItem = {
  text: string;
  href: string;
  menu?: MenuSection[];
};

/**
 * A single navigation link with an optional flyout menu.
 * @param {object} props The properties passed to this component.
 * @param {React.Fragment} props.children The visible link text.
 * @param {string} props.href The link destination.
 * @param {MenuSection[]} props.menu Optional flyout menu sections.
 * @returns {React.Fragment} The NavLink component.
 */
const NavLink = ({
  children,
  href,
  menu,
}: {
  children: React.ReactNode;
  href?: string;
  menu?: MenuSection[];
}) => {
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
 * The membership call-to-action button.
 * @param {object} props The properties passed to this component.
 * @param {boolean} props.scrolled Whether the navbar is in its scrolled state.
 * @returns {React.Fragment} The CTAs component.
 */
const CTAs = ({ scrolled = false }: { scrolled?: boolean }) => {
  return (
    <Button className={scrolled ? "" : "hover:border-white!"}>
      <FiUser />
      <span>My Membership</span>
    </Button>
  );
};

/**
 * A desktop dropdown menu for grouped navigation links.
 * @param {object} props The properties passed to this component.
 * @param {MenuSection[]} props.menu The menu sections to render.
 * @returns {React.Fragment} The Dropdown component.
 */
const Dropdown = ({ menu }: { menu: MenuSection[] }) => {
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
 * A single mobile navigation link with optional expandable submenu.
 * @param {object} props The properties passed to this component.
 * @param {React.Fragment} props.children The visible link text.
 * @param {string} props.href The link destination.
 * @param {MenuSection[]} props.menu Optional submenu sections.
 * @param {React.Dispatch<React.SetStateAction<boolean>>} props.setMenuOpen Setter for the mobile menu state.
 * @returns {React.Fragment} The MobileMenuLink component.
 */
const MobileMenuLink = ({
  children,
  href,
  menu,
  setMenuOpen,
}: {
  children: React.ReactNode;
  href: string;
  menu?: MenuSection[];
  setMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
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
            onClick={(e) => {
              e.stopPropagation();
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
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(false);
          }}
          href="#"
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
 * The mobile slide-out navigation menu.
 * @returns {React.Fragment} The MobileMenu component.
 */
const MobileMenu = () => {
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
              {links.map((l) => (
                <MobileMenuLink
                  key={l.text}
                  href={l.href}
                  menu={l.menu}
                  setMenuOpen={setOpen}
                >
                  {l.text}
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

export default Navbar;

const links: NavItem[] = [
  {
    text: "Events",
    href: "/events/",
  },
  {
    text: "Association",
    href: "/welcome-to-footloose/",
    menu: [
      {
        title: {
          text: "Learn about Footloose",
          href: "/welcome-to-footloose/",
        },
        links: [
          {
            text: "What is Footloose?",
            href: "/welcome-to-footloose/",
          },
          {
            text: "Dinner in Luna",
            href: "https://dining.studentencultuur.nl/",
          },
          {
            text: "Yearplanning",
            href: "/agenda-and-planning/",
          },
          {
            text: "Photos",
            href: "https://photos.esdvfootloose.nl/",
          },
          {
            text: "Videos",
            href: "/videos/",
          },
          {
            text: "Merchandise",
            href: "/merchandise/",
          },
          {
            text: "SHOWCASE 2024",
            href: "/showcase-2024/",
          },
        ],
      },
      {
        title: {
          text: "Association Documents",
          href: "/association-documents/",
        },
        links: [
          {
            text: "Declaration form",
            href: "/declaration-forms/",
          },
          {
            text: "Templates and Logos",
            href: "/templates-and-logos/",
          },
        ],
      },
    ],
  },
  {
    text: "Community",
    href: "/committees/",
    menu: [
      {
        title: { text: "Community Info", href: "/community-info/" },
        links: [
          {
            text: "The Board",
            href: "/the-board/",
          },
          {
            text: "Previous boards",
            href: "/previous-boards/",
          },
          {
            text: "Committees",
            href: "/committees/",
          },
          {
            text: "Volunteers",
            href: "/volunteers/",
          },
          {
            text: "Jukebox Journal",
            href: "/jukebox-journal/",
          },
          {
            text: "Confidential Contact Person",
            href: "/confidential-contact-person/",
          },
          {
            text: "SALT – The Scala Newsletter",
            href: "/salt-the-scala-newsletter/",
          },
          {
            text: "Minecraft server",
            href: "/minecraft-server/",
          },
        ],
      },
    ],
  },
  {
    text: "Dancing",
    href: "/dance-courses/",
    menu: [
      {
        title: { text: "Dance Info", href: "/dance-info/" },
        links: [
          {
            text: "Membership and course fees",
            href: "/membership-and-course-fees/",
          },
          {
            text: "Subscribe for dance courses",
            href: "/subscribe-for-dance-courses/",
          },
          {
            text: "Dance groups",
            href: "/dance-groups/",
          },
          {
            text: "Timetable of dance classes",
            href: "/timetable/",
          },
          {
            text: "Hall Reservations",
            href: "/hall-reservations/",
          },
        ],
      },
      {
        title: { text: "Dance courses", href: "/dance-courses/" },
        links: [
          { text: "Ballroom", href: "/ballroom/" },
          { text: "Bachata Sensual", href: "/bachata-sensual/" },
          { text: "Classical Ballet", href: "/classical-ballet/" },
          { text: "Feminine", href: "/feminine/" },
          { text: "Hiphop", href: "/hiphop/" },
          { text: "Improvisation", href: "/improvisation/" },
          { text: "Jazz", href: "/jazz/" },
          { text: "Kizomba", href: "/kizomba/" },
          { text: "Modern", href: "/modern/" },
          { text: "Salsa", href: "/salsa/" },
        ],
      },
      {
        title: { text: "Competitions", href: "/competitions/" },
        links: [
          { text: "BRADO", href: "/brado/" },
          { text: "ETDS", href: "/etds/" },
          { text: "NTDS", href: "/ntds/" },
        ],
      },
    ],
  },
  {
    text: "Collaboration",
    href: "/collaborations/",
    menu: [
      {
        title: { text: "Collaborations Info", href: "/collaborations/" },
        links: [
          {
            text: "Book a workshop",
            href: "/workshops/",
          },
          {
            text: "Collaborations",
            href: "/collaborations/",
          },
          {
            text: "Sister associations",
            href: "/sister-associations/",
          },
          {
            text: "Partners",
            href: "/partners/",
          },
        ],
      },
    ],
  },
  {
    text: "About",
    href: "/contact/",
    menu: [
      {
        title: { text: "About Info", href: "/about-info/" },
        links: [
          {
            text: "Contact",
            href: "/contact/",
          },
          {
            text: "FAQs",
            href: "/faqs/",
          },
        ],
      },
    ],
  },
  {
    text: "My Account",
    href: "/account/",
    menu: [
      {
        title: { text: "Account Info", href: "/account-info/" },
        links: [
          {
            text: "My Profile",
            href: "/user/",
          },
          {
            text: "My Bookings",
            href: "/events/my-bookings/",
          },
          {
            text: "Logout",
            href: "/logout/",
          },
        ],
      },
    ],
  },
];
